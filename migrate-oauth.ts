// Run with: npx tsx migrate-oauth.ts
// This adds OAuth columns to the users table

import pg from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("🚀 Running OAuth migration...");

        // Make password nullable
        await client.query(`
      ALTER TABLE users
      ALTER COLUMN password_hash DROP NOT NULL;
    `).catch(() => console.log("  ℹ️  password_hash already nullable"));

        // Add provider column
        await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'local';
    `);
        console.log("  ✅ Added provider column");

        // Add provider_id column
        await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS provider_id TEXT;
    `);
        console.log("  ✅ Added provider_id column");

        // Add attendance unique constraint (the one drizzle was asking about)
        await client.query(`
      ALTER TABLE attendance
      ADD CONSTRAINT IF NOT EXISTS attendance_class_id_student_id_date_unique
      UNIQUE (class_id, student_id, date);
    `).catch(() => console.log("  ℹ️  Attendance constraint already exists"));

        console.log("\n✅ Migration complete!");
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch((err) => {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
});
