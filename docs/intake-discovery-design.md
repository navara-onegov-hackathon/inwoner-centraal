# Intake Discovery Design

## Goal

Add a new backend endpoint for intake discovery that starts from a deceased
BSN, gathers relevant government and agent data, determines which processes
apply, and streams progress updates to the frontend while the work is running.

This endpoint replaces the separate reconciliation widget flow for onboarding.
It is meant to support the onboarding and intake journey, and to feed the
existing overview UI shape as closely as possible.

## Non-Negotiable Architecture

This intake discovery flow is the heart of the product and must be genuinely
agent-driven.

That means:

- an LLM agent determines which tools to call
- an LLM agent determines the basic user/case information first
- an LLM agent inspects the returned OpenAPI documents
- an LLM agent decides which concrete REST endpoint to call next, including
  method, URL, query, and body
- an LLM agent determines which processes are relevant
- an LLM agent determines process state, required missing information, and
  form needs
- an LLM agent generates `ag-ui` form definitions when information is missing
- an LLM agent derives and returns the normalized process output

This explicitly means the backend must not contain:

- hardcoded per-API endpoint selection logic for discovery
- hardcoded per-process relevance logic
- hardcoded per-organisation mapping logic that converts raw source data into
  process applicability
- manual data-conversion code that encodes business meaning the agent should
  infer itself
- hardcoded per-process form schemas
- manual backend generation of `ag-ui` forms for specific organisations or
  process types

Adding a new API such as KvK should require only:

- adding that API to the configured API registry data
- adding its OpenAPI reference location
- optionally updating the system prompt text if the product wants to describe
  the API in words

It must not require new discovery code branches for that organisation.

The backend may still contain thin generic infrastructure for:

- tool execution
- SSE transport
- OpenAI streaming
- A2A transport
- response validation
- persistence of user-provided case data

But the backend must not become a second rules engine for process relevance.
The same applies to process form generation.

This is complete agent-driven discovery with no hardcoded sequence and no
hardcoded domain conversion logic. The backend provides tools and transport.
The agent figures out the sequence, meaning, relevance, and missing data.

## Scope

This design covers:

- a new Django backend endpoint for intake discovery
- SSE streaming of agent progress
- OpenAI client streaming as the source of those progress events
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
These progress events come from the OpenAI streaming client and reflect the
real agent run, not a scripted backend sequence.

The progress log must be concrete and operational. It should mention the actual
organisation, source, or check being performed, not vague phase labels.

The backend agent:

1. determines the basic case information for the deceased case
2. registers that basic information through a tool call
3. inspects configured process data and available API/A2A registries
4. chooses which APIs or A2A agents to call
5. discovers the exact REST operations by reading OpenAPI documents
6. retrieves Belastingdienst letters through A2A where relevant
7. determines which fixed and dynamic processes are relevant
8. generates process-level forms where required information is still missing
9. returns the final normalized response shape

### Exit point

The final SSE `result` event returns a normalized structured payload for the
frontend.

Only relevant processes are returned.

Some processes may still be included even with limited live evidence, if the
product intentionally wants them always present for the case type.

The decision to include them still belongs to the agent, based on configured
policy/process data. It must not be encoded as per-process conditional Python
logic.

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

This list should be moved into JSON configuration data for runtime use. The
agent consumes that data as input.

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

This category also belongs in configuration data, not in hardcoded backend
logic.

## Configuration Data

The runtime should treat the following as data, not code:

- process registry
- API registry
- A2A registry

Preferred direction:

- `docs/challenge-processes.yaml` remains a human-edited source during design
- runtime consumes JSON artifacts derived from that source
- adding a new API or process source should be a configuration change

Suggested JSON artifacts:

- `backend/reconciliation/config/processes.json`
- `backend/reconciliation/config/apis.json`
- `backend/reconciliation/config/agents.json`

### API registry data

The API registry should contain, per API:

- stable `id`
- human name
- base URL
- OpenAPI JSON URL
- short description for the prompt

Example fields:

- `id`
- `name`
- `base_url`
- `openapi_url`
- `description`

### Process registry data

The process registry should contain, per process:

- stable `id`
- organisation
- label/title
- notes to guide the agent
- optional policy flags such as always-include

The registry must not contain executable discovery code. It is guidance and
policy input for the agent.

## Backend Tooling Model

These are OpenAI tools. They must be implemented and registered as actual
tools in the OpenAI client call.

They are not prompt conventions.

They are not pseudo-tools.

They are not backend helper functions hidden from the model.

The backend owns the available REST APIs and A2A connections.

The frontend does not receive or manage that list.

