export default function Loader({ className = '', size = 'md', color = 'emerald', label = 'Chargement...', inline = false }) {
  const sizeMap = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-4', lg: 'w-12 h-12 border-4' };
  const colorMap = {
    emerald: 'border-emerald-500', amber: 'border-amber-500', blue: 'border-blue-500', red: 'border-red-500',
  };
  const wrapper = inline ? 'inline-flex items-center gap-2' : 'flex flex-col items-center justify-center py-16 gap-3';

  return (
    <div className={`${wrapper} ${className}`} role="status" aria-live="polite">
      <span className={`${sizeMap[size] || sizeMap.md} ${colorMap[color] || colorMap.emerald} border-t-transparent rounded-full animate-spin`} aria-hidden="true" />
      {label && <span className="text-slate-500 text-sm">{label}</span>}
    </div>
  );
}
