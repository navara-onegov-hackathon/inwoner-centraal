import json
from typing import Any

from .config_registry import load_active_process_registry, load_agent_registry, load_api_registry


def build_system_prompt() -> str:
    apis = _prompt_api_registry()
    agents = load_agent_registry()
    return (
        'Jij bepaalt welke processen relevant zijn voor een dossier na overlijden.\n\n'
        'Je krijgt:\n'
        '- bekende gegevens over de overledene en nabestaande\n'
        '- een lijst met actieve mogelijke processen\n'
        '- beschikbare REST-API\'s met verwijzingen naar hun OpenAPI-documenten\n'
        '- beschikbare agent-naar-agent-koppelingen\n\n'
        'Algemene regels:\n'
        '- communiceer altijd in duidelijk, eenvoudig Nederlands\n'
        '- schrijf omschrijvingen als gewone tekst voor burgers\n'
        '- gebruik nooit systeemwaarden, interne veldnamen, ids, enumwaarden, toolnamen, OpenAPI of LLM/AI-taal in titels, samenvattingen, redenen of voortgangsteksten\n'
        '- verzin geen API\'s, endpoints, velden, processen of feiten\n'
        '- registreer geen irrelevante processen als relevant\n\n'
        'Volgorde:\n'
        '1. Bepaal eerst de basisgegevens en roep set_user_info aan.\n'
        '2. Haal altijd precies één keer de brieven van de Belastingdienst op met call_a2a_agent.\n'
        '3. Lees altijd precies één keer ieder OpenAPI-document met discover_api.\n'
        '4. Roep daarna concrete data-endpoints aan van iedere beschikbare API voordat je procesrelevantie bepaalt.\n'
        '5. Registreer relevante processen met register_process.\n'
        '6. Markeer ieder actief proces dat niet geldt met mark_process_irrelevant.\n'
        '7. Roep complete_discovery pas aan als ieder actief proces is geregistreerd of gemarkeerd als niet relevant.\n\n'
        'Beslisregels voor processen:\n'
        '- de intake-agent voert geen taken uit; gebruik daarom nooit state "done"\n'
        '- gebruik state "blocked" alleen als er een echte blokkade is en geef dan een duidelijke blocked_reason\n'
        '- een proces waarvoor een keuze of extra informatie nodig is, moet handled_by "you" zijn en een ag-ui formulier bevatten\n'
        '- als een stap over betalen gaat, voert het systeem geen betaling uit en registreer je handled_by "you"\n'
        '- als een stap over betalen gaat, voert het systeem geen betaling uit; action_type "betalen" is genoeg voor een dummy Betalen-knop zonder echte betaalafhandeling\n'
        '- als het systeem iets kan voorbereiden of later oppakken zonder extra keuze of betaling, mag handled_by "us" en state "pending" gebruikt worden\n'
        '- volg de notes en andere procesmetadata in de actieve processen; als agent_handles_when_assistance_max=true en assistance is "max", registreer handled_by "us" en state "pending"\n'
        '- processen met demo_always_relevant=true registreer je als relevant zonder externe toepasselijkheidscheck\n'
        '- processen met skip=true staan niet in de actieve lijst en controleer je niet\n'
        '- andere niet-challengeprocessen gelden niet, behalve als de opgehaalde gegevens ze expliciet relevant maken\n\n'
        'Voortgangsteksten:\n'
        '- gebruik emit_progress voor concrete Nederlandse regels zoals "Controle bij RDW: voertuiggegevens ophalen."\n'
        '- vermeld alleen dat er gecontroleerd wordt, niet of iets wel of niet van toepassing is\n'
        '- gebruik geen eerste persoon zoals "Ik controleer bij ..."\n\n'
        f'Beschikbare REST-API\'s:\n{json.dumps(apis, ensure_ascii=False, indent=2)}\n\n'
        f'Beschikbare agent-naar-agent-koppelingen:\n{json.dumps(agents, ensure_ascii=False, indent=2)}'
    )


def build_user_prompt(
    *,
    deceased_bsn: str,
    assistance: str,
    known_case_information: dict[str, Any],
    stored_case_data: dict[str, Any],
    completed_task_ids: set[str],
) -> str:
    payload = {
        'deceased_bsn': deceased_bsn,
        'assistance': assistance,
        'known_case_information': known_case_information,
        'stored_case_data': stored_case_data,
        'completed_task_ids': sorted(completed_task_ids),
        'possible_processes': load_active_process_registry(),
    }
    return (
        'Invoer voor deze gegevenscontrole:\n'
        f'{json.dumps(payload, ensure_ascii=False, indent=2)}\n\n'
        'Bepaal eerst de basisgegevens en roep set_user_info aan.\n'
        'Gebruik daarna de beschikbare API\'s en de Belastingdienst-koppeling.\n'
        'Roep concrete data-endpoints van iedere beschikbare API aan voordat je bepaalt welke processen gelden.\n'
        'Registreer ieder relevant proces met register_process.\n'
        'Markeer ieder actief proces dat niet geldt met mark_process_irrelevant.\n'
        'Maak een ag-ui formulier als informatie of een keuze van de gebruiker nodig is.\n'
        'Rond pas af met complete_discovery als ieder actief proces is verantwoord.'
    )


def _prompt_api_registry() -> list[dict[str, str]]:
    return [
        {
            'id': api['id'],
            'name': api['name'],
            'description': api['description'],
            'base_url': api['base_url'],
            'openapi_url': api['openapi_url'],
        }
        for api in load_api_registry()
    ]
