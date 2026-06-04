# Inwoner Centraal

Prototype for the **OneGov #2: Inwoner Centraal - Nabestaanden** hackathon by GovTech NL and ICTU.

This project focuses on the case of **Truus and Cees** from the challenge repository at [govtechnl/onegov2-inwoner-centraal](https://github.com/govtechnl/onegov2-inwoner-centraal), specifically [docs/casus-truus.md](../onegov2-inwoner-centraal/docs/casus-truus.md).

## The problem

When a partner dies, the surviving partner enters a period of grief and administrative overload at the same time. In the Truus case, information and obligations are spread across multiple organisations such as:

- Gemeente
- SVB
- CAK
- RDW
- Waterschap
- Belastingdienst
- Toeslagen

The current experience is fragmented:

- letters arrive at different times
- letters are often sent to the wrong address
- the tone is impersonal
- it is unclear what is already arranged and what still requires action
- important obligations can surface much later, including back-payments

Our prototype addresses that problem from the perspective of the bereaved partner, not from internal government process optimisation alone.

## Our concept

We are building a platform that helps the bereaved partner by handling as much of the administrative process as possible.

The user can indicate how much the platform may handle on their behalf. For the demo, we focus on a user who wants the platform to do as much as possible.

The platform works as an orchestration layer:

- it starts from a death-related signal and the partner's delegated authority
- it determines which organisations and arrangements are relevant
- it gathers available data from existing APIs or agent-to-agent integrations
- it assembles a single personalised overview
- it prepares or executes actions where possible
- it asks the user only when information is missing, conflicting, or requires explicit confirmation

AI is used in the background for:

- data assembly
- format conversion
- conflict detection
- form prefill
- explanation generation in plain language

AI is explicitly **not** used as an open chat interface. At most, the user sees AI-generated forms or guided questions in the UI.

## Demo focus

Our primary demo focus is:

- **Persona:** Truus, 62
- **Scenario:** the bereaved partner wants the government platform to handle as much as possible
- **Track:** closest to "het gepersonaliseerde totaaloverzicht"
- **Core actions from the brief:** informeren, toegang geven, handelen namens

This means our prototype is not just a dashboard. It is a guided orchestration flow that:

- explains what is happening
- gives Truus one place to see all relevant obligations and rights
- acts on her behalf when legal and technical conditions allow it

## How the solution works

### 1. Authority and intake

The platform starts after a death signal and uses a bereavement-specific delegated authority model comparable to a **nabestaandenmachtiging**.

The user sets a service preference, for example:

- only show me what I need to do
- prepare actions but ask before sending
- handle everything possible automatically

For the demo, we use the third option.

### 2. Situation detection

A platform agent maintains a checklist of arrangements that may be relevant after death, such as:

- benefits recalculations
- open invoices
- tax obligations
- vehicle ownership transfer
- local levies

The platform determines what applies to this specific case by combining:

- death and relationship data
- address data
- rights
- obligations
- correspondence timing
- source-specific rules

### 3. Data retrieval

The platform uses existing integrations wherever possible, without requiring all participating organisations to adopt one new shared format.

Current demo integration approach:

- **RDW** - API
- **CAK** - API
- **CVB/CJIB-like debt or collection source** - API
- **Belastingdienst** - agent-to-agent connection
- **Gemeente** - paper / offline process representation
- **Waterschap** - paper / offline process representation

This lets the platform combine digital and non-digital channels in one experience.

### 4. Assembly and normalization

An important feature of the platform is that other organisations do not need to actively support one specific data structure or a new central integration model.

Instead, the platform:

- supports agent-to-agent communication for future proof organisations
- consumes existing APIs where available
- interprets existing letters or structured records
- normalizes the information into one shared case model
- resolves partial overlap between sources

This is where AI helps in the background, especially for mapping and assembling heterogeneous information.

### 5. Decision and action orchestration

Once the platform has enough information, it determines:

- what is already arranged automatically
- what Truus should only be informed about
- what still requires a decision
- what can be prefilled, prepared, deferred, or submitted

Examples in the Truus case:

- show that the SVB overlijdensuitkering is paid automatically
- surface CAK and Toeslagen obligations with clear deadlines
- detect that correspondence may still be going to the care home address
- prepare corrective actions or follow-up forms
- bundle fragmented obligations into one priority-based overview

### 6. User clarification only when needed

If information is missing or conflicting, the platform asks the user through a guided interface.

Examples:

- "Is the vehicle still in use?"
- "Should correspondence go to your home address?"
- "Do you want us to request deferral for this payment obligation?"

The interface is designed to reduce cognitive load:

- no free-form AI chat
- short guided prompts
- clear yes/no or choice-based flows
- plain-language summaries

## Why this fits the hackathon brief

The challenge brief asks teams to show how government can proactively help bereaved partners get a complete and personalised overview without making them chase information themselves.

Our concept aligns strongly with the brief because it demonstrates:

- **Informeren:** one clear overview of what is happening, what is arranged, and what still matters
- **Toegang geven:** delegated access and one central interaction point
- **Handelen namens:** orchestration of actions on behalf of the bereaved partner

It also fits the judging criteria:

- useful to the bereaved partner
- links multiple organisations
- proactive rather than reactive
- focused on tone, timing, and intelligibility
- compatible with low `doenvermogen` because the system asks only for minimal input

## Truus as the primary persona

We chose Truus because her case makes the challenge highly visible:

- her husband Cees lived at a care home
- she lives at a different address
- several organisations continue to write to the wrong place
- some obligations are immediate, others appear much later
- she is digitally capable enough to use a guided service, but not to navigate fragmented government systems under grief

This makes Truus a strong demo persona for:

- cross-organisation data assembly
- timeline clarity
- wrong-address detection
- proactive handling
- minimal-question UX

Anneke remains a useful secondary stress test for accessibility and paper fallback.

## Non-goals

This prototype does **not** assume:

- all organisations will rebuild their systems
- one universal government data model will exist first
- the bereaved partner wants to chat with AI
- every step can be fully automated in today's legal and technical reality

Instead, we aim to show a realistic orchestration layer that works with existing infrastructure and mixed maturity across organisations.

## Architecture direction

At a high level, the prototype follows this pattern:

1. Receive or simulate a death-related trigger.
2. Establish scoped delegated authority.
3. Fan out to connected organisations and data sources.
4. Normalize and assemble one case overview.
5. Decide what can be handled automatically.
6. Ask the user only where necessary.
7. Produce one coherent overview and a small set of next actions.

This is intentionally compatible with the architecture direction described in the challenge repository:

- BRP / Haal Centraal as source-oriented starting point
- Machtigen-style delegated authority
- federated retrieval instead of central duplication
- existing channels such as paper and digital messaging

## Expected demo story

In the demo, Truus opens one platform instead of receiving disconnected signals from separate organisations.

The platform tells her:

- what has already been arranged
- which letters or obligations are relevant
- which actions are being prepared on her behalf
- which questions still require her input
- what deadlines and risks remain

The value is not only better visibility, but also lower burden. The platform absorbs complexity so Truus does not have to.

## Repository structure

Current structure:

- `frontend/` - user-facing prototype
- `backend/` - backend services and orchestration logic

## Run with Docker Compose

Start the default demo stack with one command:

```bash
docker compose up --build
```

If your Docker installation uses the standalone Compose binary, run `docker-compose up --build` instead.

Then open:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- CAK mock API: http://localhost:8001/docs
- RDW mock API: http://localhost:8002/docs
- SVB mock API: http://localhost:8003/docs

The backend reads the local `.env` through Docker Compose at runtime for AI settings such as `GREENPT_API_KEY` when the file exists. The `.env` file is not copied into any image. Without `GREENPT_API_KEY`, the backend falls back to local discrepancy analysis.

The Belastingdienst A2A agent is optional and can be started with:

```bash
docker compose --profile agents up --build
```

It is available at http://localhost:9999 when the `agents` profile is enabled.

As the prototype evolves, we expect to add:

- integration adapters
- shared case model definitions
- sample mock responses
- orchestration rules
- demo fixtures based on the challenge data

## Source material

The hackathon brief and case material live in the sibling repository:

- [../onegov2-inwoner-centraal/README.md](../onegov2-inwoner-centraal/README.md)
- [../onegov2-inwoner-centraal/CHALLENGE.md](../onegov2-inwoner-centraal/CHALLENGE.md)
- [../onegov2-inwoner-centraal/docs/casus-truus.md](../onegov2-inwoner-centraal/docs/casus-truus.md)
- [../onegov2-inwoner-centraal/docs/beoordelingscriteria.md](../onegov2-inwoner-centraal/docs/beoordelingscriteria.md)
- [../onegov2-inwoner-centraal/docs/architectuur-context.md](../onegov2-inwoner-centraal/docs/architectuur-context.md)
- [../onegov2-inwoner-centraal/docs/juridisch-kader.md](../onegov2-inwoner-centraal/docs/juridisch-kader.md)

## Next steps

Near-term product steps:

- implement the Truus journey end-to-end
- model a unified case overview across at least two real or mocked organisations
- add guided clarification questions for missing data
- represent digital and paper-originating obligations in one flow
- show which actions are automatic, prepared, or still pending approval

Hackathon delivery steps:

- keep the demo centred on Truus
- explicitly map the flow to informeren, toegang geven, and handelen namens
- demonstrate at least two linked organisations
- show one moment where the platform acts and one where it asks
