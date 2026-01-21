
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, text, uuid, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { count, eq, sql } from "drizzle-orm";
import { config } from "dotenv";
import * as fs from 'fs';

config({ path: ".env.local" });

const leads = pgTable("leads", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    campaignSource: text("campaign_source"),
    notes: text("notes"),
    whatsapp: text("whatsapp"),
});

const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

async function main() {
    console.log("Analyzing existing lead sources (Standalone)...");

    const results = await db
        .select({
            source: leads.campaignSource,
            count: sql<number>`count(*)`
        })
        .from(leads)
        .groupBy(leads.campaignSource);

    // Look for potential candidates for normalization
    const googleCandidates = await db
        .select({ count: count() })
        .from(leads)
        .where(sql`lower(${leads.campaignSource}) like '%google%' AND ${leads.campaignSource} != 'Google'`);

    const metaCandidates = await db
        .select({ count: count() })
        .from(leads)
        .where(sql`(lower(${leads.campaignSource}) like '%meta%' OR lower(${leads.campaignSource}) like '%facebook%' OR lower(${leads.campaignSource}) like '%instagram%') AND ${leads.campaignSource} != 'Meta'`);

    const output = `
--- Source Summary ---
${results.map(r => `Source: [${r.source || 'NULL'}] - Count: ${r.count}`).join('\n')}

--- Candidates for Update ---
Google Normalization candidates: ${googleCandidates[0].count}
Meta Normalization candidates: ${metaCandidates[0].count}
`;

    console.log(output);
    fs.writeFileSync('scripts/results.txt', output);

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
