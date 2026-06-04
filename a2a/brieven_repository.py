from __future__ import annotations

import json
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Optional

from pydantic import BaseModel


class Adres(BaseModel):
    straat: str
    huisnummer: str
    postcode: str
    woonplaats: str
    verzorgingstehuis: bool


class Brief(BaseModel):
    id: str
    synthetic: bool
    bron: str
    bsn_overledene: str
    organisatie: str
    brief_code: str
    type: str
    verzonden_op: date
    dagen_na_overlijden: int
    aanhef: str
    geadresseerde: str
    adres: Adres
    actie_vereist: bool
    actie_omschrijving: Optional[str] = None
    wettelijke_reactietermijn_dagen: Optional[int] = None


class BriefRepository:
    """Loads Belastingdienst correspondence from a JSONL file and provides query methods."""

    def __init__(self, file_path: str | Path) -> None:
        self._by_id: dict[str, Brief] = {}
        self._by_bsn: dict[str, list[Brief]] = defaultdict(list)

        with open(file_path, encoding='utf-8') as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                brief = Brief.model_validate(json.loads(line))
                self._by_id[brief.id] = brief
                self._by_bsn[brief.bsn_overledene].append(brief)

    def get_by_id(self, brief_id: str) -> Optional[Brief]:
        """Return a single letter by its URN id, or None if not found."""
        return self._by_id.get(brief_id)

    def get_by_bsn(self, bsn: str) -> list[Brief]:
        """Return all letters associated with the given BSN of the deceased."""
        return list(self._by_bsn.get(bsn, []))

    def get_requiring_action(self, bsn: str) -> list[Brief]:
        """Return letters for the given BSN that require recipient action."""
        return [b for b in self.get_by_bsn(bsn) if b.actie_vereist]

    def get_by_type(self, bsn: str, brief_type: str) -> list[Brief]:
        """Return letters for the given BSN filtered by type ('beschikking' or 'terugvordering')."""
        return [b for b in self.get_by_bsn(bsn) if b.type == brief_type]

    def get_by_brief_code(self, bsn: str, brief_code: str) -> list[Brief]:
        """Return letters for the given BSN filtered by exact brief_code."""
        return [b for b in self.get_by_bsn(bsn) if b.brief_code == brief_code]

    def list_bsn_numbers(self) -> list[str]:
        """Return all unique BSN numbers present in the dataset."""
        return list(self._by_bsn.keys())
