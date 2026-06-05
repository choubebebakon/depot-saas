const fs = require('fs');

let code = fs.readFileSync('src/layouts/MainLayout.jsx', 'utf8');

// Replace NavItem SVG
code = code.replace(
  /<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">[\s\S]*?<\/svg>/,
  '<div className="shrink-0 text-slate-400 group-hover:text-white transition-colors">{icon}</div>'
);

// Replace Nav config SVG
code = code.replace(
  /const nav = useMemo\(\(\) => filterByRole\(\[[\s\S]*?\], role\), \[role, totalAlertes, alertesCritiques\]\);/,
  `const nav = useMemo(() => filterByRole([
    { id: 'TableauDeBord', label: 'Tableau de Bord', icon: <LayoutDashboard size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER, ROLES.COMMERCIAL, ROLES.COMPTABLE] },
    { id: 'ventes', label: 'Ventes', icon: <ShoppingCart size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER, ROLES.COMMERCIAL] },
    { id: 'caisse', label: 'Caisse Express', icon: <CreditCard size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.COMPTABLE] },
    { id: 'stocks', label: 'Stocks', icon: <Package size={ICON_SIZE} />, badge: totalAlertes, badgeCritique: alertesCritiques > 0, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER] },
    { id: 'receptions', label: 'Réceptions', icon: <Warehouse size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER] },
    { id: 'commandes', label: 'Commandes', icon: <ClipboardList size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT] },
    { id: 'avaries', label: 'Avaries & Pertes', icon: <AlertTriangle size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER] },
    { id: 'clients', label: 'Clients', icon: <Users2 size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.COMMERCIAL, ROLES.COMPTABLE] },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: <Users size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER, ROLES.COMPTABLE] },
    { id: 'catalogue', label: 'Catalogue', icon: <Box size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER, ROLES.COMMERCIAL] },
    { id: 'dlc', label: 'DLC & Lots', icon: <Target size={ICON_SIZE} />, badge: totalAlertes, badgeCritique: alertesCritiques > 0, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER] },
    { id: 'consignes', label: 'Consignes', icon: <ArrowRightLeft size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER] },
    { id: 'tournees', label: 'Tournées', icon: <MapPin size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER, ROLES.COMMERCIAL] },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={ICON_SIZE} /> },
    { id: 'commissions', label: 'Commissions', icon: <Tag size={ICON_SIZE} /> },
    { id: 'analyses', label: 'Analyses BI', icon: <BarChart3 size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.COMPTABLE] },
    { id: 'rapports', label: 'Rapports', icon: <Receipt size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.COMPTABLE] },
    { id: 'depots', label: 'Dépôts', icon: <Warehouse size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT] },
    { id: 'personnel', label: 'Utilisateurs', icon: <Users size={ICON_SIZE} />, roles: [ROLES.PATRON] },
    { id: 'settings', label: 'Paramètres', icon: <Settings size={ICON_SIZE} />, roles: [ROLES.PATRON, ROLES.GERANT] },
    { id: 'audit', label: 'Audit Patron', icon: <ShieldCheck size={ICON_SIZE} />, roles: [ROLES.PATRON] },
  ], role), [role, totalAlertes, alertesCritiques]);`
);

// Replace Logout button SVG
code = code.replace(
  /<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\{Icons\.logout\}<\/svg>/,
  '<LogOut size={ICON_SIZE} className="mr-3" />'
);

fs.writeFileSync('src/layouts/MainLayout.jsx', code);
console.log('MainLayout.jsx updated successfully.');
