import fs from "fs";
import path from "path";

/**
 * Structured logger for the API server
 */
export function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    const logLine = `${formattedTime} [${source}] ${message}`;
    console.log(logLine);
    try {
        fs.appendFileSync(path.join(process.cwd(), "server.log"), logLine + "\n");
    } catch (err) {
        // Ignore logging errors
    }
}
