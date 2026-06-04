# Intake Discovery Design

## Goal

Add a new backend endpoint for intake discovery that starts from a deceased
BSN, gathers relevant government and agent data, determines which processes
apply, and streams progress updates to the frontend while the work is running.

This endpoint replaces the separate reconciliation widget flow for onboarding.
It is meant to support the onboarding and intake journey, and to feed the
existing overview UI shape as closely as possible.

## Scope

This design covers:

- a new Django backend endpoint for intake discovery
- SSE streaming of agent progress
- a new system prompt for a dedicated intake discovery agent
- generic REST API discovery and calling tools
- A2A calls reusing existing backend logic
- process discovery from both fixed process definitions and dynamic
  Belastingdienst letters
- generated per-process form definitions for missing required information
- storage of newly collected process data for reuse in later processes
- normalization of discovered output into an English backend data contract

This design does not cover:

- exact text shown in the UI
- relative date rendering such as "due in 2 weeks"
- final per-step control UI for `partial`

This design does include scoped frontend changes that are necessary to support
the new intake discovery flow while keeping the rest of the application
working.

## Current Base

The implementation should reuse patterns already present in the codebase:

- Django backend routing in
  [backend/inwonercentraal/urls.py](/Users/arnold/Projects/inwoner-centraal/backend/inwonercentraal/urls.py:1)
- existing reconciliation endpoint in
  [backend/reconciliation/views.py](/Users/arnold/Projects/inwoner-centraal/backend/reconciliation/views.py:126)
- existing A2A client logic in
  [backend/reconciliation/a2a_client.py](/Users/arnold/Projects/inwoner-centraal/backend/reconciliation/a2a_client.py:1)
- existing A2A Belastingdienst agent in
  [a2a/agent_executor.py](/Users/arnold/Projects/inwoner-centraal/a2a/agent_executor.py:1)
- current frontend overview type in
  [frontend/src/app/next/types/overzicht.ts](/Users/arnold/Projects/inwoner-centraal/frontend/src/app/next/types/overzicht.ts:1)
- current challenge process list in
  [docs/challenge-processes.yaml](/Users/arnold/Projects/inwoner-centraal/docs/challenge-processes.yaml)

## User Flow

### Entry point

The frontend makes a basic start call to a new backend endpoint with the
deceased BSN and the user's assistance preference.

Delegated access is assumed to already be in place.

The old intake is replaced by data discovery.

### Backend behavior

The backend immediately starts an SSE stream.

While the request is running, the backend emits progress lines that explain
what the agent is doing. These lines are shown in the UI instead of a spinner.

The backend agent:

1. retrieves general information for the deceased case
2. discovers which fixed processes are relevant
3. injects configured always-include processes where applicable
4. retrieves Belastingdienst letters through A2A
5. derives additional dynamic processes from those letters
6. generates process-level forms where required information is still missing
7. normalizes everything into the final response shape

### Exit point

The final SSE `result` event returns a normalized structured payload for the
frontend.

Only relevant processes are returned.

Some processes may still be included even with limited live evidence, if the
product intentionally wants them always present for the case type.

## Assistance Model

The onboarding assistance field should use:

- `assistance: "max" | "none" | "partial"`

Meaning:

- `max`: handle as much as possible for me
- `none`: I handle it myself
- `partial`: determine per step

Mapping to the current frontend onboarding values:

- `maximaal` -> `max`
- `zelf` -> `none`
- `keuze` -> `partial`

In the normalized process output, there are only two actors:

- `you`
- `us`

If the user chooses `partial`, the backend still returns processes
with a default `handled_by`, and the UI may later allow changing that per step.

## State Model

Every returned process has a state independent from `handled_by`.

Allowed values:

- `open`
- `blocked`
- `done`
- `pending`

Meaning:

- `open`: action can be taken now
- `blocked`: action cannot be taken yet, and the blocker must be explained
- `done`: already completed or already handled
- `pending`: important and active in the case, but not currently actionable

Rules:

- `blocked` should include a `blocked_reason`
- `blocked` may include `available_from` if it becomes actionable later
- `pending` can apply to either `you` or `us`

## Urgency and Deadlines

Each process may have:

- `deadline`
- or `urgent: true`
- or neither

But never both `deadline` and `urgent: true`.

Rules:

- If a concrete due date is known, use `deadline`
- If there is no concrete due date but immediate attention is needed, use
  `urgent: true`
