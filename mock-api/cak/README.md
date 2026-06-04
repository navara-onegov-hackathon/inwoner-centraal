# CAK Mock API

Standalone mock REST API voor CAK (Centraal Administratie Kantoor), de uitvoerder van WLZ-eigen bijdragen. Onderdeel van de OneGov #2 Nabestaanden hackathon oplossing.

Draait op poort **8001** (native applicatie draait op 8000).

## Opstarten

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

Swagger UI: http://localhost:8001/docs  
OpenAPI schema: http://localhost:8001/openapi.json

## Endpoints

| Methode | Pad | Omschrijving |
|---|---|---|
| GET | `/clienten/{bsn}` | Clientprofiel (zorgtype, bijdragecategorie, zorginstelling) |
| GET | `/clienten/{bsn}/facturen` | Factuurhistorie |

Onbekende BSN's (niet-CAK-clienten) geven HTTP 404.

## Testpersona's

| BSN | Persona | CAK-client? |
|---|---|---|
| `111222333` | Cees (WLZ, Zorgcentrum De Wilg) | Ja — 2 facturen |
| overige BSN's | Marcus, Anneke, Selim | Nee — niet in CAK-systeem |

---

## Schema-afwijking ten opzichte van het native schema

Deze API modelleert een generieke CAK-clientenAPI, niet specifiek ontworpen voor het overlijdensscenario. De interoperabiliteitslaag levert de overlijdenscontext en mapt naar het native nabestaandenschema.

### Verplichtingen via factuurstatus

Het native schema heeft een apart `verplichtingen`-object. In de CAK API is een open verplichting gewoon een onbetaalde factuur. De interoperabiliteitslaag filtert op status:

| Native `status` | CAK `status` |
|---|---|
| `"open"` | `"OPENSTAAND"` of `"INCASSO_MISLUKT"` |
| `"voldaan"` | `"VOLDAAN"` |
| `"kwijtgescholden"` | `"KWIJTGESCHOLDEN"` |
| `"in_behandeling"` | *(geen equivalent — niet aanwezig in CAK API)* |

### Bedragen

| Native | CAK API |
|---|---|
| `"bedrag": {"bedrag": "1240.00", "valuta": "EUR"}` — genest object, string | `"bedrag_eur": 1240.0` — platte float; valuta altijd EUR |
| *(geen negatief bedrag)* | Negatief `bedrag_eur` = creditnota (terugbetaling aan erven) |

### Datums en tijden

| Native | CAK API |
|---|---|
| `"peildatum": "2025-03-15"` — datum | `"peildatum": "2025-03-01T00:00:00Z"` — ISO-8601 datetime |
| `"vervaldatum": "2025-04-14"` — datum | `"vervaldatum": "2025-04-14T23:59:59Z"` — ISO-8601 datetime |

### Veldnamen

| Native | CAK API | Opmerking |
|---|---|---|
| `"bsn_overledene"` | `"bsn"` | CAK kent geen overledene-context |
| `"organisatie": "CAK"` | — | impliciet |
| `"bedrag.valuta": "EUR"` | — | impliciet |
| `"categorie": "wlz"` | `"factuurtype"` | `WLZ_EINDNOTA` / `WLZ_CORRECTIEFACTUUR` |
| `"omschrijving"` | `"omschrijving"` | zelfde |
| `"wettelijke_termijn_dagen"` | `"wettelijke_termijn_dagen"` | zelfde |

### Velden niet aanwezig in de CAK API

Overlijdensspecifiek — geleverd door de interoperabiliteitslaag op basis van gebruikersinvoer:

- `dagen_na_overlijden`
- `geadresseerde` / `geadresseerde_rol`
- `aanhef`

### Extra velden in de CAK API

Niet aanwezig in het native schema:

- `factuurnummer` — formeel factuurnummer (bijv. `CAK-2025-0394721`)
- `factuurdatum` — datum waarop de factuur is aangemaakt
- `zorginstelling.agb_code` — 8-cijferige AGB-zorgaanbiederkode
- `eigen_bijdrage_categorie` — `LAAG` of `HOOG` bijdrageregime
- `opgehaald_op` — servertijdstip van de respons
