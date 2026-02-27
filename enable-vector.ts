import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
        console.log("pgvector extension successfully created!");
        process.exit(0);
    } catch (err) {
        console.error("Failed to execute extension:", err);
        process.exit(1);
    }
}

main();
