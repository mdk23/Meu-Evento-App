import { FieldSchemaField, WorkOrderCustomFields } from './types';

interface DynamicFieldsFormProps {
  fields: FieldSchemaField[];
  values: WorkOrderCustomFields;
  onChange: (values: WorkOrderCustomFields) => void;
}

export default function DynamicFieldsForm({ fields, values, onChange }: DynamicFieldsFormProps) {
  if (fields.length === 0) return null;

  const setValue = (key: string, value: WorkOrderCustomFields[string]) => {
    onChange({ ...values, [key]: value });
  };

  const toggleMultiselectOption = (key: string, option: string) => {
    const current = Array.isArray(values[key]) ? (values[key] as string[]) : [];
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
    setValue(key, next);
  };

  return (
    <div className="grid g2">
      {fields.map((field) => {
        const label = field.label || field.key;
        const value = values[field.key];

        if (field.type === 'boolean') {
          return (
            <label key={field.key} className="mini row" style={{ gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => setValue(field.key, e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
              {label}
            </label>
          );
        }

        if (field.type === 'select') {
          return (
            <div key={field.key} className="field" style={{ marginBottom: 0 }}>
              <label className="label">{label}</label>
              <select
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => setValue(field.key, e.target.value)}
                className="input"
              >
                <option value="">-- Select --</option>
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === 'multiselect') {
          const selected = Array.isArray(value) ? value : [];
          return (
            <div key={field.key} className="field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <label className="label">{label}</label>
              <div className="row" style={{ flexWrap: 'wrap', gap: 12, border: '1px solid var(--rule-strong)', borderRadius: 'var(--radius-sm)', padding: '8px 13px', background: 'var(--surface-solid)' }}>
                {(field.options || []).map((opt) => (
                  <label key={opt} className="mini row" style={{ gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(opt)}
                      onChange={() => toggleMultiselectOption(field.key, opt)}
                      style={{ width: 14, height: 14, accentColor: 'var(--accent)' }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          );
        }

        if (field.type === 'textarea') {
          return (
            <div key={field.key} className="field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <label className="label">{label}</label>
              <textarea
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => setValue(field.key, e.target.value)}
                rows={3}
                className="input"
              />
            </div>
          );
        }

        const htmlType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text';
        return (
          <div key={field.key} className="field" style={{ marginBottom: 0 }}>
            <label className="label">{label}</label>
            <input
              type={htmlType}
              value={value === null || value === undefined ? '' : String(value)}
              onChange={(e) => setValue(field.key, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
              className="input"
            />
          </div>
        );
      })}
    </div>
  );
}
