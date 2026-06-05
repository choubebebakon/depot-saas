export default function PrintButton({ onClick, label = '🖨️ Imprimer', className = '', disabled = false }) {
  const handleClick = () => {
    if (onClick) onClick();
    else window.print();
  };

  return (
    <button onClick={handleClick} disabled={disabled}
      className={`bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all ${className}`}>
      {label}
    </button>
  );
}
