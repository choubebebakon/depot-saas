import React from 'react';

export default function Loader({ size = 'md', label = 'Chargement…', className = '' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-4' };
  return (
    <div className={`flex items-center justify-center gap-3 p-6 ${className}`} role="status" aria-live="polite">
      <span className={`animate-spin rounded-full border-current border-t-transparent ${sizes[size] || sizes.md}`} aria-hidden="true" />
      {label && <span className="text-sm text-slate-400">{label}</span>}
    </div>
  );
}
