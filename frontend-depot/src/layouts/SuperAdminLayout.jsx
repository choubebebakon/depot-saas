import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, LogOut, Shield, Users, TrendingUp, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo-neon.png';

const ICON_SIZE = 20;

const ADMIN_NAV = [
  { id: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={ICON_SIZE} /> },
  { id: '/admin/support', label: 'Support Global', icon: <MessageSquare size={ICON_SIZE} /> },
  { id: '/admin/users', label: 'Utilisateurs', icon: <Users size={ICON_SIZE} /> },
  { id: '/admin/analytics', label: 'Analytics', icon: <TrendingUp size={ICON_SIZE} /> },
];

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('/admin/dashboard');

  // Synchronise l'onglet actif avec l'URL courante
  useEffect(() => {
    const path = location.pathname;
    const match = ADMIN_NAV.find((item) => path.startsWith(item.id));
    if (match) setActivePage(match.id);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNav = (id) => {
    setActivePage(id);
    navigate(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col h-full bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 border-r border-indigo-900/30 w-72 shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-indigo-900/30">
          <div className="flex flex-col items-center">
            <img src={logo} alt="GesTock" className="w-32 h-auto object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.65)]" />
            <div className="text-center mt-3">
              <h2 className="text-white font-black text-xl tracking-wider">GesTock</h2>
              <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                SuperAdmin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {ADMIN_NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group ${
                activePage === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700'
              }`}
            >
              <div className={`shrink-0 mr-3 transition-colors ${
                activePage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'
              }`}>
                {item.icon}
              </div>
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-indigo-900/30 bg-slate-900/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-indigo-500/30">
              <Shield size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">SuperAdmin</p>
              <p className="text-indigo-400 text-[10px] uppercase tracking-tighter">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm font-bold transition-all group border border-transparent hover:border-red-500/30"
          >
            <LogOut size={ICON_SIZE} className="mr-3 transition-transform group-hover:-translate-x-1" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72">
            <aside className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 border-r border-indigo-900/30">
              {/* Mobile Header */}
              <div className="p-6 border-b border-indigo-900/30 flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="text-white font-black text-xl tracking-wider">GesTock</h2>
                  <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    SuperAdmin Panel
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                {ADMIN_NAV.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group ${
                      activePage === item.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700'
                    }`}
                  >
                    <div className={`shrink-0 mr-3 transition-colors ${
                      activePage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-indigo-900/30 bg-slate-900/30">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm font-bold transition-all group border border-transparent hover:border-red-500/30"
                >
                  <LogOut size={ICON_SIZE} className="mr-3" />
                  Déconnexion
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-indigo-900/30 px-6 flex items-center justify-between z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-indigo-400" />
              <span className="text-white font-black text-lg">SuperAdmin</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700/50 shadow-inner">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-lg shadow-indigo-500/30">
                <Shield size={14} />
              </div>
              <span className="text-white text-xs font-semibold hidden sm:block">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="max-w-[1600px] mx-auto min-h-full p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
