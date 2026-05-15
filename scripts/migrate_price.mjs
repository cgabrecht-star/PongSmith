import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
console.log('Adding price_eur column to blades...');
await sql`ALTER TABLE blades ADD COLUMN IF NOT EXISTS price_eur numeric(6,2)`;
console.log('Adding price_eur column to rubbers...');
await sql`ALTER TABLE rubbers ADD COLUMN IF NOT EXISTS price_eur numeric(6,2)`;
console.log('Done.');
await sql.end();
