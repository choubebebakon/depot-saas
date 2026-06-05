export default function NumberInput({ label, name, value, onChange, min = 0, max, step = 1, unit, required, placeholder, error, disabled }) {
  const handleChange = (delta) => {
    const current = Number(value) || 0;
    const next = current + delta * step;
    if (min !== undefined && next < min) return;
    if (max !== undefined && next > max) return;
    onChange({ target: { name, value: next } });
  };

  const displayValue = value !== '' && value !== null && value !== undefined
    ? Number(value).toLocaleString('fr-FR')
    : '';

  return (
    <div>
      {label && (
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => handleChange(-1)}
          disabled={disabled || (min !== undefined && (Number(value) || 0) <= min)}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center">
          −
        </button>
        <div className="relative flex-1">
          <input type="number" name={name} value={value} onChange={onChange}
            placeholder={placeholder} min={min} max={max} step={step} disabled={disabled}
            className={`w-full bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-600'} focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none text-center font-mono ${unit ? 'pr-14' : ''}`} />
          {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{unit}</span>}
        </div>
        <button type="button" onClick={() => handleChange(1)}
          disabled={disabled || (max !== undefined && (Number(value) || 0) >= max)}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center">
          +
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">⚠️ {error}</p>}
    </div>
  );
}
