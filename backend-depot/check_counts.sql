SELECT (SELECT count(*) FROM "Tenant") AS tenants, (SELECT count(*) FROM "User") AS users, (SELECT count(*) FROM "Vente") AS ventes;
