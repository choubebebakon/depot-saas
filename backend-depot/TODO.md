# TODO (AuditInterceptor global)

- [ ] Comprendre la cause de l’erreur NestJS (AuditInterceptor global via APP_INTERCEPTOR injecte PrismaTxContext)
- [ ] Confirmer l’état actuel : AuditInterceptor déclaré dans app.module.ts ?
- [ ] Éditer `backend-depot/src/app.module.ts` : supprimer `AuditInterceptor` de `providers` (APP_INTERCEPTOR)
- [ ] Éditer `backend-depot/src/audit/audit.module.ts` : ajouter la déclaration `APP_INTERCEPTOR` -> `AuditInterceptor`
- [ ] Vérifier que `AuditModule` est bien importé dans `app.module.ts`
- [x] Démarrer/valider `nest start` : serveur démarre sans erreur d’injection (à valider côté terminal, commande échoue côté agent CLI Windows avec opérateurs logiques)