- If neither applies, omit both

Example:

- incorrect correspondence address: `urgent: true`
- tax declaration due on a specific date: `deadline`

Address mismatches are especially important. If an organisation is expected to
send important or time-sensitive post and the current correspondence address
looks wrong or incomplete, that should usually surface as an urgent process
step.

Urgency display and relative phrases like "due in 2 weeks" are derived later
in code or UI and are out of scope for this implementation.

## Process Sources

There are three process categories.

### Fixed processes

These come from the predefined process list in
[docs/challenge-processes.yaml](/Users/arnold/Projects/inwoner-centraal/docs/challenge-processes.yaml).

The agent evaluates whether each predefined process is relevant based on
discovered data.

Only relevant fixed processes are returned.

### Dynamic processes

These are derived on the fly from Belastingdienst letters fetched through the
A2A connection.

These processes are not predefined in YAML.

They are inferred from returned correspondence, for example where a specific
brief implies an additional actionable or important step.

Dynamic processes must:

- be backed by at least one concrete letter
- follow the same state and urgency rules as fixed processes
- merge with a fixed process if they are clearly the same underlying step

### Always-include processes

These are intentionally included even when there is no current API integration
or no direct live evidence yet.

This matters especially for organisations such as the gemeente, where the demo
may still want to show a meaningful step even if the backend cannot yet
discover it from a live source.

Rules:

- these are explicitly configured, not hallucinated by the agent
- they should still be normalized into the same process model
- they may start in `open`, `blocked`, or `pending`, depending on known rules
- they should explain that inclusion is policy- or case-driven if no live
  evidence is available

## Backend Tooling Model

The backend owns the available REST APIs and A2A connections.

The frontend does not receive or manage that list.

The system prompt contains a static list of available APIs and a reference to
their OpenAPI documentation.

### Generic REST tools

There should be two generic REST tools.

#### `discover_api`

Input:

- `api`

Behavior:

- returns the complete OpenAPI JSON document for the named API

Purpose:

- the LLM uses this to inspect the exact paths, methods, request formats, and
  response formats before selecting an endpoint

#### `call_api`

Input:

- `method`
- `url`
- `body`
- optional `headers`

Behavior:

- performs the HTTP call and returns the raw structured result

Purpose:

- one generic execution tool for all REST operations

### A2A tool

There should be one generic A2A tool.

#### `call_a2a_agent`

Behavior:

- reuses or wraps the logic from
  [backend/reconciliation/a2a_client.py](/Users/arnold/Projects/inwoner-centraal/backend/reconciliation/a2a_client.py:1)
- allows the intake discovery agent to query the Belastingdienst agent for
  letters and related interpretation support

Notes:

- this should not introduce a parallel A2A implementation path if the existing
  client logic can be reused directly
- the current primary use case is fetching Belastingdienst letters

## REST APIs in Scope

The initial static API set in the prompt should match the current mock APIs:

- CAK mock API
- RDW mock API
- SVB mock API

Each API already exposes an OpenAPI schema:

- CAK:
  [mock-api/cak/README.md](/Users/arnold/Projects/inwoner-centraal/mock-api/cak/README.md:10)
- RDW:
  [mock-api/rdw/README.md](/Users/arnold/Projects/inwoner-centraal/mock-api/rdw/README.md:10)
- SVB:
  [mock-api/svb/README.md](/Users/arnold/Projects/inwoner-centraal/mock-api/svb/README.md:10)

The prompt should describe each API briefly and point the agent to the OpenAPI
reference location.

## Streaming Model

The endpoint should use Server-Sent Events.

Recommended event types:

- `progress`
- `tool_call_started`
- `tool_call_finished`
- `result`
- `error`

### Event intent

#### `progress`

Human-readable line to show in the UI.

Examples:

- `Received deceased BSN`
- `Discovering relevant APIs`
- `Calling CAK API`
- `Inspecting SVB partner profile`
- `Retrieving Belastingdienst letters via A2A`
- `Evaluating process relevance`

#### `tool_call_started`

Optional structured event with tool metadata for debugging or future UI
extensions.

#### `tool_call_finished`

Optional structured event with completion or summary metadata.

#### `result`

Final structured normalized payload.

#### `error`

Terminal failure with user-safe messaging.

## Final Response Shape

The backend contract should use English field names, even though the UI and
source data are Dutch.

