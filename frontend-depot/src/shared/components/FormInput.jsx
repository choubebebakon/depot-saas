export default function FormInput({
  label, name, value = '', onChange, type = 'text', required = false, placeholder, error,
  className = '', options, rows, disabled = false, helpText, autoComplete, min, max, step,
}) {
  const fieldId = `gestock-field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;
  const describedBy = [helpText && helpId, error && errorId].filter(Boolean).join(' ') || undefined;
  const baseClass = 'w-full bg-slate-800 border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const errorClass = error ? 'border-red-500/70' : 'border-slate-600';
  const common = {
    id: fieldId, name, value: value ?? '', onChange, disabled, required,
    'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy,
  };

  const renderInput = () => {
    if (options) {
      return (
        <select {...common} className={`${baseClass} ${errorClass}`}>
          <option value="">— Choisir —</option>
          {options.map((opt) => {
            const option = typeof opt === 'string' ? { value: opt, label: opt } : opt;
            return <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>;
          })}
        </select>
      );
    }
    if (type === 'textarea') {
      return <textarea {...common} placeholder={placeholder} rows={rows || 3} className={`${baseClass} ${errorClass} resize-y min-h-[88px]`} />;
    }
    return (
      <input {...common} type={type} placeholder={placeholder} autoComplete={autoComplete}
        min={min} max={max} step={step} className={`${baseClass} ${errorClass} ${type === 'number' ? 'font-mono' : ''}`} />
    );
  };

  return (
    <div className={className}>
      {label && (
        <label className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-1.5 block" htmlFor={fieldId}>
          {label} {required && <span className="text-red-400" aria-hidden="true">*</span>}
        </label>
      )}
      {renderInput()}
      {helpText && !error && <p id={helpId} className="text-slate-500 text-xs mt-1">{helpText}</p>}
      {error && <p id={errorId} role="alert" className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
