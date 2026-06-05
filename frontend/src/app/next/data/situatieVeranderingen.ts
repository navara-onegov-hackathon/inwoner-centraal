export type SituatieCategorieId =
  | 'alle'
  | 'inkomen'
  | 'belasting'
  | 'verzekering'
  | 'wonen'
  | 'voertuig';

export interface SituatieCategorie {
  id: SituatieCategorieId;
  label: string;
}

export interface SituatieVerandering {
  id: string;
  categorie: Exclude<SituatieCategorieId, 'alle'>;
  titel: string;
  organisatie: string;
  voor: string;
  na: string;
  toelichting?: string;
}

export const situatieCategorieen: SituatieCategorie[] = [
  { id: 'alle', label: 'Alles' },
  { id: 'inkomen', label: 'Inkomen & uitkeringen' },
  { id: 'belasting', label: 'Belasting & toeslagen' },
  { id: 'verzekering', label: 'Verzekeringen' },
  { id: 'wonen', label: 'Wonen & energie' },
  { id: 'voertuig', label: 'Voertuig & verkeer' },
];

/** Statische voorbeelden voor Truus (partner Cees overleden). */
export const situatieVeranderingen: SituatieVerandering[] = [
  {
    id: 'svb-nabestaanden',
    categorie: 'inkomen',
    titel: 'Nabestaandenuitkering',
    organisatie: 'SVB',
    voor: 'U ontving geen aparte nabestaandenuitkering. Het inkomen van uw partner maakte deel uit van uw gezamenlijke situatie.',
    na: 'U kunt recht hebben op een overlijdensuitkering AOW en eventueel aanvullend nabestaandenpensioen. De SVB beoordeelt dit op basis van uw gegevens.',
    toelichting: 'Dit hoeft niet meteen — de SVB neemt contact op als er iets voor u is.',
  },
  {
    id: 'pensioen',
    categorie: 'inkomen',
    titel: 'Pensioen van uw partner',
    organisatie: 'Pensioenfonds',
    voor: 'Het pensioen van Cees liep via zijn werkgever en werd later uitgekeerd aan hem (en deels aan u als partner).',
    na: 'Het partnerpensioen kan worden voortgezet of als eenmalige uitkering worden uitgekeerd. U hoeft niet zelf alle fondsen te benaderen — wij signaleren wat relevant is.',
  },
  {
    id: 'belasting-box1',
    categorie: 'belasting',
    titel: 'Inkomstenbelasting',
    organisatie: 'Belastingdienst',
    voor: 'U werd mede belast op basis van het gezamenlijke huishouden. Partner-aftrekposten golden voor u beiden.',
    na: 'U wordt alleen belast op uw eigen inkomen. Partnerheffingskorting en gezamenlijke aangifte vallen weg; uw voorlopige aanslag kan wijzigen.',
    toelichting: 'De Belastingdienst past dit doorgaans automatisch aan na registratie overlijden.',
  },
  {
    id: 'toeslagen',
    categorie: 'belasting',
    titel: 'Toeslagen',
    organisatie: 'Belastingdienst',
    voor: 'Zorg- en huurtoeslag waren berekend op uw gezamenlijke inkomen en huishouden.',
    na: 'Toeslagen worden herberekend op uw alleenstaande situatie. Dit kan zowel stijgen als dalen, afhankelijk van inkomen en woonlasten.',
  },
  {
    id: 'auto-verzekering',
    categorie: 'verzekering',
    titel: 'Autoverzekering',
    organisatie: 'Verzekeraar',
    voor: 'Beide auto’s stonden op één polis met meerdere voertuigen en gezamenlijke korting (Cees: VW Golf, u: Toyota Yaris).',
    na: 'Polissen komen op individuele naam. De korting voor meerdere voertuigen vervalt; premie en dekking per auto kunnen wijzigen.',
    toelichting: 'Controleer dekking en schadeverzekering wanneer een auto wordt verkocht of overgeschreven.',
  },
  {
    id: 'inboedel',
    categorie: 'verzekering',
    titel: 'Inboedel- en opstalverzekering',
    organisatie: 'Verzekeraar',
    voor: 'De inboedelverzekering stond op naam van Cees of gezamenlijk op het adres Hoofdstraat 42.',
    na: 'De polis moet op uw naam worden gezet. Waarde en risico’s worden opnieuw beoordeeld op basis van één persoon in de woning.',
  },
  {
    id: 'zorg',
    categorie: 'verzekering',
    titel: 'Zorgverzekering',
    organisatie: 'Zorgverzekeraar',
    voor: 'U had ieder een eigen basisverzekering; eventueel een gezamenlijke aanvullende polis via één pakket.',
    na: 'Uw basisverzekering blijft; aanvullende polis op gezinsbasis vervalt. U kiest zelf een passend aanvullend pakket.',
  },
  {
    id: 'energie',
    categorie: 'wonen',
    titel: 'Energiecontract',
    organisatie: 'Energieleverancier',
    voor: 'Het energiecontract stond op naam van Cees de Vries voor het adres Hoofdstraat 42.',
    na: 'Het contract moet worden omgezet naar uw naam of beëindigd. Doorgeven voorkomt dat u onbedoeld zonder levering komt te zitten.',
  },
  {
    id: 'huur',
    categorie: 'wonen',
    titel: 'Huurcontract',
    organisatie: 'Gemeente / verhuurder',
    voor: 'U stond als medehuurder op het contract; Cees was hoofdhuurder.',
    na: 'U wordt hoofdhuurder of het contract wordt aangepast aan uw alleenstaande situatie. De verhuurder moet hiervan op de hoogte.',
  },
  {
    id: 'rdw-tenaamstelling',
    categorie: 'voertuig',
    titel: 'Tenaamstelling auto',
    organisatie: 'RDW',
    voor: 'De VW Golf (kenteken XX-123-X) stond op naam van Cees de Vries.',
    na: 'Het voertuig moet worden overgeschreven, verkocht of geschorst. Tot wijziging blijft u niet als eigenaar geregistreerd.',
    toelichting: 'Dit staat ook in uw stappenplan als RDW-taak.',
  },
  {
    id: 'rdw-verzekering-plicht',
    categorie: 'voertuig',
    titel: 'WAM-verzekering',
    organisatie: 'RDW',
    voor: 'Beide voertuigen waren WA-verzekerd via de gezamenlijke polis.',
    na: 'Elk voertuig dat op uw naam komt, moet apart verzekerd zijn. Zonder geldige WA mag u niet rijden.',
  },
  {
    id: 'cak',
    categorie: 'inkomen',
    titel: 'CAK-bijdrage',
    organisatie: 'CAK',
    voor: 'De Wlz-bijdrage voor Cees liep via zijn indicatie; u had een eigen indicatie met lagere bijdrage.',
    na: 'De bijdrage voor Cees stopt. Uw eigen CAK-bijdrage blijft ongewijzigd tenzij uw indicatie wijzigt.',
  },
];
