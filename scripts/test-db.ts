
import { config } from "dotenv";
config({ path: ".env.local" });

console.log("Environment loaded.");
console.log("DB URL (masked):", process.env.DATABASE_URL ? "Present" : "Missing");

import { db } from "../src/lib/db";
import { leads } from "../src/server/db/schema";
import { count } from "drizzle-orm";

async function main() {
    console.log("Connecting...");
    const result = await db.select({ count: count() }).from(leads);
    console.log("Leads count:", result[0].count);
    process.exit(0);
}

main().catch(console.error);