The result should be close to the existing `OverzichtResponse`, but the domain
model for processes should no longer depend on current frontend bucket names
such as `taken` or `geen_actie_nodig`.

The backend should normalize discovered data into a frontend-compatible shape
while keeping the internal discovery model clearer.

### Recommended internal discovery model

At normalization time, each relevant process should have fields like:

- `id`
- `organisation`
- `title`
- `summary`
- `state`
- `handled_by`
- `deadline`
- `urgent`
- `blocked_reason`
- `available_from`
- `reason`
- `evidence`
- `form`

Where:

- `handled_by` is `you` or `us`
- `deadline` and `urgent` are mutually exclusive

### Process-level form definitions

If a process requires information that is not yet known, the agent should also
return a generated form definition for that process.

These forms should use the `ag-ui` format that is already described elsewhere
in the product narrative, rather than introducing a separate custom form
contract.

Examples:

- missing bank account for a refund or payment arrangement
- missing contact person details
- missing correspondence address
- missing vehicle transfer details

The form definition should be attached to the specific process that needs the
information and should already be shaped for `ag-ui` consumption.

Recommended internal fields:

- `form.id`
- `form.title`
- `form.description`
- `form.fields`
- `form.submit_label`

If `ag-ui` requires additional wrapper or metadata fields, those should be part
of the backend contract as well. The important requirement is that the backend
emits an `ag-ui`-compatible structure directly.

Each field should include:

- `name`
- `label`
- `type`
- `required`
- optional `placeholder`
- optional `prefill`
- optional `options`

### Mapping intent to current frontend shape

The backend may still populate the existing overview fields expected by the UI:

- `persona`
- `samenvatting`
- `regelingen`
- `agentstappen`
- `taken`
- `verwacht_binnenkort`
- `geen_actie_nodig`
- `correspondentie`
- `verplichtingen`
- `rechten`

However, the normalization logic should not treat those buckets as the source
of truth for discovery. They are presentation-oriented.

This keeps room for later UI refactoring without rewriting agent logic.

### Shared data storage

Collected data from generated process forms should be stored as reusable case
data, not only as answers for one single process.

That stored data should be combined with the standard discovered case data for
future process evaluation and future generated forms.

Examples:

- if the user supplies a correspondence address once, that can be reused for
  later address-related processes
- if the user supplies a bank account once, it can be reused by later refund or
  payment-related processes

## General Information Block

The intake discovery should first gather general information already shown in
the onboarding and any other immediately relevant case context.

Examples:

- deceased name
- surviving partner name
- relationship type
- date of death
- municipality of death
- key addresses
- known post mismatch or address risk
- high-level summary of what government data sources appear relevant

This information should be included in the final response in a backend-friendly
English structure and then mapped to the existing UI fields where needed.

## System Prompt Responsibilities

The new endpoint should use a new system prompt.

It should not reuse the Belastingdienst-only prompt as-is.

The new system prompt should instruct the agent to:

- start from the deceased BSN
- gather general information first
- inspect the predefined process list
- add configured always-include processes where applicable
- determine only relevant fixed processes
- retrieve Belastingdienst letters through A2A
- derive additional relevant dynamic processes from those letters
- generate process-level form definitions when required information is missing
- emit those process forms in an `ag-ui`-compatible structure
- use the generic REST and A2A tools, not imagined tools
- explain progress in short operational steps
- return structured output for backend normalization

The prompt should also list:

- which APIs exist
- where their OpenAPI docs can be found
- which A2A connection exists
- key invariants such as the `deadline` xor `urgent` rule

## Normalization Responsibilities

The backend should not trust the LLM to emit perfectly frontend-ready objects.

Instead:

1. the agent returns structured discovery output
2. backend normalization code validates and reshapes it
3. frontend receives the normalized final payload

Normalization should enforce:

- English field names
- `state` in the allowed enum
- `handled_by` in `you | us`
- `deadline` and `urgent` mutual exclusion
- omission of irrelevant processes
- well-formed process form definitions when a `form` is present
- `ag-ui` compatibility for every emitted process form
- merging submitted process-form data into reusable case data

## New Endpoint

Recommended path:

- `POST /api/intake-discovery/stream`

This endpoint:

- accepts the deceased BSN and handling preference
- accepts the deceased BSN and assistance preference
- starts an SSE stream immediately
- runs discovery and normalization
- emits progress and final result

Possible request body:

```json
{
  "deceased_bsn": "111222333",
  "assistance": "max"
}
```

