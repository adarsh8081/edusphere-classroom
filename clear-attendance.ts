import { db } from "./server/db";
import { sql } from "drizzle-orm";
import { attendance } from "./shared/schema";

async function clearAttendance() {
    console.log("Clearing attendance to allow schema migration...");
    await db.delete(attendance);
    console.log("Cleared.");
    process.exit(0);
}

clearAttendance();
