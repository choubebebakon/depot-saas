import { useState, useCallback } from 'react';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

export default function BarcodeScanner({ onScan, placeholder = 'Scanner ou saisir le code-barres' }) {
  const [input, setInput] = useState('');

  const handleCode = useCallback((code) => {
    setInput('');
    if (onScan) onScan(code);
  }, [onScan]);

  useBarcodeScanner({ onScan: handleCode });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) handleCode(input.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none font-mono" />
      <button type="submit"
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-colors">
        🔍
      </button>
    </form>
  );
}
