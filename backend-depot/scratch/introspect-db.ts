import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function introspect() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is missing');
    return;
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('Introspecting Tenant table columns...');
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Tenant';
    `);
    console.log('Columns in Tenant table:', JSON.stringify(res.rows, null, 2));

    console.log('Introspecting User table columns...');
    const resUser = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User';
    `);
    console.log('Columns in User table:', JSON.stringify(resUser.rows, null, 2));

    console.log('Introspecting Depot table columns...');
    const resDepot = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Depot';
    `);
    console.log('Columns in Depot table:', JSON.stringify(resDepot.rows, null, 2));
  } catch (error) {
    console.error('Introspection Error:', error);
  } finally {
    await pool.end();
  }
}

introspect();
