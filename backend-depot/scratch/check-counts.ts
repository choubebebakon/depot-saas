import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const resTenant = await pool.query('SELECT COUNT(*) FROM "Tenant"');
    console.log('Total Tenants:', resTenant.rows[0].count);
    const resUser = await pool.query('SELECT COUNT(*) FROM "User"');
    console.log('Total Users:', resUser.rows[0].count);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
checkData();
