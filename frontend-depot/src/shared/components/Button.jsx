import React from 'react';

const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500',
  secondary: 'bg-slate-700 text-white hover:bg-slate-600 focus-visible:ring-slate-500',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/10 focus-visible:ring-slate-400',
};

export default function Button({ variant = 'primary', loading = false, disabled = false, children, type = 'button', className = '', ...props }) {
  const isDisabled = disabled || loading;
  return (
    <button type={type} disabled={isDisabled} aria-busy={loading || undefined} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`} {...props}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
}
