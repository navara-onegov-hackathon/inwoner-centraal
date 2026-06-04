from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="CAK API",
    description="REST API van het Centraal Administratie Kantoor voor WLZ-eigen bijdragen en facturen.",
    version="1.0.0",
)


# --- Pydantic modellen ---

class Adres(BaseModel):
    straat: str
    huisnummer: str
    postcode: str
    stad: str
    landcode: str


class Zorginstelling(BaseModel):
    agb_code: str
    naam: str
    adres: Adres


class Client(BaseModel):
    bsn: str
    zorgtype: str                          # WLZ | WMO
    eigen_bijdrage_categorie: str          # LAAG | HOOG
    zorginstelling: Optional[Zorginstelling]


class Factuur(BaseModel):
    factuur_id: str
    factuurnummer: str
    factuurtype: str                       # WLZ_MAANDFACTUUR | WLZ_EINDNOTA | WLZ_CORRECTIEFACTUUR
    omschrijving: str
    peildatum: str
    factuurdatum: str
    bedrag_eur: float                      # negatief bij creditnota
    vervaldatum: str
    wettelijke_termijn_dagen: int
    status: str                            # OPENSTAAND | VOLDAAN | INCASSO_MISLUKT | GECREDITEERD | KWIJTGESCHOLDEN


class FacturenResponse(BaseModel):
    bsn: str
    opgehaald_op: str
    facturen: list[Factuur]


# --- Gegevens ---

_ZORGINSTELLING = {
    "agb_code": "01234567",
    "naam": "Zorgcentrum De Wilg",
    "adres": {
        "straat": "Zorgcentrum De Wilg",
        "huisnummer": "1",
        "postcode": "3511AB",
        "stad": "Utrecht",
        "landcode": "NL",
    },
}

CLIENTEN: dict[str, dict] = {
    # Truus / Cees — WLZ-client in zorginstelling
    "111222333": {
        "client": {
            "bsn": "111222333",
            "zorgtype": "WLZ",
            "eigen_bijdrage_categorie": "HOOG",
            "zorginstelling": _ZORGINSTELLING,
        },
        "facturen": [
            {
                "factuur_id": "cak-factuur-111222333-2025-03",
                "factuurnummer": "CAK-2025-0394721",
                "factuurtype": "WLZ_EINDNOTA",
                "omschrijving": "WLZ-eigen bijdrage maart 2025",
                "peildatum": "2025-03-01T00:00:00Z",
                "factuurdatum": "2025-04-10T09:00:00Z",
                "bedrag_eur": 1240.0,
                "vervaldatum": "2025-05-10T23:59:59Z",
                "wettelijke_termijn_dagen": 30,
                "status": "INCASSO_MISLUKT",
            },
            {
                "factuur_id": "cak-factuur-111222333-2025-02",
                "factuurnummer": "CAK-2025-0312456",
                "factuurtype": "WLZ_CORRECTIEFACTUUR",
                "omschrijving": "Herberekening eigen bijdrage februari 2025",
                "peildatum": "2025-02-01T00:00:00Z",
                "factuurdatum": "2025-04-05T09:00:00Z",
                "bedrag_eur": -310.0,
                "vervaldatum": "2025-05-05T23:59:59Z",
                "wettelijke_termijn_dagen": 30,
                "status": "VOLDAAN",
            },
        ],
    },
    # Overige testpersona's zijn geen CAK-client (geen WLZ-zorg)
}


# --- Routes ---

@app.get("/clienten/{bsn}", response_model=Client)
def get_client(bsn: str):
    """Geeft de WLZ- of Wmo-clientgegevens terug voor het opgegeven BSN."""
    if bsn not in CLIENTEN:
        raise HTTPException(status_code=404, detail="Geen CAK-client gevonden voor dit BSN.")
    return CLIENTEN[bsn]["client"]


@app.get("/clienten/{bsn}/facturen", response_model=FacturenResponse)
def get_facturen(bsn: str):
    """Geeft de factuurhistorie terug voor het opgegeven BSN."""
    if bsn not in CLIENTEN:
        raise HTTPException(status_code=404, detail="Geen CAK-client gevonden voor dit BSN.")
    return FacturenResponse(
        bsn=bsn,
        opgehaald_op=datetime.now(timezone.utc).isoformat(),
        facturen=CLIENTEN[bsn]["facturen"],
    )
