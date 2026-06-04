# SVB Mock API

Standalone mock REST API voor SVB (Sociale Verzekeringsbank) voor AOW, ANW en overlijdensuitkeringen. Onderdeel van de OneGov #2 Nabestaanden hackathon oplossing.

Draait op poort **8003** (native applicatie draait op 8000, CAK op 8001, RDW op 8002).

## Opstarten

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn main:app --port 8003 --reload
```

Swagger UI: http://localhost:8003/docs  
OpenAPI schema: http://localhost:8003/openapi.json

## Endpoints

| Methode | Pad | Omschrijving |
|---|---|---|
| GET | `/partners/{bsn}` | SVB-partnerprofiel (AOW/ANW-gerechtigheid) |
| GET | `/partners/{bsn}/uitkeringen` | Alle uitkeringen voor dit BSN |
| POST | `/partners/{bsn}/anw-aanvraag` | Dien een ANW-aanvraag in |

Onbekende BSN's geven HTTP 404.

## Testpersona's

| BSN | Persona | Uitkeringen |
|---|---|---|
| `999888777` | Truus de Vries-Bakker (nabestaande) | AOW doorlopend (€1.087,45/mnd) + overlijdensuitkering €1.120,83 (UITBETAALD) |
| Overige BSN's | Cees, Marcus, Anneke, Selim | Niet in SVB-partnerregister |

Cees's BSN (`111222333`) is niet opvraagbaar — SVB stopt toegang tot gegevens van de overledene na overlijden. Zijn BSN verschijnt alleen als `referentie_bsn` op de overlijdensuitkering van Truus.

De ANW-aanvraag is niet van toepassing op Truus (boven AOW-leeftijd, `anw_gerechtigd: false`). Voor een partner met `anw_gerechtigd: true` geeft `POST /partners/{bsn}/anw-aanvraag` een uitkering terug met status `AANGEVRAAGD`.

---

## Schema-afwijking ten opzichte van het native schema

De SVB API is partner-centrisch (nabestaande), niet overledene-centrisch. Het native schema organiseert alles rondom `bsn_overledene`; de SVB API gebruikt het BSN van de ontvangende partner als primaire sleutel.

### Partner als primaire sleutel

| Native | SVB API |
|---|---|
| `bsn_overledene: "111222333"` als indexsleutel | `bsn: "999888777"` (partner) als indexsleutel |
| Overledene-context overal aanwezig | Overledene alleen zichtbaar als `referentie_bsn` op OVERLIJDENSUITKERING |

### Bedragen

| Native | SVB API |
|---|---|
| `"geschat_maandbedrag": {"bedrag": "1120.83", "valuta": "EUR"}` — genest object, string | `"bedrag_eur": 1120.83` — platte float; valuta altijd EUR |
| Altijd maandbedrag | Eenmalig bedrag (overlijdensuitkering) en maandbedrag (AOW) via hetzelfde veld |

### Status

| Native | SVB API |
|---|---|
| `"toegekend"` | `"TOEGEKEND"` — lopende uitkering |
| *(geen onderscheid uitbetaald)* | `"UITBETAALD"` — eenmalige betaling verwerkt |
| *(geen)* | `"AANGEVRAAGD"` \| `"AFGEWEZEN"` \| `"BEËINDIGD"` |

### Datums en tijden

| Native | SVB API |
|---|---|
| Geen expliciete datumvelden op rechten | `"ingangsdatum"`, `"einddatum"`, `"uitbetalingsdatum"` als ISO-8601 datetime |

### Velden niet aanwezig in de SVB API

Overlijdensspecifiek — geleverd door de interoperabiliteitslaag:

- `bsn_overledene` als primaire sleutel
- `dagen_na_overlijden`
- `geadresseerde` / `geadresseerde_rol`
- `aanhef`

### ANW-aanvraag als expliciete actie

Het native schema heeft geen schrijfoperaties. De SVB API voegt `POST /partners/{bsn}/anw-aanvraag` toe — een expliciete aanvraag die de partner zelf moet indienen. De interoperabiliteitslaag bepaalt op basis van `anw_gerechtigd` of deze actie aan de gebruiker wordt aangeboden.

Guardrails: 409 als de partner niet gerechtigd is, of als er al een actieve ANW-aanvraag bestaat. Het bedrag staat op `0.0` totdat SVB de aanvraag beoordeelt.

### Extra velden in de SVB API

Niet aanwezig in het native schema:

- `uitkering_type` — `AOW` | `ANW` | `OVERLIJDENSUITKERING`
- `referentie_bsn` — BSN overledene (alleen bij OVERLIJDENSUITKERING)
- `ingangsdatum` / `einddatum` — looptijd van de uitkering
- `uitbetalingsdatum` — datum van feitelijke betaling
- `aow_gerechtigd` / `anw_gerechtigd` — gerechtigheidsflags op het partnerprofiel
- `opgehaald_op` — servertijdstip van de respons