The system prompt contains a static list of available APIs and A2A endpoints,
based on backend configuration data, and references to their OpenAPI
documentation where applicable.

The agent is responsible for:

- deciding which API to inspect
- selecting which endpoint to call
- choosing query/body values from case context
- deciding which processes are relevant
- generating `ag-ui` forms for unavailable information or undetermined user
  choices

The backend must not hardcode those choices in domain-specific discovery code.

### Required OpenAI Tools

The intake discovery agent should have exactly these tool categories available.

#### `emit_progress`

This is a tool.

Input:

- `message`

Behavior:

- emits a concrete user-facing progress line for the SSE log

Purpose:

- progress becomes part of the actual agent run
- the model can report meaningful operational steps like RDW, SVB, CAK, or
  Belastingdienst checks
- progress structure lives in a tool, not only in free-form streamed text

Notes:

- messages should be concrete and operational
- messages should mention the source or organisation where possible
- generic messages like `Discovery gestart` or `Relevante processen bepalen`
  should be avoided

#### `discover_api`

This is a tool.

Input:

- `api`

Behavior:

- returns the complete OpenAPI JSON document for the named API

Purpose:

- the LLM uses this to inspect the exact paths, methods, request formats, and
  response formats before selecting an endpoint

#### `call_api`

This is a tool.

Input:

- `method`
- `url`
- `body`
- optional `headers`

Behavior:

- performs the HTTP call and returns the raw structured result

Purpose:

- one generic execution tool for all REST operations
- the agent must decide the concrete operation; `call_api` must not hide
  domain-specific endpoint selection in backend code

#### `call_a2a_agent`

This is a tool.

Input:

- `agent`
- `input`

Behavior:

- reuses or wraps the logic from
  [backend/reconciliation/a2a_client.py](/Users/arnold/Projects/inwoner-centraal/backend/reconciliation/a2a_client.py:1)
- allows the intake discovery agent to query the Belastingdienst agent for
  letters and related interpretation support

Notes:

- this should not introduce a parallel A2A implementation path if the existing
  client logic can be reused directly
- the current primary use case is fetching Belastingdienst letters

#### `register_process`

This is a tool.

Input:

- one complete relevant process object

Behavior:

- registers a relevant process in a schema-controlled structure

Purpose:

- the process structure is enforced by tool schema rather than long prompt text
- the agent uses this tool to output every relevant process
- irrelevant processes are omitted and therefore never registered

Notes:

- the JSON schema for this tool should define fields like:
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
- field notes and invariants should live in the tool schema
- `deadline` xor `urgent` should be enforced in the schema and in backend
  validation

#### `set_user_info`

This is a tool.

Input:

- one complete user/case information object for the base intake information

Behavior:

- registers the basic user and case information that should appear in the UI

Purpose:

- the agent establishes the base case information before process registration
- this keeps user info as structured output in a schema-controlled tool
- the backend does not need to infer or hand-assemble the base information

Notes:

- this should be called before `register_process`
- backend validation may reject process registration until user info has been
  set
- this tool should cover the basic information already shown in the UI and any
  additional immediately relevant case data the product wants to display

#### `complete_discovery`

This is a tool.

Input:

- optional summary metadata such as counts

Behavior:

- indicates that the agent has finished discovery and process registration

Purpose:

- gives a clean explicit end state to the agent run
- makes the backend less dependent on ad hoc final text output

### Tool Principles

- tool registration happens in the OpenAI client call
- tool schemas define structure
- prompts define intent, not object shape minutiae
- the agent decides which tools to call and in what order
- the backend executes the tools and validates results
- the backend must not silently replace missing tool use with hardcoded logic
- the expected high-level sequence is:
  - determine base information
  - call `set_user_info`
  - determine relevant processes
  - call `register_process` for each relevant process
  - call `complete_discovery`
- this is still one agent run, not multiple staged prompts or scripted backend
  phases

## REST APIs in Scope

The initial static API set in the prompt should match the current mock APIs:

- CAK mock API
- RDW mock API
- SVB mock API

This set should be supplied from JSON configuration data, not hardcoded in the
agent orchestration logic.

Each API already exposes an OpenAPI schema:

- CAK:
  [mock-api/cak/README.md](/Users/arnold/Projects/inwoner-centraal/mock-api/cak/README.md:10)
- RDW:
  [mock-api/rdw/README.md](/Users/arnold/Projects/inwoner-centraal/mock-api/rdw/README.md:10)
- SVB:
  [mock-api/svb/README.md](/Users/arnold/Projects/inwoner-centraal/mock-api/svb/README.md:10)

The prompt should describe each API briefly and point the agent to the OpenAPI
reference location.