## Scoped Frontend Changes

Frontend changes are in scope, but should remain intentionally small.

The goal is:

- make the onboarding work with live intake discovery
- keep the rest of the current frontend functioning with minimal disruption
- avoid broad UI redesign outside the `agentPlan` step
- remove the separate reconciliation widget and model that work as normal
  process steps instead

### Rework the `agentPlan` step

The current `agentPlan` step in
[frontend/src/app/next/components/onboarding/steps/AgentPlanStep.tsx](/Users/arnold/Projects/inwoner-centraal/frontend/src/app/next/components/onboarding/steps/AgentPlanStep.tsx:1)
shows a planned item list derived from static helper data.

That step should be completely reworked for intake discovery.

This new streamed discovery log replaces the current static list of process
items (`stappen`) in the frontend for the `agentPlan` step.

#### New behavior

Instead of showing a list of planned items, the step should show a simple log
card or box with text lines streamed from the backend.

Each line should show a simple status icon:

- `pending` for the current in-progress line
- `done` for completed lines

Only the current active line should show `pending`.

When a new progress line starts, the previous current line becomes `done`.

The visual design can stay simple:

- one card or bordered box
- stacked text lines
- minimal status icons

This is explicitly preferred over the current split between “op de achtergrond”
and “waar wij u nodig hebben”.

The existing static process-item list should be removed from this step rather
than kept alongside the streamed log.

#### Continue behavior

The `Verder` button should remain disabled until intake discovery is complete.

The user can only continue after:

- the SSE stream has finished successfully
- the final discovery result has been received

If discovery fails, the step should show an error state and should not allow
continuation until the user retries or restarts the step.

### Minimal changes outside `agentPlan`

For the rest of the frontend, changes should be kept minimal and focused on
compatibility with the new backend data format.

Recommended minimal frontend changes:

- update onboarding state to send `assistance: "max" | "none" | "partial"`
  instead of relying only on the current Dutch enum values
- add a small mapping layer from current onboarding values
  (`maximaal | zelf | keuze`) to the English backend contract
- add a small client utility or hook for the intake discovery SSE stream
- store the final discovery result and pass it into the existing overview flow
- render generated process forms inside normal process detail or step UI
- render those generated forms through the existing or intended `ag-ui` path
- persist submitted form data so it can be reused by later processes
- preserve the existing overview UI where possible

### Remove the separate reconciliation widget

The separate reconciliation widget should be removed from the overview.

That work now belongs in the normal process model:

- address checks become normal process steps
- missing required information becomes normal process steps with forms
- corrections should no longer live in a standalone widget outside the main
  process flow

### Overview compatibility

The existing overview and stappenplan screens should continue to work with as
few changes as possible.

That means the backend should do most of the normalization work.

Frontend changes outside onboarding should mainly be limited to:

- adapting to renamed or newly required fields
- handling `state`, `handled_by`, `deadline`, and `urgent` consistently
- supporting optional process `form` definitions
- tolerating the absence of currently irrelevant presentation buckets where the
  backend now omits them

The intention is not to redesign the overview in this phase.

### Suggested frontend integration points

Likely touch points:

- onboarding step implementation in
  [frontend/src/app/next/components/onboarding/steps/AgentPlanStep.tsx](/Users/arnold/Projects/inwoner-centraal/frontend/src/app/next/components/onboarding/steps/AgentPlanStep.tsx:1)
- onboarding flow controller in
  [frontend/src/app/next/components/onboarding/StartWizard.tsx](/Users/arnold/Projects/inwoner-centraal/frontend/src/app/next/components/onboarding/StartWizard.tsx:1)
- guidance/assistance types in
  [frontend/src/app/next/types/begeleiding.ts](/Users/arnold/Projects/inwoner-centraal/frontend/src/app/next/types/begeleiding.ts:1)
- overview loading hook in
  [frontend/src/app/next/hooks/useOverzicht.ts](/Users/arnold/Projects/inwoner-centraal/frontend/src/app/next/hooks/useOverzicht.ts:1)
- existing reconciliation UI components should be removed or folded into normal
  process rendering

### Address step behavior

Address checking is a first-class process step.

If an address mismatch is found and important post is expected from the
organisation, the process may be marked urgent.

Expected behavior:

- the process appears in the normal steps list
- if `assistance == "max"`, the system should pick this up and update the
  correspondence address directly where supported, so the user does not get a
  separate keep-or-change choice
