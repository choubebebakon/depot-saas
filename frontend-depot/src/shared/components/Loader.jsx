export default function Loader({ className = '', size = 'md', color = 'amber' }) {
  const sizeMap = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' };
  const colorMap = { amber: 'border-amber-500', emerald: 'border-emerald-500', blue: 'border-blue-500', red: 'border-red-500' };

  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div className={`${sizeMap[size] || sizeMap.md} ${colorMap[color] || colorMap.amber} border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}
