const COLOR_MAP = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  green: 'bg-emerald-500/20 text-emerald-400',
  red: 'bg-red-500/20 text-red-400',
  amber: 'bg-amber-500/20 text-amber-400',
  yellow: 'bg-amber-500/20 text-amber-400',
  blue: 'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
  violet: 'bg-purple-500/20 text-purple-400',
  slate: 'bg-slate-700 text-slate-400',
  gray: 'bg-slate-700 text-slate-400',
  orange: 'bg-orange-500/20 text-orange-400',
  pink: 'bg-pink-500/20 text-pink-400',
};

export default function Badge({ children, color = 'slate', className = '', size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'text-xs px-3 py-1.5' : 'text-xs px-2 py-1';
  return (
    <span className={`font-bold rounded-full ${sizeClass} ${COLOR_MAP[color] || COLOR_MAP.slate} ${className}`}>
      {children}
    </span>
  );
}
