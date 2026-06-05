import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

export default function AutocompleteInput({
  label, name, value, onChange, onSelect, fetchSuggestions,
  displayKey = 'nom', placeholder, required, error, disabled,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const ref = useRef(null);
  const inputRef = useRef(null);

  const loadSuggestions = useCallback(async (q) => {
    if (!q || q.length < 1) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const items = await fetchSuggestions(q);
      setSuggestions(items?.slice(0, 8) || []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [fetchSuggestions]);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery !== (selected?.[displayKey] || '')) {
      loadSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, loadSuggestions, displayKey, selected]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && !selected) {
      setQuery('');
    }
  }, [value, selected]);

  const handleSelect = (item) => {
    setSelected(item);
    setQuery(item[displayKey] || '');
    setOpen(false);
    setActiveIndex(-1);
    if (onSelect) onSelect(item);
    if (onChange) onChange({ target: { name, value: item.id } });
  };

  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    setSelected(null);
    setActiveIndex(-1);
    if (onChange) onChange({ target: { name, value: '' } });
    if (!q) setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <input ref={inputRef} type="text" value={query} onChange={handleQueryChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder} disabled={disabled}
          className={`w-full bg-slate-800 border ${error ? 'border-red-500 ring-1 ring-red-500/30' : 'border-slate-600 focus:border-amber-500 ring-1 ring-transparent focus:ring-amber-500/30'} text-white rounded-xl px-4 py-3 text-sm outline-none transition-all ${disabled ? 'opacity-40' : ''}`} />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
          {suggestions.map((item, idx) => (
            <button key={item.id || idx} type="button" onClick={() => handleSelect(item)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 ${idx === activeIndex ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300 hover:bg-slate-700'}`}>
              <span className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                {(item[displayKey] || '?').slice(0, 2).toUpperCase()}
              </span>
              <span className="font-medium">{item[displayKey]}</span>
            </button>
          ))}
        </div>
      )}
      {open && !loading && suggestions.length === 0 && query.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-4 text-center text-slate-500 text-sm">
          Aucun résultat
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-1">⚠️ {error}</p>}
    </div>
  );
}
