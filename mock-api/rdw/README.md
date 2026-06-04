# RDW Mock API

Standalone mock REST API voor RDW (Rijksdienst voor het Wegverkeer) voor voertuigregistratie en tenaamstelling. Onderdeel van de OneGov #2 Nabestaanden hackathon oplossing.

Draait op poort **8002** (native applicatie draait op 8000, CAK op 8001).

## Opstarten

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn main:app --port 8002 --reload
```

Swagger UI: http://localhost:8002/docs  
OpenAPI schema: http://localhost:8002/openapi.json

## Endpoints

| Methode | Pad | Omschrijving |
|---|---|---|
| GET | `/voertuigen/{kenteken}` | Voertuiggegevens en huidige tenaamstelling |
| GET | `/houders/{bsn}/voertuigen` | Alle voertuigen op naam van een BSN |
| POST | `/voertuigen/{kenteken}/tenaamstelling` | Eigendomsoverdracht (erfrecht, verkoop, schenking) |
| POST | `/voertuigen/{kenteken}/vrijwaren` | Vrijwaring van de huidige tenaamstelling |
| PATCH | `/voertuigen/{kenteken}/adres` | Adreswijziging van de huidige houder |

Onbekende kentekens geven HTTP 404.

## Testpersona's

| BSN / Kenteken | Persona | Voertuig |
|---|---|---|
| BSN `111222333` / kenteken `BN-ZF-92` | Cees de Vries | Opel Astra 2017, grijs — status ACTIEF |
| Overige BSN's | Truus, Marcus, Anneke, Selim | Geen voertuig geregistreerd |

Na een `POST /voertuigen/BN-ZF-92/tenaamstelling` met rechtsgrond `ERFRECHT` staat het voertuig op naam van de nieuwe houder (bijv. Truus).

Na een `POST /voertuigen/BN-ZF-92/vrijwaren` verandert de tenaamstellingstatus naar `VRIJWARING` en staat het voertuig niet meer onder de oude houder-index.

---

## Schema-afwijking ten opzichte van het native schema

De RDW API is kenteken-centrisch, niet BSN-centrisch. Het native schema organiseert alles rondom de overledene (BSN + overlijdensdatum); de RDW API kent geen overlijdenscontext — die levert de interoperabiliteitslaag.

### Geen verplichtingen of correspondentie

Het native schema bevat een `verplichtingen`- en `correspondentie`-object per organisatie. RDW verstuurt brieven via post/MijnOverheid en factureert niet rechtstreeks — de RDW API biedt alleen registratiedata. Correspondentie is niet beschikbaar via API.

### Kenteken als primaire sleutel

| Native | RDW API |
|---|---|
| Alles geïndexeerd op `bsn_overledene` | Primaire resource is het `kenteken` |
| BSN → correspondentie/verplichtingen opvragen | BSN → kentekens opvragen via `/houders/{bsn}/voertuigen`, daarna kenteken als sleutel |

### Datums en tijden

| Native | RDW API |
|---|---|
| `"verzonden_op": "2025-03-22"` — datum | `"datum_tenaamstelling": "2017-06-15T00:00:00Z"` — ISO-8601 datetime |

### Status

| Concept | Native | RDW API |
|---|---|---|
| Actieve registratie | *(impliciet)* | `"ACTIEF"` |
| Vrijwaring aangevraagd | *(niet aanwezig)* | `"VRIJWARING"` |
| Registratie beëindigd | *(niet aanwezig)* | `"BEËINDIGD"` |

### Schrijfoperaties

Het native schema is volledig read-only (gegenereerde data). De RDW API voegt drie schrijfoperaties toe die niet in het native schema bestaan:

- `POST /voertuigen/{kenteken}/tenaamstelling` — formele eigendomsoverdracht met `rechtsgrond` (`ERFRECHT` | `VERKOOP` | `SCHENKING`). Dit is een expliciete rechtshandeling, geen generieke PATCH.
- `POST /voertuigen/{kenteken}/vrijwaren` — beeindigt de actieve tenaamstelling zonder een nieuwe houder te registreren.
- `PATCH /voertuigen/{kenteken}/adres` — adreswijziging van de huidige houder.

### Velden niet aanwezig in de RDW API

Overlijdensspecifiek — geleverd door de interoperabiliteitslaag:

- `bsn_overledene`
- `dagen_na_overlijden`
- `geadresseerde` / `geadresseerde_rol`
- `aanhef`
- `actie_vereist` / `actie_omschrijving`

### Extra velden in de RDW API

Niet aanwezig in het native schema:

- `kenteken` — Nederlands kenteken als primaire sleutel
- `merk`, `model`, `bouwjaar`, `brandstof`, `kleur` — voertuigkenmerken
- `rechtsgrond` — juridische grondslag bij overdracht (`ERFRECHT` | `VERKOOP` | `SCHENKING`)
- `datum_tenaamstelling` — tijdstip van de (laatste) tenaamstelling