Future APIs such as KvK should be added by updating this registry data only.
No organisation-specific discovery code should be necessary.

## Streaming Model

The endpoint should use Server-Sent Events.

The event stream must be driven by OpenAI client streaming.

Recommended implementation direction:

- use the OpenAI client streaming API in the backend
- translate streaming events into SSE events for the frontend
- surface tool-use progress and short natural-language status lines from the
  actual agent run
- do not simulate progress with scripted backend messages

### Orchestration Loop

The backend should use a ReAct-style loop.

Each model turn receives:

- the concise system prompt
- the original runtime user prompt
- compact working memory
- recent observations from previous actions

The backend should not keep appending every previous raw assistant/tool message
to one ever-growing chat transcript. Tool results should become observations in
the working memory for the next action decision.

This keeps the agent in control of reasoning and acting while avoiding a noisy
conversation history that grows with every API call.

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

- `Algemene gegevens van de overledene verzamelen`
- `Voertuiginformatie opvragen bij de RDW`
- `CAK-facturen en betaalstatus opvragen`
- `Partner- en uitkeringsgegevens opvragen bij de SVB`
- `Brieven opvragen bij de Belastingdienst`
- `Controleren of erfbelasting van toepassing is`
- `Bepalen of een RDW-proces nodig is`
- `Nagaan of het postadres afwijkt`
- `Ontbrekende gegevens bepalen voor voertuigoverschrijving`

Avoid generic user-facing messages like:

- `Discovery gestart`
- `Relevante processen bepalen`
- `Overzicht klaarzetten`

Those may exist internally, but the frontend log should show the more specific
action that the agent is actually performing.

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

The agent should return discovered data already in the intended process model.
The backend may do thin schema validation and transport adaptation, but it must
not re-interpret domain meaning through manual mapping code.

### Recommended internal discovery model

Each relevant process should have fields like:

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

This is not a backend-authored form library. The form definition itself must be
generated by the agent from:

- process context
- configured process notes
- discovered API and A2A context
- already known reusable case data

Examples:

- missing bank account for a refund or payment arrangement
- missing contact person details
- missing correspondence address
- missing vehicle transfer details

The form definition should be attached to the specific process that needs the
information and should already be shaped for `ag-ui` consumption.

The backend may validate that the returned structure is `ag-ui`-compatible, but
it must not hardcode organisation-specific form construction logic.

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

The final payload may still populate the existing overview fields expected by
the UI:

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

However, those buckets are presentation-oriented compatibility output. They are
not the source of truth for discovery, and they must not be produced by a
hardcoded backend rules engine.

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

## Prompt Design

The prompt should stay concise.

Structure and field details should live in tool schemas, not in a giant prompt
with overlapping rules.

### System Prompt

The new endpoint should use a short dedicated system prompt.

Suggested system prompt:

```text
You determine which processes are relevant for a deceased person’s case.

You will receive:
- current known case information
- a list of possible processes
- available REST APIs with their OpenAPI endpoints
- available agent-to-agent endpoints

Your job:
- determine the basic case information first and register it through the user-info tool
- determine which processes are relevant and which are irrelevant
- use the available APIs to gather the information needed to decide that
- retrieve Belastingdienst letters through the available A2A endpoint and use them to determine additional processes
- match required data for handling a process against:
  - the provided case data
  - data available from the APIs
- when information or user choices cannot be determined automatically, generate an ag-ui form
- register every relevant process through tool calls

Do not invent APIs, endpoints, fields, processes, or facts.
Use the available tools.
```

The system prompt should also contain:

- the configured API registry, including OpenAPI URLs
- the configured A2A registry

The system prompt should not contain:

- long field-by-field process schemas
- hardcoded endpoint instructions for each organisation
- implementation details about backend mistakes or fallback behavior

### User Prompt

The user prompt is the runtime discovery payload.

Suggested user prompt:

```text
Current case information:
{known_case_information}

Possible processes:
{possible_processes}

Determine which processes are relevant for this case.
Use the available APIs and A2A endpoint(s).
Determine the base user/case information first.
Register that information through the user-info tool.
Register each relevant process with tool calls.
If required information or a user choice is missing and cannot be determined automatically, generate an ag-ui form.
```

The user prompt should contain:

- current known information about the user/case
- the free-form list of available processes

The user prompt may include generic processes such as:

- address check against organisation-known address

Such generic processes may result in multiple concrete relevant processes across
different organisations.

### Prompt Responsibilities

The prompt tells the agent:

- what its job is
- what information it receives
- what APIs and A2A endpoints exist
- that it must use tools

The prompt does not define the response structure in prose. Tool schemas do
that.

## Validation Responsibilities

The backend should not trust the LLM blindly, but its role is validation, not
domain discovery.

