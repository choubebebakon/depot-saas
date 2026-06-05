import { useState, useEffect } from 'react';

export default function SearchBar({ value = '', onChange, placeholder = '🔍 Rechercher...', className = '', debounceMs = 300 }) {
  const [local, setLocal] = useState(value);

  useEffect(() => { setLocal(value); }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => { if (local !== value) onChange(local); }, debounceMs);
    return () => clearTimeout(timer);
  }, [local]);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      className={`bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${className}`}
    />
  );
}
