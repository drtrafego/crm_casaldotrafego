
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as fs from 'fs';

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    console.log("Fetching raw lead data...");
    const result = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 1`;

    console.log("Columns found:", Object.keys(result[0] || {}));
    console.log("Full Row:", JSON.stringify(result[0], null, 2));

    fs.writeFileSync('scripts/raw_lead.txt', JSON.stringify(result[0], null, 2));
}

main().catch(console.error);
