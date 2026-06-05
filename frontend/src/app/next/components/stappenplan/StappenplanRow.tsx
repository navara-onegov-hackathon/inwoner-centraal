import {
  CalendarDays,
  Car,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Landmark,
  Loader2,
  Shield,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { BegeleidingsVoorkeur } from '../../types/begeleiding';
import type { StappenplanRow as StappenplanRowModel } from '../../lib/mapOverzichtToStappenplanTabs';
import { canOfferAgentForTask, delegateTaskToAgent } from '../../lib/agentDelegation';
import { completeTask, markTaskAwaitingSelfCompletion, readCaseData } from '../../lib/overzichtState';
import type { AGUIField, OverzichtResponse, ResolutionOption, Taak } from '../../types/overzicht';
import { TaskActionChoiceDialog } from './TaskActionChoiceDialog';

interface StappenplanRowProps {
  row: StappenplanRowModel;
  overzicht: OverzichtResponse;
  voorkeur: BegeleidingsVoorkeur;
  isUitgebreid: boolean;
  onOverzichtChange: (next: OverzichtResponse | null) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function StappenplanRow({
  row,
  overzicht,
  voorkeur,
  isUitgebreid,
  onOverzichtChange,
  expanded,
  onToggle,
}: StappenplanRowProps) {
  const Icon = getOrgIcon(row.organisatie);
  const canExpand = !row.locked;
  const taak = row.taakId ? overzicht.taken.find((t) => t.id === row.taakId) : undefined;
  const deadline = row.deadline ?? taak?.deadline;

  const statusLabel = row.completed
    ? 'Gedaan'
    : taak?.state === 'blocked'
      ? 'Nog niet beschikbaar'
      : taak?.handled_by === 'us'
        ? 'In behandeling'
        : 'Nog te doen';

  return (
    <div
      id={`step-${row.id}`}
      className={`${row.locked ? 'bg-gray-50/80' : 'bg-white'} ${
        expanded ? 'border-l-4 border-l-[#007AC8]' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => canExpand && onToggle()}
        className={`flex w-full items-start gap-4 px-6 py-4 text-left ${
          row.locked ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
        }`}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-gray-900">{row.title}</p>
          <p className="mt-0.5 text-sm text-gray-600">{row.description}</p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 text-sm">
              <span className={row.completed ? 'text-green-700' : taak?.state === 'blocked' ? 'text-gray-600' : 'text-[#007AC8]'}>
                {statusLabel}
              </span>
              {row.locked && (
                <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                  Vergrendeld
                </span>
              )}
            </div>
            {!row.completed && deadline && <DueDateLabel deadline={deadline} />}
          </div>
          {canExpand &&
            (expanded ? (
              <ChevronUp className="mt-0.5 h-4 w-4 text-gray-500" aria-hidden />
            ) : (
              <ChevronDown className="mt-0.5 h-4 w-4 text-gray-500" aria-hidden />
            ))}
        </div>
      </button>

      {expanded && canExpand && (
        <div className="border-t border-gray-100 px-6 pb-5 pt-2">
          {taak ? (
            <TaakExpandedDetail
              taak={taak}
              overzicht={overzicht}
              voorkeur={voorkeur}
              isUitgebreid={isUitgebreid}
              onOverzichtChange={onOverzichtChange}
            />
          ) : (
            <NonTaakExpandedDetail row={row} />
          )}
        </div>
      )}
    </div>
  );
}

function TaakExpandedDetail({
  taak,
  overzicht,
  voorkeur,
  isUitgebreid,
  onOverzichtChange,
}: {
  taak: Taak;
  overzicht: OverzichtResponse;
  voorkeur: BegeleidingsVoorkeur;
  isUitgebreid: boolean;
  onOverzichtChange: (next: OverzichtResponse | null) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    actionLabel: string;
    selfCompletionData?: Record<string, unknown>;
  } | null>(null);

  const brieven = overzicht.correspondentie.filter((b) => taak.bron_brief_ids.includes(b.id));
  const verplichtingen = overzicht.verplichtingen.filter((v) =>
    taak.bron_verplichting_ids.includes(v.id),
  );
  const agentstappen = overzicht.agentstappen.filter((s) => s.organisatie === taak.organisatie);
  const actionDisabled = taak.state === 'blocked' && taak.handled_by === 'you';

  const completeWithPatch = (patch: Record<string, unknown> = {}, successMessage?: string) => {
    const next = completeTask(overzicht, taak.id, patch);
    onOverzichtChange(next);
    setMessage(successMessage ?? 'Stap gemarkeerd als afgerond.');
  };

  const runWithActionChoice = (
    actionLabel: string,
    options?: {
      selfCompletionData?: Record<string, unknown>;
      directSelfComplete?: () => void;
    },
  ) => {
    if (canOfferAgentForTask(taak, voorkeur)) {
      setPendingAction({
        actionLabel,
        selfCompletionData: options?.selfCompletionData,
      });
      setChoiceOpen(true);
      return;
    }
    options?.directSelfComplete?.();
  };

  const handleChooseSelf = () => {
    const action = pendingAction;
    setChoiceOpen(false);
    setPendingAction(null);
    if (!action) return;

    const next = markTaskAwaitingSelfCompletion(
      overzicht,
      taak.id,
      action.selfCompletionData ?? {},
    );
    onOverzichtChange(next);
    setMessage(
      'Regel dit op uw eigen manier. Laat het ons weten wanneer u klaar bent via de knop hieronder.',
    );
  };

  const handleChooseAutomatic = async () => {
    setProcessing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));

    const next = delegateTaskToAgent(overzicht, taak.id);
    setProcessing(false);
    setChoiceOpen(false);
    setPendingAction(null);

    if (!next) {
      setMessage('Dit kon op dit moment niet automatisch worden geregeld. Probeer het later opnieuw.');
      return;
    }

    onOverzichtChange(next);
    setMessage('Wij proberen dit voor u te regelen. U ziet voortgang onder Wat wij doen.');
  };

  const handleConfirmSelfCompletion = () => {
    completeWithPatch(
      taak.self_completion_data ?? {},
      'Bedankt. Deze stap is gemarkeerd als afgerond.',
    );
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500">Organisatie</p>
          <p className="text-sm font-semibold text-gray-900">{taak.organisatie}</p>
        </div>
        {taak.deadline && (
          <div>
            <p className="text-xs text-gray-500">Uiterlijk vóór</p>
            <p className="text-sm font-semibold text-gray-900">{formatDeadline(taak.deadline)}</p>
          </div>
        )}
        {taak.bedrag && (
          <div>
            <p className="text-xs text-gray-500">Bedrag</p>
            <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-800">
              € {formatBedrag(taak.bedrag.bedrag)}
            </span>
          </div>
        )}
      </div>

      <p className="text-sm leading-relaxed text-gray-700">{taak.samenvatting}</p>

      {taak.state === 'blocked' && taak.blocked_reason && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Nog niet beschikbaar</p>
          <p className="mt-1">{taak.blocked_reason}</p>
          {taak.available_from && (
            <p className="mt-1 text-gray-600">Beschikbaar vanaf {formatDeadline(taak.available_from)}.</p>
          )}
        </div>
      )}

      {agentstappen.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Wat wij al deden</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {agentstappen.map((s) => (
              <li key={s.id}>→ {s.omschrijving}</li>
            ))}
          </ul>
        </div>
      )}

      {taak.awaiting_self_completion && (
        <div className="rounded-lg border border-green-200 bg-green-50/60 p-4">
          <p className="text-sm text-gray-700">
            U regelt deze stap zelf. Geef aan wanneer u klaar bent, dan sluiten wij deze stap af in
            uw overzicht. Liever toch dat wij het proberen? Dat kan nog steeds.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleConfirmSelfCompletion}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-md bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Ik heb dit aan mijn kant afgerond
            </button>
            {canOfferAgentForTask(taak, voorkeur) && (
              <button
                type="button"
                onClick={() => void handleChooseAutomatic()}
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-md border border-[#007AC8] bg-white px-5 py-2 text-sm font-semibold text-[#007AC8] hover:bg-[#E8F4FC]/60 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {processing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {processing ? 'Bezig...' : 'Toch automatisch laten regelen'}
              </button>
            )}
          </div>
        </div>
      )}

      {taak.toon_cta_in_lijst && taak.cta_label && !taak.awaiting_self_completion && (
        <div>
          <button
            type="button"
            disabled={actionDisabled}
            onClick={() =>
              runWithActionChoice(taak.cta_label!, {
                directSelfComplete: () => {
                  const next = markTaskAwaitingSelfCompletion(overzicht, taak.id);
                  onOverzichtChange(next);
                  setMessage(
                    'Regel dit op uw eigen manier. Laat het ons weten wanneer u klaar bent via de knop hieronder.',
                  );
                },
              })
            }
            className="rounded-md bg-[#007AC8] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 disabled:opacity-80"
          >
            {taak.cta_label}
          </button>
          {actionDisabled && taak.blocked_reason && (
            <p className="mt-2 text-xs text-gray-500">{taak.blocked_reason}</p>
          )}
        </div>
      )}

      {taak.resolution_options && taak.resolution_options.length > 0 && !taak.awaiting_self_completion && (
        <ResolutionOptions
          options={taak.resolution_options}
          disabled={actionDisabled}
          onChoose={(option) => {
            const successMessage =
              option.action === 'update_to_known_address'
                ? 'Het bekende woonadres wordt gebruikt als correspondentieadres.'
                : 'Deze stap is afgerond zonder adreswijziging.';
            runWithActionChoice(option.label, {
              selfCompletionData: option.payload ?? {},
              directSelfComplete: () =>
                completeWithPatch(option.payload ?? {}, successMessage),
            });
          }}
        />
      )}

      {taak.form && !taak.awaiting_self_completion && (
        <AGUIFormCard
          task={taak}
          disabled={actionDisabled}
          onSubmit={(values) =>
            runWithActionChoice(taak.form!.submit_label, {
              selfCompletionData: values,
              directSelfComplete: () =>
                completeWithPatch(
                  values,
                  'De ingevulde gegevens zijn opgeslagen voor volgende stappen.',
                ),
            })
          }
        />
      )}

      <TaskActionChoiceDialog
        open={choiceOpen}
        onOpenChange={(open) => {
          if (!open && !processing) {
            setChoiceOpen(false);
            setPendingAction(null);
          }
        }}
        actionLabel={pendingAction?.actionLabel ?? ''}
        taskTitle={taak.titel}
        taskOrganisatie={taak.organisatie}
        processing={processing}
        onChooseAutomatic={() => void handleChooseAutomatic()}
        onChooseSelf={handleChooseSelf}
      />

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          {message}
        </div>
      )}

      {isUitgebreid && (brieven.length > 0 || verplichtingen.length > 0) && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">Onderliggende gegevens</h3>

          {brieven.map((b) => (
            <div key={b.id} className="rounded-md bg-gray-50 p-3 text-sm">
              <p className="font-semibold">Brief — {b.type}</p>
              <p className="text-gray-600">{b.aanhef}</p>
              <p className="mt-1 text-gray-500">Verzonden: {b.verzonden_op}</p>
              {b.actie_omschrijving && <p className="mt-1">{b.actie_omschrijving}</p>}
            </div>
          ))}

          {verplichtingen.map((v) => (
            <div key={v.id} className="rounded-md bg-gray-50 p-3 text-sm">
              <p className="font-semibold">Verplichting</p>
              <p>{v.omschrijving}</p>
              {v.bedrag && <p className="mt-1">€ {v.bedrag.bedrag}</p>}
              <p className="text-gray-500">Vervaldatum: {v.vervaldatum}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResolutionOptions({
  options,
  disabled,
  onChoose,
}: {
  options: ResolutionOption[];
  disabled: boolean;
  onChoose: (option: ResolutionOption) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-900">Wat wilt u doen?</h3>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChoose(option)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AGUIFormCard({
  task,
  disabled,
  onSubmit,
}: {
  task: Taak;
  disabled: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const storedCaseData = useMemo(() => readCaseData(), []);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (task.form?.fields ?? []).map((field) => [
        field.name,
        field.prefill ?? getDefaultFieldValue(field, task) ?? String(storedCaseData[field.name] ?? ''),
      ]),
    ),
  );

  if (!task.form) return null;

  const visibleFields = task.form.fields.filter((field) => isFieldVisible(field, values));

  return (
    <form
      className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const payload = buildTaskSubmissionPayload(task, values);
        onSubmit(payload);
      }}
    >
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{task.form.title}</h3>
        <p className="mt-1 text-sm text-gray-700">{task.form.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visibleFields.map((field) => (
          <label key={field.name} className="flex flex-col gap-1 text-sm text-gray-800">
            <span className="font-medium">
              {field.label}
              {field.required ? ' *' : ''}
            </span>
            {field.type === 'select' ? (
              <select
                value={values[field.name] ?? ''}
                onChange={(e) => setValues((current) => ({ ...current, [field.name]: e.target.value }))}
                className="rounded-md border border-gray-300 bg-white px-3 py-2"
                required={field.required}
                disabled={disabled}
              >
                <option value="">Maak een keuze</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={values[field.name] ?? ''}
                onChange={(e) => setValues((current) => ({ ...current, [field.name]: e.target.value }))}
                className="rounded-md border border-gray-300 bg-white px-3 py-2"
                placeholder={field.placeholder}
                required={field.required}
                disabled={disabled}
              />
            )}
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-md bg-[#007AC8] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        {task.form.submit_label}
      </button>
    </form>
  );
}

function isFieldVisible(field: AGUIField, values: Record<string, string>) {
  const singleConditionSatisfied = !field.show_when
    || values[field.show_when.field] === field.show_when.equals;
  const allConditionsSatisfied = !field.show_when_all
    || field.show_when_all.every((condition) => values[condition.field] === condition.equals);
  return singleConditionSatisfied && allConditionsSatisfied;
}

function getDefaultFieldValue(field: AGUIField, task: Taak) {
  const defaults = (task.form?.meta?.defaults ?? {}) as Record<string, unknown>;
  const selfHolder = (defaults.self_holder ?? {}) as Record<string, unknown>;
  if (field.name === 'vehicle_action' && field.options?.length === 1) {
    return field.options[0].value;
  }
  if (field.name === 'transfer_target') {
    return 'self';
  }
  if (field.name === 'new_holder_bsn') {
    return typeof selfHolder.bsn === 'string' ? selfHolder.bsn : '';
  }
  if (field.name === 'new_holder_name') {
    return typeof selfHolder.name === 'string' ? selfHolder.name : '';
  }
  return '';
}

function buildTaskSubmissionPayload(task: Taak, values: Record<string, string>) {
  if (task.id !== 'taak-rdw-overschrijven') {
    return values;
  }

  const defaults = (task.form?.meta?.defaults ?? {}) as Record<string, unknown>;
  const selfHolder = (defaults.self_holder ?? {}) as Record<string, string>;
  const isTransfer = values.vehicle_action === 'transfer';
  const transferTarget = values.transfer_target;

  if (!isTransfer) {
    return {
      vehicle_action: values.vehicle_action,
      rechtsgrond: defaults.rechtsgrond ?? 'ERFRECHT',
    };
  }

  return {
    vehicle_action: values.vehicle_action,
    rechtsgrond: defaults.rechtsgrond ?? 'ERFRECHT',
    new_holder_bsn:
      isTransfer && transferTarget === 'self' ? selfHolder.bsn : values.new_holder_bsn,
    new_holder_name:
      isTransfer && transferTarget === 'self' ? selfHolder.name : values.new_holder_name,
    new_holder_address_straat: values.new_holder_address_straat,
    new_holder_address_huisnummer: values.new_holder_address_huisnummer,
    new_holder_address_postcode: values.new_holder_address_postcode,
    new_holder_address_stad: values.new_holder_address_stad,
    new_holder_address_landcode: values.new_holder_address_landcode,
  };
}

function NonTaakExpandedDetail({ row }: { row: StappenplanRowModel }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-gray-500">Organisatie</p>
        <p className="text-sm font-semibold text-gray-900">{row.organisatie}</p>
      </div>
      <p className="text-sm leading-relaxed text-gray-700">{row.description}</p>
    </div>
  );
}

function getOrgIcon(organisatie: string): LucideIcon {
  switch (organisatie) {
    case 'Gemeente':
      return Landmark;
    case 'RDW':
      return Car;
    case 'CAK':
      return Shield;
    case 'SVB':
      return Wallet;
    default:
      return FileText;
  }
}

function DueDateLabel({ deadline }: { deadline: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F4FC] px-2 py-0.5 text-[11px] font-medium leading-tight text-[#154273]">
      <CalendarDays className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      Uiterlijk vóór {formatDeadlineShort(deadline)}
    </span>
  );
}

function formatBedrag(value: string) {
  return Number(value).toLocaleString('nl-NL', { minimumFractionDigits: 0 });
}

function formatDeadlineShort(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
