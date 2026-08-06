import { FieldSchemaField, WorkOrderCustomFields } from './types';

interface DynamicFieldsFormProps {
  fields: FieldSchemaField[];
  values: WorkOrderCustomFields;
  onChange: (values: WorkOrderCustomFields) => void;
}

const inputClasses = 'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none';

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {fields.map((field) => {
        const label = field.label || field.key;
        const value = values[field.key];

        if (field.type === 'boolean') {
          return (
            <label key={field.key} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => setValue(field.key, e.target.checked)}
                className="accent-emerald-500 w-4 h-4"
              />
              {label}
            </label>
          );
        }

        if (field.type === 'select') {
          return (
            <div key={field.key}>
              <label className="text-[10px] text-zinc-500 font-bold block mb-1">{label}</label>
              <select
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => setValue(field.key, e.target.value)}
                className={inputClasses}
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
            <div key={field.key} className="md:col-span-2">
              <label className="text-[10px] text-zinc-500 font-bold block mb-1">{label}</label>
              <div className="flex flex-wrap gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                {(field.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(opt)}
                      onChange={() => toggleMultiselectOption(field.key, opt)}
                      className="accent-emerald-500 w-3.5 h-3.5"
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
            <div key={field.key} className="md:col-span-2">
              <label className="text-[10px] text-zinc-500 font-bold block mb-1">{label}</label>
              <textarea
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => setValue(field.key, e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>
          );
        }

        const htmlType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text';
        return (
          <div key={field.key}>
            <label className="text-[10px] text-zinc-500 font-bold block mb-1">{label}</label>
            <input
              type={htmlType}
              value={value === null || value === undefined ? '' : String(value)}
              onChange={(e) => setValue(field.key, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
              className={inputClasses}
            />
          </div>
        );
      })}
    </div>
  );
}
