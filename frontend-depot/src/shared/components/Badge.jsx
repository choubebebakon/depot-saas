const COLOR_MAP = {
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  red: 'bg-red-500/20 text-red-400 border-red-500/20',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  violet: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  slate: 'bg-slate-700 text-slate-300 border-slate-600',
  gray: 'bg-slate-700 text-slate-300 border-slate-600',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
  pink: 'bg-pink-500/20 text-pink-400 border-pink-500/20',
};

export default function Badge({ children, color = 'slate', className = '', size = 'sm', title }) {
  const sizeClass = size === 'lg' ? 'text-xs px-3 py-1.5' : 'text-[11px] px-2 py-1';
  return (
    <span title={title} className={`inline-flex items-center font-bold rounded-full border ${sizeClass} ${COLOR_MAP[color] || COLOR_MAP.slate} ${className}`}>
      {children}
    </span>
  );
}