- if `assistance == "partial"` or `assistance == "none"`, the user can choose
  either to update the correspondence address or to keep it as-is
- if the user explicitly chooses to keep the current address as-is in
  `partial` or `none`, the step can still be completed without taking an
  address-change action
- if no direct API update is possible, the step may still be shown with the
  required action or form

## Frontend-Backend Interaction

The intended onboarding interaction becomes:

1. user reaches the `agentPlan` step
2. frontend starts intake discovery with deceased BSN and `assistance`
3. frontend opens and listens to the SSE stream
4. frontend appends progress lines to the log card
5. frontend marks prior lines as done when newer progress lines arrive
6. frontend stores the final result payload when the `result` event arrives
7. frontend enables `Verder`
8. next onboarding step continues with the discovered data

## Suggested File-Level Changes

### Backend

- add a new URL route in
  [backend/reconciliation/urls.py](/Users/arnold/Projects/inwoner-centraal/backend/reconciliation/urls.py:1)
- add a new streaming Django view in
  [backend/reconciliation/views.py](/Users/arnold/Projects/inwoner-centraal/backend/reconciliation/views.py:1)
- add a dedicated intake discovery orchestration module, for example:
  - `backend/reconciliation/intake_discovery.py`
- add a new prompt module, for example:
  - `backend/reconciliation/intake_prompt.py`
- add generic REST OpenAPI discovery and execution helpers, for example:
  - `backend/reconciliation/api_tools.py`
- reuse or wrap
  [backend/reconciliation/a2a_client.py](/Users/arnold/Projects/inwoner-centraal/backend/reconciliation/a2a_client.py:1)
  for Belastingdienst letter retrieval
- add normalization logic, for example:
  - `backend/reconciliation/intake_normalization.py`
- add reusable case-data persistence for submitted process form data, for
  example:
  - `backend/reconciliation/intake_case_data.py`

### Docs and configuration

- keep
  [docs/challenge-processes.yaml](/Users/arnold/Projects/inwoner-centraal/docs/challenge-processes.yaml)
  as the fixed process reference
- add explicit always-include process configuration if needed, either in the
  same YAML or in a nearby companion config
- optionally add static API registry configuration, for example:
  - `backend/reconciliation/intake_api_registry.py`

## Risks and Tradeoffs

### Prompt complexity

The intake agent has more responsibility than the current Belastingdienst A2A
agent. The backend should therefore keep normalization and validation logic in
code rather than in prompt text alone.

### Generic API tool freedom

The `discover_api` plus `call_api` model is flexible, but it also gives the
LLM more room to pick the wrong endpoint. Progress logging and tool result
validation will matter.

### Presentation model drift

The current frontend still thinks in `taken`, `geen_actie_nodig`, and related
buckets. The backend should treat those as compatibility output, not as the
long-term domain model.

### Form growth

Process-scoped forms add flexibility, but they also introduce a second kind of
output next to the process itself. Validation and persistence rules should stay
strict so that collected data remains reusable and trustworthy.

### Dynamic process duplication

Belastingdienst letters may imply processes already covered by fixed YAML
processes. The normalization layer should merge duplicates where possible.

## Recommended Delivery Order

1. add backend route and SSE view skeleton
2. implement event streaming helper
3. implement static API registry and `discover_api`
4. implement generic `call_api`
5. reuse A2A client logic for Belastingdienst calls
6. implement new system prompt and orchestration loop
7. implement normalization and invariants
8. rework the `agentPlan` onboarding step into a streamed progress log
9. remove the separate reconciliation widget and fold that work into normal
   process rendering
10. add generated process-form support and reusable case-data persistence
11. wire final result to the existing frontend overview shape

## Success Criteria

The implementation is successful when:

- the frontend can start intake discovery with a deceased BSN
- the UI receives streaming progress lines over SSE
- the `agentPlan` step shows a simple progress log with pending and done states
- the `Verder` button stays disabled until discovery completes
- the backend discovers general case information
- the backend returns only relevant fixed processes
- the backend includes configured always-include processes where intended
- the backend adds relevant dynamic Belastingdienst-derived processes
- missing process data can be returned as process-scoped form definitions
- submitted process form data can be reused in later steps
- each returned process uses the English backend contract
- `deadline` and `urgent` never appear together
- address mismatch handling is part of the normal process flow, not a separate
  widget
- the final payload can feed the current overview UI with minimal frontend
  change
