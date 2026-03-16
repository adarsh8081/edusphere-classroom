import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function clearData() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set.");
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to the database for cleanup.");

        // This query finds all tables in the 'public' schema and truncates them.
        // CASCADE ensures dependent records are also handled.
        // RESTART IDENTITY resets auto-incrementing IDs.
        const truncateQuery = `
            DO $$ 
            DECLARE 
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'pg_stat_statements') LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
                END LOOP;
            END $$;
        `;

        await client.query(truncateQuery);
        console.log("Successfully cleared all dummy data from the database.");
    } catch (err) {
        console.error("Error clearing database:", err);
    } finally {
        await client.end();
    }
}

clearData();
