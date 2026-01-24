
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    console.log("Checking latest lead for debug info...");
    const result = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 1`;

    if (result.length > 0) {
        console.log("Latest Lead Data:");
        const fs = require('fs');
        fs.writeFileSync('scripts/debug_latest_v2.txt', JSON.stringify(result[0], null, 2));
        console.log("Saved to scripts/debug_latest_v2.txt");
    } else {
        console.log("No leads found.");
    }
}

main().catch(console.error);
