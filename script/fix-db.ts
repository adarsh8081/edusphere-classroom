import pg from "pg";
import "dotenv/config";
const { Client } = pg;

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        console.log("Dropping student_risk table...");
        await client.query("DROP TABLE IF EXISTS student_risk;");
        console.log("Success!");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
