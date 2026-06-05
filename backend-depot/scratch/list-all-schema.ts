import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkAllTables() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, column_name;
    `);
    
    const tables: Record<string, string[]> = {};
    res.rows.forEach(row => {
      if (!tables[row.table_name]) tables[row.table_name] = [];
      tables[row.table_name].push(row.column_name);
    });
    
    console.log(JSON.stringify(tables, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
checkAllTables();
