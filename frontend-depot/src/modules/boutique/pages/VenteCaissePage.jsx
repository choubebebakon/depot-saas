import { Suspense, lazy } from 'react';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';

const CaissePage = lazy(() => import('./CaissePage'));

function Loader() {
  return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;
}

export default function VenteCaissePage() {
  const perm = usePermission(PERMISSIONS, 'ventes');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">CAISSE POS</h1>
          <p className="text-slate-400 text-sm mt-1">Gestion de la caisse et des ventes</p>
        </div>
      </div>

      <Suspense fallback={<Loader />}>
        <CaissePage />
      </Suspense>
    </div>
  );
}