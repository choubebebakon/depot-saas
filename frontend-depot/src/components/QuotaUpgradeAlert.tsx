import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { QUOTA_FORBIDDEN_EVENT, type PlanType, type QuotaForbiddenDetail } from '../api/api-interceptor';

type QuotaAlertState = {
  message: string;
  suggestedPlan?: PlanType | null;
};

export default function QuotaUpgradeAlert() {
  const [alert, setAlert] = useState<QuotaAlertState | null>(null);

  useEffect(() => {
    const handleQuotaForbidden = (event: Event) => {
      const detail = (event as CustomEvent<QuotaForbiddenDetail>).detail;
      setAlert({
        message: detail?.message || 'Quota atteint : veuillez mettre a niveau votre plan',
        suggestedPlan: detail?.metadata?.suggestedPlan,
      });
    };

    window.addEventListener(QUOTA_FORBIDDEN_EVENT, handleQuotaForbidden);
    return () => window.removeEventListener(QUOTA_FORBIDDEN_EVENT, handleQuotaForbidden);
  }, []);

  if (!alert) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-[120] flex justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-amber-400/40 bg-slate-950 text-white shadow-2xl shadow-black/30">
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
            <AlertTriangle size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black uppercase tracking-wide text-amber-200">
              Quota atteint
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-200">
              {alert.message}
            </p>
            <button
              type="button"
              onClick={() => {
                const highlight = alert.suggestedPlan ? `?highlight=${encodeURIComponent(alert.suggestedPlan)}` : '';
                window.location.href = `/pricing${highlight}`;
              }}
              className="mt-3 rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300"
            >
              Mettre a niveau
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAlert(null)}
            aria-label="Fermer"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
