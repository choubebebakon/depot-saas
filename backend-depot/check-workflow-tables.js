// Vérification temporaire : tables du workflow des tournées
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRawUnsafe(
  "SELECT table_name FROM information_schema.tables WHERE table_name IN ('TourneeWorkflow','TourneeWorkflowLine','DetteCommerciale','DepotConsigneStock')",
)
  .then((r) => {
    console.log('TABLES_TROUVEES:', r.map((t) => t.table_name).join(', '));
    return p.$disconnect();
  })
  .catch((e) => {
    console.error('ERREUR:', e.message);
    process.exit(1);
  });