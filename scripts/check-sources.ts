
import { db } from "../src/lib/db";
import { leads } from "../src/server/db/schema";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
    console.log("Analyzing existing lead sources...");

    const results = await db
        .select({
            source: leads.campaignSource,
            notes: leads.notes,
            count: sql<number>`count(*)`
        })
        .from(leads)
        .groupBy(leads.campaignSource, leads.notes);

    console.log("Found source variations:");
    results.forEach(r => {
        // Simple heuristic to check if note contains UTM-like data if source is empty
        const notePreview = r.notes ? r.notes.substring(0, 50).replace(/\n/g, ' ') : '';
        console.log(`Source: "${r.source || 'NULL'}" | Count: ${r.count} | Note Preview: "${notePreview}"`);
    });

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
