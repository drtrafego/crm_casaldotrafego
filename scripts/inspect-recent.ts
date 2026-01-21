
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { desc } from "drizzle-orm";
import { config } from "dotenv";
import * as fs from 'fs';

config({ path: ".env.local" });

const leads = pgTable("leads", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    campaignSource: text("campaign_source"),
    notes: text("notes"),
    createdAt: timestamp("created_at"),
});

const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

async function main() {
    console.log("Fetching recent leads...");

    const recentLeads = await db
        .select({
            id: leads.id,
            name: leads.name,
            source: leads.campaignSource,
            notes: leads.notes,
            createdAt: leads.createdAt
        })
        .from(leads)
        .orderBy(desc(leads.createdAt))
        .limit(20);

    const output = `
--- Last 20 Leads ---
${recentLeads.map(l => {
        const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleString('pt-BR') : 'No Date';
        return `[${dateStr}] Name: ${l.name} | Source: ${l.source || 'NULL'} | Notes: "${l.notes || ''}"`;
    }).join('\n')}
`;

    console.log(output);
    fs.writeFileSync('scripts/recent_leads.txt', output);

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
