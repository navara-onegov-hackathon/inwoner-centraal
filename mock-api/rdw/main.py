from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="RDW API",
    description="REST API van de Rijksdienst voor het Wegverkeer voor voertuigregistratie en tenaamstelling.",
    version="1.0.0",
)


# --- Pydantic modellen ---

class Adres(BaseModel):
    straat: str
    huisnummer: str
    postcode: str
    stad: str
    landcode: str


class Tenaamstelling(BaseModel):
    houder_bsn: str
    houder_naam: str
    datum_tenaamstelling: str        # ISO-8601 datetime
    adres: Adres
    status: str                      # ACTIEF | VRIJWARING | BEËINDIGD


class Voertuig(BaseModel):
    kenteken: str
    merk: str
    model: str
    bouwjaar: int
    brandstof: str                   # BENZINE | DIESEL | ELEKTRISCH | HYBRIDE
    kleur: str
    tenaamstelling: Tenaamstelling


class TenaamstellingVerzoek(BaseModel):
    nieuw_houder_bsn: str
    nieuw_houder_naam: str
    rechtsgrond: str                 # ERFRECHT | VERKOOP | SCHENKING
    nieuw_adres: Optional[Adres] = None


class AdresWijziging(BaseModel):
    straat: str
    huisnummer: str
    postcode: str
    stad: str
    landcode: str


# --- Gegevens ---

VOERTUIGEN: dict[str, dict] = {
    "BN-ZF-92": {
        "kenteken": "BN-ZF-92",
        "merk": "Opel",
        "model": "Astra",
        "bouwjaar": 2017,
        "brandstof": "BENZINE",
        "kleur": "grijs",
        "tenaamstelling": {
            "houder_bsn": "111222333",
            "houder_naam": "C. de Vries",
            "datum_tenaamstelling": "2017-06-15T00:00:00Z",
            "adres": {
                "straat": "Zorgweg",
                "huisnummer": "1",
                "postcode": "3511AB",
                "stad": "Utrecht",
                "landcode": "NL",
            },
            "status": "ACTIEF",
        },
    },
}

# Index: bsn → lijst van kentekens
_HOUDER_INDEX: dict[str, list[str]] = {
    "111222333": ["BN-ZF-92"],
}


# --- Routes ---

@app.get("/voertuigen/{kenteken}", response_model=Voertuig)
def get_voertuig(kenteken: str):
    """Geeft de voertuiggegevens en huidige tenaamstelling terug voor het opgegeven kenteken."""
    kenteken = kenteken.upper()
    if kenteken not in VOERTUIGEN:
        raise HTTPException(status_code=404, detail="Kenteken niet gevonden.")
    return VOERTUIGEN[kenteken]


@app.get("/houders/{bsn}/voertuigen", response_model=list[Voertuig])
def get_voertuigen_voor_houder(bsn: str):
    """Geeft alle voertuigen terug die op dit moment op naam staan van het opgegeven BSN."""
    kentekens = _HOUDER_INDEX.get(bsn, [])
    return [VOERTUIGEN[k] for k in kentekens if k in VOERTUIGEN]


@app.post("/voertuigen/{kenteken}/tenaamstelling", response_model=Voertuig)
def overdracht_tenaamstelling(kenteken: str, verzoek: TenaamstellingVerzoek):
    """
    Verwerkt een eigendomsoverdracht (tenaamstelling) voor het opgegeven kenteken.
    Rechtsgronden: ERFRECHT, VERKOOP, SCHENKING.
    """
    kenteken = kenteken.upper()
    if kenteken not in VOERTUIGEN:
        raise HTTPException(status_code=404, detail="Kenteken niet gevonden.")

    voertuig = VOERTUIGEN[kenteken]
    oude_bsn = voertuig["tenaamstelling"]["houder_bsn"]

    nieuw_adres = (
        verzoek.nieuw_adres.model_dump()
        if verzoek.nieuw_adres
        else voertuig["tenaamstelling"]["adres"]
    )

    voertuig["tenaamstelling"] = {
        "houder_bsn": verzoek.nieuw_houder_bsn,
        "houder_naam": verzoek.nieuw_houder_naam,
        "datum_tenaamstelling": datetime.now(timezone.utc).isoformat(),
        "adres": nieuw_adres,
        "status": "ACTIEF",
    }

    # Houder-index bijwerken
    if oude_bsn in _HOUDER_INDEX:
        _HOUDER_INDEX[oude_bsn] = [k for k in _HOUDER_INDEX[oude_bsn] if k != kenteken]
    _HOUDER_INDEX.setdefault(verzoek.nieuw_houder_bsn, [])
    if kenteken not in _HOUDER_INDEX[verzoek.nieuw_houder_bsn]:
        _HOUDER_INDEX[verzoek.nieuw_houder_bsn].append(kenteken)

    return voertuig


@app.post("/voertuigen/{kenteken}/vrijwaren", response_model=Voertuig)
def vrijwaar_voertuig(kenteken: str):
    """
    Verwerkt vrijwaring voor het opgegeven kenteken.
    Dit beeindigt de actieve tenaamstelling zonder een nieuwe houder te registreren.
    """
    kenteken = kenteken.upper()
    if kenteken not in VOERTUIGEN:
        raise HTTPException(status_code=404, detail="Kenteken niet gevonden.")

    voertuig = VOERTUIGEN[kenteken]
    oude_bsn = voertuig["tenaamstelling"]["houder_bsn"]

    voertuig["tenaamstelling"] = {
        **voertuig["tenaamstelling"],
        "datum_tenaamstelling": datetime.now(timezone.utc).isoformat(),
        "status": "VRIJWARING",
    }

    if oude_bsn in _HOUDER_INDEX:
        _HOUDER_INDEX[oude_bsn] = [k for k in _HOUDER_INDEX[oude_bsn] if k != kenteken]

    return voertuig


@app.patch("/voertuigen/{kenteken}/adres", response_model=Voertuig)
def wijzig_adres(kenteken: str, wijziging: AdresWijziging):
    """Wijzigt het correspondentieadres van de huidige houder voor het opgegeven kenteken."""
    kenteken = kenteken.upper()
    if kenteken not in VOERTUIGEN:
        raise HTTPException(status_code=404, detail="Kenteken niet gevonden.")

    VOERTUIGEN[kenteken]["tenaamstelling"]["adres"] = wijziging.model_dump()
    return VOERTUIGEN[kenteken]
