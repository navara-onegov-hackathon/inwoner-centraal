export interface FixtureAdres {
  straat: string;
  huisnummer: string;
  postcode: string;
  woonplaats: string;
  verzorgingstehuis?: boolean;
}

export interface FixtureBrief {
  id: string;
  organisatie: string;
  brief_code: string;
  type: string;
  verzonden_op: string;
  dagen_na_overlijden: number;
  actie_vereist: boolean;
  actie_omschrijving: string | null;
  wettelijke_reactietermijn_dagen: number | null;
  aanhef: string;
  geadresseerde: string;
  adres: FixtureAdres;
}

export interface FixtureVerplichting {
  id: string;
  organisatie: string;
  omschrijving: string;
  bedrag: { bedrag: string; valuta: string } | null;
  vervaldatum: string;
  status: string;
}

export interface FixtureRecht {
  id: string;
  organisatie: string;
  omschrijving: string;
  status: string;
}

export interface TruusCeesFixture {
  persona: string;
  overledene: {
    overledene: {
      voornamen: string;
      geslachtsnaam: string;
      overlijdensdatum: string;
      woonadres: FixtureAdres;
    };
    partner: {
      voornamen: string;
      geslachtsnaam: string;
      woonadres: FixtureAdres;
    };
  };
  verplichtingen: FixtureVerplichting[];
  rechten: FixtureRecht[];
  correspondentie: FixtureBrief[];
}
