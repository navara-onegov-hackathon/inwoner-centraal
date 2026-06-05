import type { OverzichtResponse, RawBrief } from '../types/overzicht';

export type BrievenTabId = 'verzonden' | 'verwacht';
export type BriefStatus = BrievenTabId;

export interface BrievenViewItem {
  id: string;
  organisatie: string;
  type: string;
  title: string;
  description: string;
  status: BriefStatus;
  statusLabel: string;
  verzondenOp: string;
  dateLabel: string;
  relativeLabel: string;
  daysFromReference: number;
  daysAfterDeath: number;
  actieVereist: boolean;
  actieOmschrijving: string | null;
  aanhef: string;
  geadresseerde: string;
  briefCode: string;
  wettelijkeReactietermijnDagen: number | null;
  adresLabel: string;
  adresHint: string;
}

export interface BrievenViewModel {
  referenceDate: string;
  referenceDateLabel: string;
  referenceSubtitle: string;
  counts: {
    totaal: number;
    verzonden: number;
    verwacht: number;
    actieVereist: number;
  };
  tabs: Record<BrievenTabId, BrievenViewItem[]>;
}

export function mapCorrespondentieToBrievenView(overzicht: OverzichtResponse): BrievenViewModel {
  const referenceDate = addDays(overzicht.persona.overlijdensdatum, 8);
  const items = overzicht.correspondentie
    .map((brief) => mapBrief(brief, referenceDate, overzicht.persona.overlijdensdatum))
    .sort((a, b) => a.verzondenOp.localeCompare(b.verzondenOp));

  const verzonden = items.filter((item) => item.status === 'verzonden');
  const verwacht = items.filter((item) => item.status === 'verwacht');

  return {
    referenceDate,
    referenceDateLabel: formatDateLong(referenceDate),
    referenceSubtitle: `8 dagen na overlijden van ${overzicht.persona.overledene}`,
    counts: {
      totaal: items.length,
      verzonden: verzonden.length,
      verwacht: verwacht.length,
      actieVereist: items.filter((item) => item.actieVereist).length,
    },
    tabs: {
      verzonden,
      verwacht,
    },
  };
}

function mapBrief(brief: RawBrief, referenceDate: string, deathDate: string): BrievenViewItem {
  const daysFromReference = differenceInDays(brief.verzonden_op, referenceDate);
  const daysAfterDeath = typeof brief.dagen_na_overlijden === 'number'
    ? brief.dagen_na_overlijden
    : differenceInDays(brief.verzonden_op, deathDate);
  const status: BriefStatus = daysFromReference <= 0 ? 'verzonden' : 'verwacht';

  return {
    id: brief.id,
    organisatie: brief.organisatie,
    type: brief.type,
    title: buildTitle(brief),
    description: buildDescription(brief, status, daysFromReference),
    status,
    statusLabel: status === 'verzonden' ? 'Verzonden' : 'Verwacht',
    verzondenOp: brief.verzonden_op,
    dateLabel: formatDateLong(brief.verzonden_op),
    relativeLabel: buildRelativeLabel(daysAfterDeath, daysFromReference, status),
    daysFromReference,
    daysAfterDeath,
    actieVereist: brief.actie_vereist,
    actieOmschrijving: brief.actie_omschrijving,
    aanhef: brief.aanhef,
    geadresseerde: brief.geadresseerde,
    briefCode: brief.brief_code ?? 'Onbekend',
    wettelijkeReactietermijnDagen: brief.wettelijke_reactietermijn_dagen ?? null,
    adresLabel: brief.adres ? formatAddress(brief.adres) : 'Adres onbekend',
    adresHint: brief.adres?.verzorgingstehuis ? 'Adres van het verzorgingstehuis' : 'Correspondentieadres',
  };
}

function buildTitle(brief: RawBrief): string {
  if (brief.type === 'condoleance') return `Condoleance van ${brief.organisatie}`;
  if (brief.type === 'informatiebrief') return `Informatiebrief van ${brief.organisatie}`;
  if (brief.type === 'factuur') return `Factuur van ${brief.organisatie}`;
  if (brief.type === 'beschikking') return `Beschikking van ${brief.organisatie}`;
  if (brief.type === 'terugvordering') return `Terugvordering van ${brief.organisatie}`;
  if (brief.type === 'actiebrief') return `Actiebrief van ${brief.organisatie}`;
  return `${brief.type} van ${brief.organisatie}`;
}

function buildDescription(brief: RawBrief, status: BriefStatus, daysFromReference: number): string {
  if (brief.actie_omschrijving) return brief.actie_omschrijving;
  if (status === 'verwacht') {
    return daysFromReference === 1
      ? 'Deze brief wordt naar verwachting morgen verzonden.'
      : `Deze brief wordt naar verwachting over ${daysFromReference} dagen verzonden.`;
  }
  return 'Deze brief is verzonden en vraagt geen actie.';
}

function buildRelativeLabel(daysAfterDeath: number, daysFromReference: number, status: BriefStatus): string {
  const deathLabel = daysAfterDeath === 1 ? '1 dag na overlijden' : `${daysAfterDeath} dagen na overlijden`;
  if (status === 'verzonden') {
    if (daysFromReference === 0) return `${deathLabel}, vandaag`;
    const ago = Math.abs(daysFromReference);
    return `${deathLabel}, ${ago === 1 ? 'gisteren' : `${ago} dagen geleden`}`;
  }
  return `${deathLabel}, over ${daysFromReference === 1 ? '1 dag' : `${daysFromReference} dagen`}`;
}

function formatAddress(adres: RawBrief['adres']): string {
  return `${adres.straat} ${adres.huisnummer}, ${adres.postcode} ${adres.woonplaats}`;
}

function formatDateLong(iso: string): string {
  return parseDate(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function addDays(iso: string, days: number): string {
  const date = parseDate(iso);
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}

function differenceInDays(leftIso: string, rightIso: string): number {
  const left = parseDate(leftIso);
  const right = parseDate(rightIso);
  const leftUtc = Date.UTC(left.getFullYear(), left.getMonth(), left.getDate());
  const rightUtc = Date.UTC(right.getFullYear(), right.getMonth(), right.getDate());
  return Math.round((leftUtc - rightUtc) / 86_400_000);
}

function parseDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
