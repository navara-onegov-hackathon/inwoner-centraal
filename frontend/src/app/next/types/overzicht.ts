export type Detailniveau = 'begeleide' | 'uitgebreide';

export type TaakStatus = 'actie_nodig' | 'wacht_op_u' | 'in_behandeling';
export type TaakActieType = 'betalen' | 'tekenen' | 'indienen' | 'bevestigen' | null;

export interface Bedrag {
  bedrag: string;
  valuta: 'EUR';
}

export interface PersonaContext {
  nabestaande: string;
  overledene: string;
  overlijdensdatum: string;
  postadres_alert?: string;
  postadres_cta_label?: string;
}

export interface SamenvattingCounts {
  actie_van_u: number;
  op_achtergrond: number;
  geregeld_door_ons: number;
  wachten_op_organisatie: number;
  afgerond: number;
}

export type AgentstapStatus = 'bezig' | 'voltooid';
export type RegelingStatus = 'in_behandeling' | 'afgerond';

export interface Regeling {
  id: string;
  organisatie: string;
  titel: string;
  toelichting: string;
  recht_id?: string;
  status: RegelingStatus;
}

export interface Agentstap {
  id: string;
  organisatie: string;
  omschrijving: string;
  uitgevoerd_op: string;
  type: 'voorbereid_door_agent';
  status: AgentstapStatus;
}

export interface Taak {
  id: string;
  titel: string;
  samenvatting: string;
  organisatie: string;
  status: TaakStatus;
  deadline?: string;
  bedrag?: Bedrag;
  handeling_door_nabestaande: boolean;
  actie_type: TaakActieType;
  toon_cta_in_lijst: boolean;
  cta_label?: string;
  bron_brief_ids: string[];
  bron_verplichting_ids: string[];
}

export interface VerwachtItem {
  id: string;
  organisatie: string;
  titel: string;
  toelichting: string;
  type: 'recht' | 'correspondentie';
}

export interface GeenActieItem {
  id: string;
  organisatie: string;
  titel: string;
  verzonden_op: string;
  brief_id: string;
}

export interface RawBrief {
  id: string;
  organisatie: string;
  type: string;
  verzonden_op: string;
  actie_vereist: boolean;
  actie_omschrijving: string | null;
  aanhef: string;
  geadresseerde: string;
}

export interface RawVerplichting {
  id: string;
  organisatie: string;
  omschrijving: string;
  bedrag: Bedrag | null;
  vervaldatum: string;
  status: string;
}

export interface RawRecht {
  id: string;
  organisatie: string;
  omschrijving: string;
  status: string;
}

export interface OverzichtResponse {
  persona: PersonaContext;
  samenvatting: SamenvattingCounts;
  regelingen: Regeling[];
  agentstappen: Agentstap[];
  taken: Taak[];
  verwacht_binnenkort: VerwachtItem[];
  geen_actie_nodig: GeenActieItem[];
  correspondentie: RawBrief[];
  verplichtingen: RawVerplichting[];
  rechten: RawRecht[];
}

export interface StatusBoard {
  actie_van_u: Taak[];
  op_achtergrond: Agentstap[];
  geregeld_door_ons: {
    agentstappen: Agentstap[];
    regelingen: Regeling[];
  };
  wachten_op_organisatie: VerwachtItem[];
  afgerond: {
    regelingen: Regeling[];
    geen_actie: GeenActieItem[];
  };
}
