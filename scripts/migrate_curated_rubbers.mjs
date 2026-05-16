import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
console.log('Adding is_manually_curated column to rubbers...');
await sql`ALTER TABLE rubbers ADD COLUMN IF NOT EXISTS is_manually_curated boolean DEFAULT false NOT NULL`;
await sql`CREATE INDEX IF NOT EXISTS idx_rubbers_curated ON rubbers(is_manually_curated) WHERE is_manually_curated = true`;
console.log('Done.');
await sql.end();
