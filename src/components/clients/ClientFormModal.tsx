'use client';

import { useEffect, useState } from 'react';
import { X, Save, Loader2, Users } from 'lucide-react';

export interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  notes: string;
}

const EMPTY_VALUES: ClientFormValues = { name: '', email: '', phone: '', companyName: '', notes: '' };

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  /** Seeds the form when editing an existing client — omit for a fresh "create" form. */
  initialValues?: Partial<ClientFormValues>;
  submitting: boolean;
  onSubmit: (values: ClientFormValues) => void;
}

/** The one client create/edit form in the app — used by the Client Directory's Add/Edit buttons
 * and by the booking POS terminal's "Register New Client" flow, so the fields and validation stay
 * identical everywhere a client gets created. */
export default function ClientFormModal({ isOpen, onClose, title, submitLabel, initialValues, submitting, onSubmit }: ClientFormModalProps) {
  const [values, setValues] = useState<ClientFormValues>({ ...EMPTY_VALUES, ...initialValues });

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues({ ...EMPTY_VALUES, ...initialValues });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <div className="modal-scrim">
      <div className="modal">
        <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
          <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            {title}
          </h3>
          <button type="button" onClick={onClose} className="icon-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 20 }}>
          <div className="field">
            <label className="label">Full Name</label>
            <input
              required
              autoFocus
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="e.g. Sofia Albuquerque"
              className="input"
            />
          </div>

          <div className="field">
            <label className="label">Company / Corporate Entity (Optional)</label>
            <input
              value={values.companyName}
              onChange={(e) => setValues((v) => ({ ...v, companyName: e.target.value }))}
              placeholder="e.g. Standard Bank"
              className="input"
            />
          </div>

          <div className="grid g2">
            <div className="field">
              <label className="label">Email</label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                placeholder="name@domain.com"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Phone Contact</label>
              <input
                value={values.phone}
                onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
                placeholder="+258 84..."
                className="input"
              />
            </div>
          </div>

          <div className="field">
            <label className="label">CRM Notes & Preferences</label>
            <textarea
              rows={3}
              value={values.notes}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
              placeholder="Preferences, allergy details, contract patterns..."
              className="input"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn primary" style={{ justifyContent: 'center' }}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {submitLabel}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
