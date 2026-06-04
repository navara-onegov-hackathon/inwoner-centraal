from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="SVB API",
    description="REST API van de Sociale Verzekeringsbank voor AOW, ANW en overlijdensuitkeringen.",
    version="1.0.0",
)


# --- Pydantic modellen ---

class Adres(BaseModel):
    straat: str
    huisnummer: str
    postcode: str
    stad: str
    landcode: str


class Partner(BaseModel):
    bsn: str
    naam: str
    aow_gerechtigd: bool
    anw_gerechtigd: bool
    adres: Optional[Adres]


class PartnerUpdate(BaseModel):
    naam: Optional[str] = None
    adres: Optional[Adres] = None
    aow_gerechtigd: Optional[bool] = None
    anw_gerechtigd: Optional[bool] = None


class Uitkering(BaseModel):
    uitkering_id: str
    uitkering_type: str          # AOW | ANW | OVERLIJDENSUITKERING
    omschrijving: str
    referentie_bsn: Optional[str]   # BSN overledene, alleen bij OVERLIJDENSUITKERING
    ingangsdatum: str            # ISO-8601 datetime
    einddatum: Optional[str]     # None bij doorlopende uitkering
    bedrag_eur: float            # maandbedrag (AOW/ANW) of eenmalig bedrag
    uitbetalingsdatum: Optional[str]
    status: str                  # AANGEVRAAGD | TOEGEKEND | UITBETAALD | AFGEWEZEN | BEËINDIGD


class UitkeringenResponse(BaseModel):
    bsn: str
    opgehaald_op: str
    uitkeringen: list[Uitkering]


class AnwAanvraag(BaseModel):
    bsn_overledene: str


# --- Gegevens ---

PARTNERS: dict[str, dict] = {
    # Truus de Vries-Bakker — nabestaande partner van Cees (BSN 111222333)
    "999888777": {
        "partner": {
            "bsn": "999888777",
            "naam": "T. de Vries-Bakker",
            "aow_gerechtigd": True,
            "anw_gerechtigd": False,    # boven AOW-leeftijd, dus geen ANW
            "adres": {
                "straat": "Nieuwegracht",
                "huisnummer": "8",
                "postcode": "3512LC",
                "stad": "Utrecht",
                "landcode": "NL",
            },
        },
        "uitkeringen": [
            {
                "uitkering_id": "svb-uitkering-999888777-aow",
                "uitkering_type": "AOW",
                "omschrijving": "AOW-uitkering Truus de Vries-Bakker",
                "referentie_bsn": None,
                "ingangsdatum": "2009-04-01T00:00:00Z",
                "einddatum": None,
                "bedrag_eur": 1087.45,
                "uitbetalingsdatum": None,   # doorlopend, maandelijks
                "status": "TOEGEKEND",
            },
            {
                "uitkering_id": "svb-uitkering-999888777-overlijden-2025-03",
                "uitkering_type": "OVERLIJDENSUITKERING",
                "omschrijving": "Overlijdensuitkering AOW: 1 maand AOW + vakantiegeld",
                "referentie_bsn": "111222333",   # Cees
                "ingangsdatum": "2025-03-15T00:00:00Z",
                "einddatum": "2025-03-15T00:00:00Z",
                "bedrag_eur": 1120.83,
                "uitbetalingsdatum": "2025-03-28T00:00:00Z",
                "status": "UITBETAALD",
            },
        ],
    },
}


# --- Routes ---

@app.get("/partners/{bsn}", response_model=Partner)
def get_partner(bsn: str):
    """Geeft het SVB-partnerprofiel terug voor het opgegeven BSN."""
    if bsn not in PARTNERS:
        raise HTTPException(status_code=404, detail="Geen SVB-partner gevonden voor dit BSN.")
    return PARTNERS[bsn]["partner"]


@app.patch("/partners/{bsn}", response_model=Partner)
def update_partner(bsn: str, update: PartnerUpdate):
    """Werkt partnergegevens bij voor het opgegeven BSN. Alleen meegestuurde velden worden overschreven."""
    if bsn not in PARTNERS:
        raise HTTPException(status_code=404, detail="Geen SVB-partner gevonden voor dit BSN.")
    for field, value in update.model_dump(exclude_unset=True).items():
        PARTNERS[bsn]["partner"][field] = value
    return PARTNERS[bsn]["partner"]


@app.get("/partners/{bsn}/uitkeringen", response_model=UitkeringenResponse)
def get_uitkeringen(bsn: str):
    """Geeft alle uitkeringen terug voor het opgegeven BSN."""
    if bsn not in PARTNERS:
        raise HTTPException(status_code=404, detail="Geen SVB-partner gevonden voor dit BSN.")
    return UitkeringenResponse(
        bsn=bsn,
        opgehaald_op=datetime.now(timezone.utc).isoformat(),
        uitkeringen=PARTNERS[bsn]["uitkeringen"],
    )


@app.post("/partners/{bsn}/anw-aanvraag", response_model=Uitkering, status_code=201)
def anw_aanvraag(bsn: str, aanvraag: AnwAanvraag):
    """
    Dient een ANW-aanvraag in voor het opgegeven BSN.
    Alleen mogelijk als de partner ANW-gerechtigd is en nog geen lopende ANW-aanvraag heeft.
    """
    if bsn not in PARTNERS:
        raise HTTPException(status_code=404, detail="Geen SVB-partner gevonden voor dit BSN.")

    partner_data = PARTNERS[bsn]

    if not partner_data["partner"]["anw_gerechtigd"]:
        raise HTTPException(status_code=409, detail="Partner komt niet in aanmerking voor ANW.")

    bestaande_anw = [
        u for u in partner_data["uitkeringen"]
        if u["uitkering_type"] == "ANW" and u["status"] not in ("AFGEWEZEN", "BEËINDIGD")
    ]
    if bestaande_anw:
        raise HTTPException(status_code=409, detail="Er is al een actieve ANW-aanvraag of -uitkering.")

    uitkering = {
        "uitkering_id": f"svb-uitkering-{bsn}-anw",
        "uitkering_type": "ANW",
        "omschrijving": "ANW-uitkering nabestaande",
        "referentie_bsn": aanvraag.bsn_overledene,
        "ingangsdatum": datetime.now(timezone.utc).isoformat(),
        "einddatum": None,
        "bedrag_eur": 0.0,      # bedrag vastgesteld na beoordeling
        "uitbetalingsdatum": None,
        "status": "AANGEVRAAGD",
    }
    partner_data["uitkeringen"].append(uitkering)
    return uitkering
