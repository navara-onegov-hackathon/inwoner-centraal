import type { FixtureBrief, FixtureRecht, FixtureVerplichting, TruusCeesFixture } from '../types/fixture';
import type {
  Agentstap,
  Bedrag,
  GeenActieItem,
  OverzichtResponse,
  RawBrief,
  RawRecht,
  RawVerplichting,
  Regeling,
  Taak,
  TaakActieType,
  TaakStatus,
  VerwachtItem,
} from '../types/overzicht';

const URGENT_DAYS = 14;

function daysUntil(deadline: string, today: string): number {
  const ms = new Date(deadline).getTime() - new Date(today).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function isUrgent(deadline: string | undefined, today: string, handeling: boolean): boolean {
  if (handeling) return true;
  if (!deadline) return false;
  return daysUntil(deadline, today) <= URGENT_DAYS;
}

function toBedrag(b: { bedrag: string; valuta: string } | null): Bedrag | undefined {
  if (!b) return undefined;
  return { bedrag: b.bedrag, valuta: 'EUR' };
}

function inferActieType(omschrijving: string, brief?: FixtureBrief): TaakActieType {
  const text = `${omschrijving} ${brief?.actie_omschrijving ?? ''}`.toLowerCase();
  if (text.includes('betal')) return 'betalen';
  if (text.includes('aangifte') || text.includes('indienen')) return 'indienen';
  if (text.includes('teken') || text.includes('onderteken')) return 'tekenen';
  if (text.includes('bevestig') || text.includes('contactpersoon')) return 'bevestigen';
  return null;
}

function ctaLabelFor(actieType: TaakActieType): string | undefined {
  switch (actieType) {
    case 'betalen':
      return 'Nu betalen';
    case 'indienen':
      return 'Aangifte starten';
    case 'tekenen':
      return 'Ondertekenen';
    case 'bevestigen':
      return 'Bevestigen';
    default:
      return 'Bekijk details';
  }
}

function findBrief(
  correspondentie: FixtureBrief[],
  organisatie: string,
  matcher: (b: FixtureBrief) => boolean,
): FixtureBrief | undefined {
  return correspondentie.find((b) => b.organisatie === organisatie && matcher(b));
}

function findVerplichting(
  verplichtingen: FixtureVerplichting[],
  organisatie: string,
  matcher: (v: FixtureVerplichting) => boolean,
): FixtureVerplichting | undefined {
  return verplichtingen.find((v) => v.organisatie === organisatie && matcher(v));
}

function buildTaak(
  id: string,
  organisatie: string,
  titel: string,
  samenvatting: string,
  brief: FixtureBrief | undefined,
  verplichting: FixtureVerplichting | undefined,
  demoToday: string,
): Taak {
  const deadline = verplichting?.vervaldatum;
  const actieType = inferActieType(verplichting?.omschrijving ?? brief?.actie_omschrijving ?? '', brief);
  const handeling = actieType !== null;
  const toonCta = isUrgent(deadline, demoToday, handeling);

  let status: TaakStatus = 'actie_nodig';
  if (actieType === 'bevestigen' && !toonCta) {
    status = 'wacht_op_u';
  }

  return {
    id,
    titel,
    samenvatting,
    organisatie,
    status,
    deadline,
    bedrag: toBedrag(verplichting?.bedrag ?? null),
    handeling_door_nabestaande: handeling,
    actie_type: actieType,
    toon_cta_in_lijst: toonCta,
    cta_label: toonCta ? ctaLabelFor(actieType) : undefined,
    bron_brief_ids: brief ? [brief.id] : [],
    bron_verplichting_ids: verplichting ? [verplichting.id] : [],
  };
}

function buildTaken(fixture: TruusCeesFixture, demoToday: string): Taak[] {
  const { correspondentie, verplichtingen } = fixture;
  const taken: Taak[] = [];

  const cakBrief = findBrief(correspondentie, 'CAK', (b) => b.type === 'factuur');
  const cakVerplichting = findVerplichting(verplichtingen, 'CAK', (v) =>
    v.omschrijving.toLowerCase().includes('wlz'),
  );
  if (cakBrief || cakVerplichting) {
    taken.push(
      buildTaak(
        'taak-cak-wlz',
        'CAK',
        'WLZ-eigen bijdrage betalen',
        'Factuur voor de laatste maand verzorging in het zorgcentrum.',
        cakBrief,
        cakVerplichting,
        demoToday,
      ),
    );
  }

  const toeslagenTerugBrief = findBrief(correspondentie, 'Toeslagen', (b) => b.type === 'terugvordering');
  const toeslagenTerugVerplichting = findVerplichting(verplichtingen, 'Toeslagen', (v) =>
    v.omschrijving.toLowerCase().includes('terugvordering'),
  );
  if (toeslagenTerugBrief || toeslagenTerugVerplichting) {
    taken.push(
      buildTaak(
        'taak-toeslagen-terugvordering',
        'Toeslagen',
        'Terugvordering zorgtoeslag',
        'Na herziening is een bedrag aan zorgtoeslag terug te betalen.',
        toeslagenTerugBrief,
        toeslagenTerugVerplichting,
        demoToday,
      ),
    );
  }

  const erfbelastingBrief = findBrief(
    correspondentie,
    'Belastingdienst',
    (b) => b.actie_omschrijving?.toLowerCase().includes('erfbelasting') ?? false,
  );
  const erfbelastingVerplichting = findVerplichting(verplichtingen, 'Belastingdienst', (v) =>
    v.omschrijving.toLowerCase().includes('erfbelasting'),
  );
  if (erfbelastingBrief || erfbelastingVerplichting) {
    taken.push(
      buildTaak(
        'taak-erfbelasting',
        'Belastingdienst',
        'Aangifte erfbelasting',
        'Binnen acht maanden na overlijden aangifte doen bij de Belastingdienst.',
        erfbelastingBrief,
        erfbelastingVerplichting,
        demoToday,
      ),
    );
  }

  const waterschapBrief = findBrief(correspondentie, 'Waterschap', (b) => b.type === 'factuur');
  const waterschapVerplichting = findVerplichting(verplichtingen, 'Waterschap', () => true);
  if (waterschapBrief || waterschapVerplichting) {
    taken.push(
      buildTaak(
        'taak-waterschap',
        'Waterschap',
        'Waterschapsbelasting betalen',
        'Aanslag 2025 op basis van peildatum 1 januari — als erfgenaam aansprakelijk.',
        waterschapBrief,
        waterschapVerplichting,
        demoToday,
      ),
    );
  }

  const naheffingVerplichting = findVerplichting(verplichtingen, 'Toeslagen', (v) =>
    v.omschrijving.toLowerCase().includes('naheffing'),
  );
  if (naheffingVerplichting) {
    taken.push(
      buildTaak(
        'taak-toeslagen-naheffing',
        'Toeslagen',
        'Naheffing huurtoeslag (verwacht)',
        'Definitieve herberekening huurtoeslag — kan later volgen.',
        undefined,
        naheffingVerplichting,
        demoToday,
      ),
    );
  }

  return taken;
}

function buildRegelingen(rechten: FixtureRecht[]): Regeling[] {
  const regelingen: Regeling[] = [];

  for (const recht of rechten) {
    if (recht.status === 'toegekend') {
      regelingen.push({
        id: `regeling-${recht.id}`,
        organisatie: recht.organisatie,
        titel:
          recht.organisatie === 'SVB'
            ? 'Overlijdensuitkering wordt automatisch verwerkt'
            : recht.omschrijving,
        toelichting:
          recht.organisatie === 'SVB'
            ? 'De SVB verwerkt de eenmalige overlijdensuitkering zonder actie van u.'
            : 'Deze regeling loopt automatisch verder.',
        recht_id: recht.id,
        status: 'afgerond',
      });
    }
  }

  regelingen.push({
    id: 'regeling-toeslagen-herziening',
    organisatie: 'Toeslagen',
    titel: 'Herziening huurtoeslag is gestart',
    toelichting: 'Op basis van uw nieuwe huishoudinkomen is de herziening in gang gezet.',
    status: 'in_behandeling',
  });

  return regelingen;
}

function buildAgentstappen(): Agentstap[] {
  return [
    {
      id: 'agentstap-belastingdienst-contact',
      organisatie: 'Belastingdienst',
      omschrijving: 'Contactpersoon bij Belastingdienst geregistreerd',
      uitgevoerd_op: '2025-04-02',
      type: 'voorbereid_door_agent',
      status: 'voltooid',
    },
    {
      id: 'agentstap-cak-overlijden',
      organisatie: 'CAK',
      omschrijving: 'CAK geïnformeerd over overlijden',
      uitgevoerd_op: '2025-03-18',
      type: 'voorbereid_door_agent',
      status: 'voltooid',
    },
    {
      id: 'agentstap-toeslagen-herziening',
      organisatie: 'Toeslagen',
      omschrijving: 'Herziening huur- en zorgtoeslag aangevraagd',
      uitgevoerd_op: '2025-03-25',
      type: 'voorbereid_door_agent',
      status: 'voltooid',
    },
    {
      id: 'agentstap-toeslagen-terugvordering',
      organisatie: 'Toeslagen',
      omschrijving: 'Bezwaartermijn en betaalregeling voor terugvordering onderzoeken',
      uitgevoerd_op: '2025-04-18',
      type: 'voorbereid_door_agent',
      status: 'bezig',
    },
  ];
}

function buildVerwacht(rechten: FixtureRecht[]): VerwachtItem[] {
  return rechten
    .filter((r) => r.status === 'aanvraag_open' || r.status === 'in_behandeling')
    .map((r) => ({
      id: `verwacht-${r.id}`,
      organisatie: r.organisatie,
      titel: r.organisatie === 'Toeslagen' ? 'Herberekening toeslagen' : r.omschrijving,
      toelichting: 'Wordt beoordeeld — u hoort van ons zodra er uitsluitsel is.',
      type: 'recht' as const,
    }));
}

function buildGeenActie(correspondentie: FixtureBrief[]): GeenActieItem[] {
  return correspondentie
    .filter((b) => !b.actie_vereist)
    .map((b) => ({
      id: `geen-actie-${b.id}`,
      organisatie: b.organisatie,
      titel: briefTitel(b),
      verzonden_op: b.verzonden_op,
      brief_id: b.id,
    }));
}

function briefTitel(b: FixtureBrief): string {
  if (b.type === 'condoleance') return 'Condoleance';
  if (b.type === 'informatiebrief') return 'Informatiebrief';
  return `${b.type} — ${b.organisatie}`;
}

function mapRawBrief(b: FixtureBrief): RawBrief {
  return {
    id: b.id,
    organisatie: b.organisatie,
    type: b.type,
    verzonden_op: b.verzonden_op,
    actie_vereist: b.actie_vereist,
    actie_omschrijving: b.actie_omschrijving,
    aanhef: b.aanhef,
    geadresseerde: b.geadresseerde,
  };
}

function mapRawVerplichting(v: FixtureVerplichting): RawVerplichting {
  return {
    id: v.id,
    organisatie: v.organisatie,
    omschrijving: v.omschrijving,
    bedrag: toBedrag(v.bedrag) ?? null,
    vervaldatum: v.vervaldatum,
    status: v.status,
  };
}

function mapRawRecht(r: FixtureRecht): RawRecht {
  return {
    id: r.id,
    organisatie: r.organisatie,
    omschrijving: r.omschrijving,
    status: r.status,
  };
}

export function deriveOverzicht(fixture: TruusCeesFixture, demoToday: string): OverzichtResponse {
  const partner = fixture.overledene.partner;
  const overledene = fixture.overledene.overledene;
  const nabestaande = `${partner.voornamen} ${partner.geslachtsnaam}`;
  const overledeneNaam = `${overledene.voornamen} ${overledene.geslachtsnaam}`;

  const regelingen = buildRegelingen(fixture.rechten);
  const agentstappen = buildAgentstappen();
  const taken = buildTaken(fixture, demoToday);
  const verwacht_binnenkort = buildVerwacht(fixture.rechten);
  const geen_actie_nodig = buildGeenActie(fixture.correspondentie);

  return {
    persona: {
      nabestaande,
      overledene: overledeneNaam,
      overlijdensdatum: overledene.overlijdensdatum,
      postadres_alert:
        'Sommige organisaties sturen post nog naar het adres van Cees (Zorgcentrum De Wilg, Utrecht).',
      postadres_cta_label: 'Postadres doorgeven',
    },
    samenvatting: {
      actie_van_u: 0,
      op_achtergrond: 0,
      geregeld_door_ons: 0,
      wachten_op_organisatie: 0,
      afgerond: 0,
    },
    regelingen,
    agentstappen,
    taken,
    verwacht_binnenkort,
    geen_actie_nodig,
    correspondentie: fixture.correspondentie.map(mapRawBrief),
    verplichtingen: fixture.verplichtingen.map(mapRawVerplichting),
    rechten: fixture.rechten.map(mapRawRecht),
  };
}
