import { Lock, Pencil, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { AdresGegevens } from '../../types/begeleiding';
import { maskBsn, maskIban } from '../../types/begeleiding';

interface SecureGegevensCardProps {
  title: string;
  hint?: string;
  lockedContent: ReactNode;
  onEditStart: () => void;
  renderEditContent: () => ReactNode;
  onSave: () => void;
  onCancel: () => void;
}

export function SecureGegevensCard({
  title,
  hint,
  lockedContent,
  onEditStart,
  renderEditContent,
  onSave,
  onCancel,
}: SecureGegevensCardProps) {
  const [editing, setEditing] = useState(false);

  const startEdit = () => {
    onEditStart();
    setEditing(true);
  };

  const cancel = () => {
    onCancel();
    setEditing(false);
  };

  const save = () => {
    onSave();
    setEditing(false);
  };

  return (
    <section
      className={`rounded-lg border bg-white transition ${
        editing ? 'border-[#007AC8] ring-1 ring-[#007AC8]/30' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {hint && !editing && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-[#007AC8]/40 hover:text-[#007AC8]"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Bewerken
          </button>
        ) : (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Annuleren
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-md bg-[#007AC8] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0069AD]"
            >
              Opslaan
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        {editing ? (
          renderEditContent()
        ) : (
          <div className="flex gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            <div className="min-w-0 flex-1 text-sm text-gray-800">{lockedContent}</div>
          </div>
        )}
      </div>
    </section>
  );
}

interface GegevensInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function GegevensInput({ id, label, value, onChange, className }: GegevensInputProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#007AC8] focus:outline-none focus:ring-1 focus:ring-[#007AC8]"
      />
    </div>
  );
}

function DisplayRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export function NaamGegevensCard({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <SecureGegevensCard
      title="Naam"
      hint="Zo staat u geregistreerd bij betrokken organisaties."
      lockedContent={<p className="font-medium">{value}</p>}
      onEditStart={() => setDraft(value)}
      onSave={() => onChange(draft)}
      onCancel={() => setDraft(value)}
      renderEditContent={() => (
        <GegevensInput
          id="naam-edit"
          label="Volledige naam"
          value={draft}
          onChange={setDraft}
        />
      )}
    />
  );
}

export function AdresGegevensCard({
  value,
  onChange,
}: {
  value: AdresGegevens;
  onChange: (value: AdresGegevens) => void;
}) {
  const [draft, setDraft] = useState(value);

  const update = (patch: Partial<typeof value>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <SecureGegevensCard
      title="Woonadres / postadres"
      hint="Post van organisaties kan hierheen worden gestuurd."
      lockedContent={
        <dl className="grid gap-1 sm:grid-cols-2">
          <DisplayRow label="Straat" value={value.straat} />
          <DisplayRow label="Huisnummer" value={value.huisnummer} />
          <DisplayRow label="Postcode" value={value.postcode} />
          <DisplayRow label="Woonplaats" value={value.woonplaats} />
        </dl>
      }
      onEditStart={() => setDraft(value)}
      onSave={() => onChange(draft)}
      onCancel={() => setDraft(value)}
      renderEditContent={() => (
        <div className="grid gap-3 sm:grid-cols-2">
          <GegevensInput
            id="straat-edit"
            label="Straat"
            value={draft.straat}
            onChange={(v) => update({ straat: v })}
            className="sm:col-span-2"
          />
          <GegevensInput
            id="huisnummer-edit"
            label="Huisnummer"
            value={draft.huisnummer}
            onChange={(v) => update({ huisnummer: v })}
          />
          <GegevensInput
            id="postcode-edit"
            label="Postcode"
            value={draft.postcode}
            onChange={(v) => update({ postcode: v.toUpperCase() })}
          />
          <GegevensInput
            id="woonplaats-edit"
            label="Woonplaats"
            value={draft.woonplaats}
            onChange={(v) => update({ woonplaats: v })}
            className="sm:col-span-2"
          />
        </div>
      )}
    />
  );
}

export function BsnGegevensCard({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <SecureGegevensCard
      title="BSN"
      hint="Alleen zichtbaar wanneer u bewerkt."
      lockedContent={<p className="font-mono tracking-wide">{maskBsn(value)}</p>}
      onEditStart={() => setDraft(value)}
      onSave={() => onChange(draft)}
      onCancel={() => setDraft(value)}
      renderEditContent={() => (
        <GegevensInput
          id="bsn-edit"
          label="Burgerservicenummer"
          value={draft}
          onChange={(v) => setDraft(v.replace(/\D/g, '').slice(0, 9))}
        />
      )}
    />
  );
}

export function IbanGegevensCard({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <SecureGegevensCard
      title="IBAN"
      hint="Voor terugbetalingen en automatische incasso's."
      lockedContent={<p className="font-mono tracking-wide">{maskIban(value)}</p>}
      onEditStart={() => setDraft(value)}
      onSave={() => onChange(draft)}
      onCancel={() => setDraft(value)}
      renderEditContent={() => (
        <GegevensInput
          id="iban-edit"
          label="Rekeningnummer (IBAN)"
          value={draft}
          onChange={(v) => setDraft(v.toUpperCase())}
        />
      )}
    />
  );
}
