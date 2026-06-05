export default function FormInput({
  label, name, value, onChange, type = 'text', required = false, placeholder, error, className = '', options, rows,
}) {
  const baseClass = 'w-full bg-slate-800 border focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors';
  const errorClass = error ? 'border-red-500' : 'border-slate-600';

  const renderInput = () => {
    if (options) {
      return (
        <select name={name} value={value} onChange={onChange} className={`${baseClass} ${errorClass}`}>
          <option value="">— Choisir —</option>
          {options.map((opt) => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
      );
    }
    if (type === 'textarea') {
      return (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows || 3}
          className={`${baseClass} ${errorClass} resize-none`} />
      );
    }
    return (
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className={`${baseClass} ${errorClass} ${type === 'number' ? 'font-mono' : ''}`} />
    );
  };

  return (
    <div className={className}>
      {label && (
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block" htmlFor={name}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
