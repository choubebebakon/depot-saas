import { useState } from 'react';

export default function FormField({
  label, name, type = 'text', value, onChange, error, required, placeholder,
  disabled, hint, options, rows, min, max, step, unit, accept, multiple,
  toggleLabel,
}) {
  const [focused, setFocused] = useState(false);

  const baseClass = 'w-full bg-slate-800 border text-white rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200';
  const focusClass = focused ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-600';
  const errorClass = error ? 'border-red-500 ring-1 ring-red-500/30' : '';
  const disabledClass = disabled ? 'opacity-40 cursor-not-allowed' : '';
  const inputClass = `${baseClass} ${focusClass} ${errorClass} ${disabledClass}`;

  const toggleInputClass = 'w-10 h-6 bg-slate-700 rounded-full relative cursor-pointer transition-colors';
  const toggleDotClass = 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform';

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select name={name} value={value} onChange={onChange} disabled={disabled} className={inputClass}>
            <option value="">— {placeholder || 'Choisir'} —</option>
            {options?.map((opt) => (
              <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                {typeof opt === 'string' ? opt : opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-2 mt-1">
            {options?.map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const lbl = typeof opt === 'string' ? opt : opt.label;
              const selected = value?.includes(val);
              return (
                <button key={val} type="button" onClick={() => {
                  const next = selected ? value.filter(v => v !== val) : [...(value || []), val];
                  onChange({ target: { name, value: next } });
                }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selected ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                  {lbl}
                </button>
              );
            })}
          </div>
        );

      case 'textarea':
        return (
          <textarea name={name} value={value} onChange={onChange} placeholder={placeholder}
            rows={rows || 3} disabled={disabled}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            className={`${inputClass} resize-none`} />
        );

      case 'toggle':
        return (
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => onChange({ target: { name, value: !value } })}
              className={`${toggleInputClass} ${value ? 'bg-amber-500' : ''}`}>
              <span className={`${toggleDotClass} ${value ? 'translate-x-4' : ''}`} />
            </button>
            {toggleLabel && <span className="text-slate-300 text-sm">{toggleLabel}</span>}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name={name} checked={!!value} onChange={onChange}
              className="w-5 h-5 rounded-lg border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500/30" />
            {toggleLabel && <span className="text-slate-300 text-sm">{toggleLabel}</span>}
          </label>
        );

      case 'radio':
        return (
          <div className="flex flex-wrap gap-4 mt-1">
            {options?.map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const lbl = typeof opt === 'string' ? opt : opt.label;
              return (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name={name} value={val} checked={value === val} onChange={onChange}
                    className="w-4 h-4 text-amber-500 bg-slate-800 border-slate-600 focus:ring-amber-500/30" />
                  <span className="text-white text-sm">{lbl}</span>
                </label>
              );
            })}
          </div>
        );

      case 'number':
        return (
          <div className="relative">
            <input type="number" name={name} value={value} onChange={onChange} placeholder={placeholder}
              min={min} max={max} step={step} disabled={disabled}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              className={`${inputClass} ${unit ? 'pr-14' : ''}`} />
            {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{unit}</span>}
          </div>
        );

      case 'file':
        return (
          <div className="relative">
            <input type="file" name={name} onChange={onChange} accept={accept} multiple={multiple}
              disabled={disabled}
              className="w-full text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-700 file:text-white file:font-bold file:text-xs hover:file:bg-slate-600" />
          </div>
        );

      default:
        return (
          <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
            required={required} disabled={disabled}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            className={inputClass} />
        );
    }
  };

  return (
    <div>
      {label && (
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block" htmlFor={name}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠️</span>{error}</p>}
      {hint && !error && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
    </div>
  );
}
