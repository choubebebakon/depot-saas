import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { getMetierMenus, getMetierConfig } from "../config/metier-dashboard.config";
import { getSectorPrefix } from "./guards/SectorGuard";
import { useNotifications } from "../core/notifications/useNotifications";

const ADMIN_MENUS = [
  { label: "Utilisateurs",  icon: "\uD83D\uDC64", path: "utilisateurs" },
  { label: "D\u00E9p\u00F4ts",      icon: "\uD83C\uDFE2", path: "depots" },
  { label: "Param\u00E8tres",    icon: "\u2699\uFE0F", path: "parametres" },
  { label: "Abonnement",    icon: "\uD83D\uDCB3", path: "abonnement" },
];

const ADMIN_ROLES = ["PATRON", "GERANT", "ADMIN", "PHARMACIEN"];
const ABONNEMENT_URL = import.meta.env.VITE_ABONNEMENT_URL || 'https://gestock.app/tarifs';

export default function DynamicSidebar({ user, tenant, onLogout }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moduleConfig, setModuleConfig] = useState(null);

  const rawMetier = tenant?.metier || user?.metier || localStorage.getItem('gestock_metier');
  const metier     = rawMetier || "DEPOT_BOISSONS";
  const metierSlug = metier === 'DEPOT_BOISSONS' ? 'depot' : metier.toLowerCase().replace(/_/g, '-');
  const prefix     = useMemo(() => getSectorPrefix(metier), [metier]);

  useEffect(() => {
    async function loadModuleConfig() {
      try {
        const folder = metier === 'DEPOT_BOISSONS' ? 'depot-boissons' : metier.toLowerCase();
        const mod = await import(`../modules/${folder}/sidebar.config.js`);
        if (mod?.SIDEBAR_CONFIG?.[metier]) {
          setModuleConfig(mod.SIDEBAR_CONFIG[metier]);
        }
      } catch {
        setModuleConfig(null);
      }
    }
    loadModuleConfig();
  }, [metier]);

  const config = useMemo(
    () => moduleConfig || getMetierConfig(metier),
    [moduleConfig, metier]
  );

  const rawMenus = useMemo(
    () => moduleConfig?.menus || getMetierMenus(metier),
    [moduleConfig, metier]
  );

  const menus = useMemo(() => {
    return rawMenus.map(m => ({
      ...m,
      path: m.path.startsWith(prefix) ? m.path : prefix + (m.path.startsWith('/') ? '' : '/') + m.path,
    }));
  }, [rawMenus, prefix]);

  const isAdmin = useMemo(() => ADMIN_ROLES.includes(user?.role), [user?.role]);
  const couleur = useMemo(() => config?.couleur || "#2563eb", [config?.couleur]);
  const { unreadCount } = useNotifications();

  const isActive = useCallback((path) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path + '/') || location.pathname === path;
  }, [location.pathname]);

  const handleNavClick = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const adminLinkStyle = useCallback(
    ({ isActive: a }) => ({
      ...styles.navItem,
      backgroundColor: a ? "#f59e0b18" : "transparent",
      borderLeft: a ? "3px solid #f59e0b" : "3px solid transparent",
      color: a ? "#f59e0b" : "#64748b",
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "9px 10px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      transition: "all 0.15s ease",
      width: "100%",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "13.5px",
      fontWeight: 500,
      whiteSpace: "nowrap",
      overflow: "hidden",
    }),
    []
  );

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: collapsed ? "68px" : "240px",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div style={styles.logoArea}>
        <div
          style={{
            ...styles.metierBadge,
            backgroundColor: couleur + "18",
            border: `1px solid ${couleur}40`,
          }}
        >
          <span style={styles.metierIcon}>{config?.icon || "\uD83D\uDCCA"}</span>
          {!collapsed && (
            <span style={{ ...styles.metierLabel, color: couleur }}>
              {config?.label || "Inconnu"}
            </span>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          style={styles.collapseBtn}
          title={collapsed ? "Agrandir" : "R\u00E9duire"}
        >
          {collapsed ? "\u2192" : "\u2190"}
        </button>
      </div>

      <nav style={styles.nav}>
        {!collapsed && (
          <span style={styles.navSection}>Navigation</span>
        )}

        {menus.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              title={collapsed ? item.label : undefined}
              style={{
                ...styles.navItem,
                backgroundColor: active ? couleur + "18" : "transparent",
                borderLeft: active
                  ? `3px solid ${couleur}`
                  : "3px solid transparent",
                color: active ? couleur : "#94a3b8",
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span style={styles.navLabel}>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: couleur,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}

        {!collapsed && <div style={styles.divider} />}

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: '/notifications' }))}
          title={collapsed ? "Notifications" : undefined}
          style={{
            ...styles.navItem,
            color: location.pathname.startsWith("/notifications") ? couleur : "#94a3b8",
            backgroundColor: location.pathname.startsWith("/notifications") ? couleur + "18" : "transparent",
            borderLeft: location.pathname.startsWith("/notifications") ? `3px solid ${couleur}` : "3px solid transparent",
          }}
        >
          <span style={styles.navIcon}>{String.fromCodePoint(0x1F514)}</span>
          {!collapsed && (
            <>
              <span style={styles.navLabel}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ ...styles.badge, backgroundColor: "#ef4444" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </>
          )}
        </button>

        {isAdmin && (
          <>
            {!collapsed && (
              <span style={{ ...styles.navSection, marginTop: "8px" }}>
                Administration
              </span>
            )}
            {collapsed && <div style={styles.divider} />}

            {ADMIN_MENUS.map((item) => {
              const adminPath = `${prefix}/${item.path}`;
              return (
                <NavLink
                  key={item.label}
                  to={adminPath}
                  title={collapsed ? item.label : undefined}
                  style={adminLinkStyle}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  {!collapsed && (
                    <span style={styles.navLabel}>{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      <div style={styles.profileArea}>
        <div style={styles.divider} />
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          style={styles.profileBtn}
        >
          <div
            style={{
              ...styles.avatar,
              backgroundColor: couleur + "30",
              color: couleur,
            }}
          >
            {user?.nom?.[0]?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div style={styles.profileInfo}>
              <span style={styles.profileName}>
                {user?.nom || "Utilisateur"}
              </span>
              <span style={styles.profileRole}>{user?.role || "\u2014"}</span>
            </div>
          )}
        </button>

        {userMenuOpen && !collapsed && (
          <div style={styles.userMenu}>
            <button
              onClick={() => { navigate(`${prefix}/profil`); setUserMenuOpen(false); }}
              style={styles.userMenuItem}
            >
              {"\uD83D\uDC64"} Mon profil
            </button>
            <button
              onClick={() => { window.location.href = ABONNEMENT_URL; setUserMenuOpen(false); }}
              style={styles.userMenuItem}
            >
              {"\uD83D\uDCB3"} Abonnement
            </button>
            <div style={{ ...styles.divider, margin: "4px 0" }} />
            <button
              onClick={() => { onLogout?.(); setUserMenuOpen(false); }}
              style={{ ...styles.userMenuItem, color: "#f87171" }}
            >
              {"\uD83D\uDEAA"} D\u00E9connexion
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    height: "100vh",
    background: "#0d1117",
    borderRight: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    overflow: "hidden",
    flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  logoArea: {
    padding: "16px 12px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  metierBadge: {
    borderRadius: "10px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    overflow: "hidden",
  },
  metierIcon: { fontSize: "20px", flexShrink: 0 },
  metierLabel: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    letterSpacing: "-0.3px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  collapseBtn: {
    background: "transparent",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    color: "#475569",
    cursor: "pointer",
    padding: "6px 10px",
    fontSize: "12px",
    alignSelf: "flex-end",
    transition: "all 0.2s",
    fontFamily: "monospace",
  },
  nav: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    scrollbarWidth: "none",
  },
  navSection: {
    fontSize: "10px",
    fontWeight: 600,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    padding: "8px 10px 4px",
    display: "block",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 10px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "left",
    width: "100%",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13.5px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  navIcon: { fontSize: "16px", flexShrink: 0, width: "20px", textAlign: "center" },
  navLabel: { flex: 1, overflow: "hidden", textOverflow: "ellipsis" },
  badge: {
    fontSize: "10px",
    fontWeight: 700,
    color: "white",
    padding: "1px 6px",
    borderRadius: "10px",
    flexShrink: 0,
  },
  divider: {
    height: "1px",
    background: "#1e293b",
    margin: "4px 0",
  },
  profileArea: {
    padding: "8px",
    position: "relative",
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    background: "transparent",
    border: "none",
    borderRadius: "10px",
    padding: "10px",
    cursor: "pointer",
    transition: "background 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "14px",
    flexShrink: 0,
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    textAlign: "left",
  },
  profileName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#e2e8f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  profileRole: {
    fontSize: "11px",
    color: "#475569",
    whiteSpace: "nowrap",
  },
  userMenu: {
    position: "absolute",
    bottom: "64px",
    left: "8px",
    right: "8px",
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "6px",
    boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
    zIndex: 100,
  },
  userMenuItem: {
    display: "block",
    width: "100%",
    padding: "9px 12px",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    color: "#94a3b8",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
};