Instead:

1. the agent returns structured discovery output and process decisions
2. backend validation code checks schema and invariants
3. backend performs only minimal compatibility shaping where required by the
   existing frontend contract
4. frontend receives the final payload

Validation should enforce:

- English field names
- `set_user_info` must be called before any process registration
- `state` in the allowed enum
- `handled_by` in `you | us`
- `deadline` and `urgent` mutual exclusion
- omission of irrelevant processes if the agent included them by mistake
- well-formed process form definitions when a `form` is present
- `ag-ui` compatibility for every emitted process form
- merging submitted process-form data into reusable case data

Validation must not expand into manual backend form generation.
Validation must not expand into manual backend process derivation either.

## New Endpoint

Recommended path:

- `POST /api/intake-discovery/stream`

This endpoint:

- accepts the deceased BSN and assistance preference
- starts an SSE stream immediately
- runs agent-driven discovery
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

The line text should be specific enough that the user can understand which
organisation or source is currently being consulted.

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

That means the backend should do only the minimum compatibility work needed for
the current UI.

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
4. frontend appends concrete progress lines to the log card
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
- add explicit OpenAI tool definitions, for example:
  - `backend/reconciliation/intake_tools.py`
- add generic REST OpenAPI discovery and execution helpers, for example:
  - `backend/reconciliation/api_tools.py`
- reuse or wrap
  [backend/reconciliation/a2a_client.py](/Users/arnold/Projects/inwoner-centraal/backend/reconciliation/a2a_client.py:1)
  for Belastingdienst letter retrieval
- add validation and minimal compatibility-shaping logic, for example:
  - `backend/reconciliation/intake_validation.py`
- add reusable case-data persistence for submitted process form data, for
  example:
  - `backend/reconciliation/intake_case_data.py`

### Docs and configuration

- keep
  [docs/challenge-processes.yaml](/Users/arnold/Projects/inwoner-centraal/docs/challenge-processes.yaml)
  as the fixed process reference
- add explicit always-include process configuration if needed, either in the
  same YAML or in a nearby companion config
- add JSON-backed API registry configuration, for example:
  - `backend/reconciliation/config/apis.json`
- add JSON-backed A2A registry configuration, for example:
  - `backend/reconciliation/config/agents.json`
- add JSON-backed process registry artifacts, for example:
  - `backend/reconciliation/config/processes.json`

## Risks and Tradeoffs

### Prompt complexity

The intake agent has more responsibility than the current Belastingdienst A2A
agent. The backend should therefore keep validation and invariant checks in
code, while keeping process meaning and relevance decisions inside the agent.

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

The mitigation is not to hand-author forms in backend code. The mitigation is:

- better process notes
- clearer API registry descriptions
- stronger prompt instructions
- strict `ag-ui` validation

### Dynamic process duplication

Belastingdienst letters may imply processes already covered by fixed YAML
processes. The agent should merge duplicates where possible, and backend
validation may reject obviously duplicated output.

## Recommended Delivery Order

1. add backend route and SSE view skeleton
2. implement event streaming helper
3. add JSON API/A2A/process registries
4. implement OpenAI tool definitions
5. implement generic `discover_api` and `call_api`
6. reuse A2A client logic for Belastingdienst calls
7. implement `set_user_info` plus `register_process` result collection
8. implement new system prompt, user prompt builder, and orchestration loop
9. implement OpenAI streaming plus validation and invariants
10. rework the `agentPlan` onboarding step into a streamed progress log
11. remove the separate reconciliation widget and fold that work into normal
    process rendering
12. add generated process-form support and reusable case-data persistence
13. wire final result to the existing frontend overview shape

## Success Criteria

The implementation is successful when:

- the frontend can start intake discovery with a deceased BSN
- the UI receives streaming progress lines over SSE
- the `agentPlan` step shows a simple progress log with pending and done states
- the streamed log lines are concrete and organisation-specific rather than
  generic discovery placeholders
- the `Verder` button stays disabled until discovery completes
- the agent discovers general case information
- the agent sets the basic user/case information through `set_user_info`
- the agent returns only relevant fixed processes
- the agent includes configured always-include processes where intended
- the agent adds relevant dynamic Belastingdienst-derived processes
- the agent registers relevant processes through actual tool calls
- the agent generates `ag-ui` forms through actual tool calls when needed
- missing process data can be returned as process-scoped form definitions
- submitted process form data can be reused in later steps
- each returned process uses the English backend contract
- `deadline` and `urgent` never appear together
- address mismatch handling is part of the normal process flow, not a separate
  widget
- the final payload can feed the current overview UI with minimal frontend
  change
