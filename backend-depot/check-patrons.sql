SELECT u.id, u.email, u.role, u."depotId", u."tenantId", d.id as depot_real_id, d.nom, d."isArchived"
FROM "User" u
LEFT JOIN "Depot" d ON d.id = u."depotId"
WHERE u.role = 'PATRON';

SELECT d.id, d.nom, d."isArchived", d."tenantId" FROM "Depot" d LIMIT 20;
