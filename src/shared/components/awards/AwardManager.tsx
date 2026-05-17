import { Award as AwardIcon, Banknote, Gift, Handshake, Medal, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Award, AwardPayload, AwardType } from '../../types/award';

const AWARD_TYPES: Array<{ value: AwardType; label: string; icon: typeof Trophy; color: string }> = [
  { value: 'trophy', label: 'Trophy', icon: Trophy, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'cash', label: 'Cash', icon: Banknote, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'recognition', label: 'Recognition', icon: Medal, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'sponsor', label: 'Sponsor', icon: Handshake, color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'other', label: 'Other', icon: Gift, color: 'bg-gray-50 text-gray-700 border-gray-200' }
];

const emptyDraft: AwardPayload = {
  tipo: 'trophy',
  descripcion: '',
  posicion: 1,
  condicionesEntrega: ''
};

type AwardManagerProps = {
  title: string;
  subtitle?: string;
  awards: Award[];
  loading?: boolean;
  onCreate: (payload: AwardPayload) => Promise<void>;
  onUpdate: (awardId: number, payload: AwardPayload) => Promise<void>;
  onDelete: (awardId: number) => Promise<void>;
};

export function AwardManager({ title, subtitle, awards, loading, onCreate, onUpdate, onDelete }: AwardManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Award | null>(null);
  const [draft, setDraft] = useState<AwardPayload>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const sortedAwards = [...awards].sort((a, b) => a.posicion - b.posicion || a.id - b.id);

  function openCreate() {
    setEditing(null);
    setDraft({ ...emptyDraft, posicion: Math.max(1, sortedAwards.length + 1) });
    setModalOpen(true);
  }

  function openEdit(award: Award) {
    setEditing(award);
    setDraft({
      tipo: award.tipo,
      descripcion: award.descripcion,
      posicion: award.posicion,
      condicionesEntrega: award.condiciones_entrega ?? ''
    });
    setModalOpen(true);
  }

  async function saveAward() {
    if (!draft.descripcion.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...draft,
        descripcion: draft.descripcion.trim(),
        condicionesEntrega: draft.condicionesEntrega?.trim() || null
      };
      if (editing) await onUpdate(editing.id, payload);
      else await onCreate(payload);
      setModalOpen(false);
      setEditing(null);
      setDraft(emptyDraft);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAward(award: Award) {
    if (!window.confirm(`Delete "${award.descripcion}"?`)) return;
    await onDelete(award.id);
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <AwardIcon size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">{title}</h2>
          </div>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} />
          Add award
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-4">Loading awards...</p>
      ) : sortedAwards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-6 text-center">
          <Trophy size={26} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-600">No awards yet</p>
          <p className="text-xs text-gray-400 mt-1">Define what each position receives and the delivery conditions.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sortedAwards.map((award) => {
            const type = AWARD_TYPES.find((item) => item.value === award.tipo) ?? AWARD_TYPES[0];
            const Icon = type.icon;
            return (
              <article key={award.id} className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${type.color}`}>
                        <Icon size={12} />
                        {type.label}
                      </span>
                      <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                        Position {award.posicion}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">{award.descripcion}</p>
                    {award.condiciones_entrega && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{award.condiciones_entrega}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => openEdit(award)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-white">
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => deleteAward(award)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit award' : 'New award'} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={draft.tipo}
                onChange={(event) => setDraft((prev) => ({ ...prev, tipo: event.target.value as AwardType }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {AWARD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                type="number"
                min="1"
                value={draft.posicion}
                onChange={(event) => setDraft((prev) => ({ ...prev, posicion: Math.max(1, Number(event.target.value) || 1) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              value={draft.descripcion}
              onChange={(event) => setDraft((prev) => ({ ...prev, descripcion: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Winner trophy, scholarship, mentoring package..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery conditions</label>
            <textarea
              rows={3}
              value={draft.condicionesEntrega ?? ''}
              onChange={(event) => setDraft((prev) => ({ ...prev, condicionesEntrega: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="Requires attendance, ID verification, sponsor confirmation..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={saveAward} disabled={!draft.descripcion.trim()}>
              Save award
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
