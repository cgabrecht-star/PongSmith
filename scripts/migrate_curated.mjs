import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
console.log('Adding is_manually_curated column to blades...');
await sql`ALTER TABLE blades ADD COLUMN IF NOT EXISTS is_manually_curated boolean DEFAULT false NOT NULL`;
await sql`CREATE INDEX IF NOT EXISTS idx_blades_curated ON blades(is_manually_curated) WHERE is_manually_curated = true`;
console.log('Done.');
await sql.end();
