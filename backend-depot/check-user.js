const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const result = await pool.query(
    `SELECT email, length(email) as len, encode(email::bytea, 'hex') as hex
     FROM "User"
     WHERE email ILIKE '%choubebebakon%'`
  );
  console.log('Lignes trouvées:', result.rows.length);
  result.rows.forEach((row) => {
    console.log('---');
    console.log('email exact :', JSON.stringify(row.email));
    console.log('longueur    :', row.len);
    console.log('hex         :', row.hex);
  });
  await pool.end();
}

main().catch((err) => {
  console.error('Erreur:', err.message);
  process.exit(1);
});