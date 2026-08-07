# TODO - Fix alerte TypeScript `baseUrl`

- [ ] Lire backend-depot/tsconfig.json et identifier s’il contient `baseUrl` ou `paths`
- [ ] Mettre à jour `backend-depot/tsconfig.json` pour supprimer `baseUrl` si présent (ou le remplacer par une configuration `paths` conforme)
- [ ] (Optionnel) vérifier `backend-depot/tsconfig.build.json` (extends) et s’assurer que la config de build est cohérente
- [ ] Lancer le build TypeScript (commande du projet) pour confirmer que l’avertissement a disparu

