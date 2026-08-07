# TODO - Modules Audit, Support, SuperAdmin

## MainLayout
- [x] Intégrer `<SupportWidget />` au-dessus du chatbot (bottom: 92px)
- [x] Icônes lucide-react dans ADMIN_NAV (Settings, Users, Building2, ShieldCheck, BarChart3, LifeBuoy)
- [x] Onglet `/support` (LifeBuoy) + `/audit` (ShieldCheck) présents

## AuditPage
- [x] Corriger le bug `error` non défini (déjà corrigé dans le fichier)

## SupportPage (Alignement endpoints)
- [x] GET /support/tickets -> GET /support/messages
- [x] POST /support/tickets -> POST /support/messages
- [x] Mapper champs (message, user.email, statut)

## SuperAdminDashboard (Alignement endpoints)
- [x] /admin/stats -> /platform/metrics
- [x] /admin/stats/metiers -> regrouper depuis sectorStats
- [x] Mapper KPIs (mrr, arr, churnRate, arpu, ltv)

## SuperAdminSupport (Alignement endpoints)
- [x] GET /admin/support/tickets -> GET /support/admin/messages
- [x] PATCH /admin/support/tickets/:id/status -> PATCH /support/admin/messages/:id/statut
- [x] Mapper champs (message, user.email, tenant.name)

## Build
- [x] npm run build (frontend) passe sans erreur
