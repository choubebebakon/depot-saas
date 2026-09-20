import { useState, useCallback, useEffect, useRef } from 'react';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

export default function BarcodeScanner({
  onScan,
  placeholder = 'Scanner ou saisir le code-barres',
  autoFocus = false,
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const handleCode = useCallback((code) => {
    const normalized = String(code || '').trim();
    if (!normalized) return;

    setInput('');
    onScan?.(normalized);
  }, [onScan]);

  useBarcodeScanner({ onScan: handleCode });

  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = (event) => {
    event.preventDefault();
    handleCode(input);
  };

  // Douchette HID branchée sur le champ : les caractères vont directement dans
  // l'input et le scanner termine par Entrée. Sans ce gestionnaire, cette touche
  // ne déclenche rien (l'input n'est pas dans un <form>) : le scan serait perdu.
  const handleInputKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    handleCode(input);
  };

  return (
    <div className="flex gap-2" role="search">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-label="Code-barres"
        className="flex-1 bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none font-mono"
      />
      <button
        type="button"
        onClick={handleSubmit}
        aria-label="Rechercher le code-barres"
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-colors"
      >
        🔍
      </button>
    </div>
  );
}
