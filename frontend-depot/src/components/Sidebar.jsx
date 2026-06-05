import React from 'react';
import { LogOut } from 'lucide-react';

/**
 * Composant Sidebar Poli
 * @param {Array} nav - Liste des items de navigation filtrés par rôle
 * @param {string} pageActive - ID de la page actuellement affichée
 * @param {function} setPageActive - Fonction pour changer de page
 * @param {object} user - Objet utilisateur (email, role, etc.)
 * @param {function} logout - Fonction de déconnexion
 * @param {string} logo - Chemin vers le logo
 * @param {number} totalAlertes - Nombre total d'alertes stock
 * @param {number} alertesCritiques - Nombre d'alertes critiques
 */
export default function Sidebar({
  nav,
  pageActive,
  setPageActive,
  user,
  logout,
  logo,
  totalAlertes,
  alertesCritiques,
  setSidebarOpen
}) {
  const ICON_SIZE = 20;

  return (
    <aside className="flex flex-col h-full bg-slate-950 border-r border-slate-800 w-64 shrink-0">
      {/* En-tête avec Logo GesTock */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex flex-col items-center">
          <img src={logo} alt="GesTock" className="w-28 h-auto object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.65)]" />
          <div className="text-center mt-2">
            <h2 className="text-white font-black text-lg tracking-wider">GesTock</h2>
            <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Gestion de stock • Cameroun
            </p>
          </div>
        </div>
      </div>

      {/* Indicateur d'Alertes Stock */}
      {totalAlertes > 0 && (
        <div
          onClick={() => { setPageActive('stocks'); if(setSidebarOpen) setSidebarOpen(false); }}
          className={`mx-3 mt-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all hover:opacity-80 ${
            alertesCritiques > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{alertesCritiques > 0 ? '🚨' : '⚠️'}</span>
            <div>
              <p className={`text-xs font-black ${alertesCritiques > 0 ? 'text-red-400' : 'text-orange-400'}`}>
                {totalAlertes} alerte{totalAlertes > 1 ? 's' : ''}
              </p>
              <p className="text-slate-600 text-[10px] uppercase font-bold">Voir les stocks</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Principale */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {nav.map((item) => (
          <button
            key={item.id}
            onClick={() => { setPageActive(item.id); if(setSidebarOpen) setSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
              pageActive === item.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className={`shrink-0 mr-3 transition-colors ${
              pageActive === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'
            }`}>
              {/* L'icône est passée avec size={20} depuis MainLayout */}
              {item.icon}
            </div>
            <span className="flex-1 text-left">{item.label}</span>

            {/* Badge de notification */}
            {item.badge != null && item.badge !== false && item.badge !== '' && (
              <span className={`text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                item.badgeCritique ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Pied de page : Profil & Déconnexion */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold truncate">{user?.email}</p>
            <p className="text-slate-500 text-[10px] uppercase tracking-tighter">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm font-bold transition-all group"
        >
          <LogOut size={ICON_SIZE} className="mr-3 transition-transform group-hover:-translate-x-1" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
