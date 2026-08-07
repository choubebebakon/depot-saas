# TODO Audit « zéro trou » — Phase 4 (Traçabilité Financière)

## Done
- [x] Décorateur `@AuditAction(action, entityType)`
- [x] Interceptor `AuditInterceptor` : log NORMALE sur succès, CRITIQUE sur exception
- [x] Méthode financière `PaiementService.traiterPaiement` décorée avec `@AuditAction('TRAITEMENT_PAIEMENT','PAIEMENT')`
- [x] Wiring `AuditModule` + provider `AuditInterceptor`
- [x] Activation globale via `APP_INTERCEPTOR` dans `app.module.ts`

## Remaining (Phase 4 completeness)
- [ ] Valider à l’exécution : une requête qui échoue sur `traiterPaiement` doit créer une ligne `AuditLog` avec `severite=CRITIQUE`
- [ ] Vérifier DB : `AuditLog.tenantId/depotId` corrects pour l’utilisateur connecté
- [ ] (Phase suivante) implémenter UPDATE/DELETE avec `valeurAvant`/`valeurApres`

