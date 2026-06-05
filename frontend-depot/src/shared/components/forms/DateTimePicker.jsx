export default function DateTimePicker({
  label, name, value, onChange, minDate, maxDate, showTime = false,
  required, placeholder, error, disabled,
}) {
  const inputType = showTime ? 'datetime-local' : 'date';

  const minAttr = minDate ? (typeof minDate === 'string' ? minDate : new Date(minDate).toISOString().slice(0, showTime ? 16 : 10)) : undefined;
  const maxAttr = maxDate ? (typeof maxDate === 'string' ? maxDate : new Date(maxDate).toISOString().slice(0, showTime ? 16 : 10)) : undefined;

  return (
    <div>
      {label && (
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input type={inputType} name={name}
        value={value || ''} onChange={onChange}
        min={minAttr} max={maxAttr}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-slate-800 border ${error ? 'border-red-500 ring-1 ring-red-500/30' : 'border-slate-600 focus:border-amber-500'} text-white rounded-xl px-4 py-3 text-sm outline-none transition-all ${disabled ? 'opacity-40' : ''}`} />
      {error && <p className="text-red-400 text-xs mt-1">⚠️ {error}</p>}
    </div>
  );
}
