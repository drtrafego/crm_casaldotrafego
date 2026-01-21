
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { eq, sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local" });

const leads = pgTable("leads", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    campaignSource: text("campaign_source"),
    utmSource: text("utm_source"),
});

const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

async function main() {
    console.log("Starting backfill of lead sources from UTMs (Standalone)...");

    // Fetch leads with missing campaignSource but present utmSource
    const leadsToUpdate = await db
        .select({
            id: leads.id,
            name: leads.name,
            campaignSource: leads.campaignSource,
            utmSource: leads.utmSource
        })
        .from(leads)
        .where(
            sql`${leads.campaignSource} IS NULL AND ${leads.utmSource} IS NOT NULL`
        );

    console.log(`Found ${leadsToUpdate.length} leads to update.`);

    let updatedCount = 0;

    for (const lead of leadsToUpdate) {
        if (!lead.utmSource) continue;

        let newSource = lead.utmSource;
        const lowerSource = lead.utmSource.toLowerCase();

        if (lowerSource.includes("google") || lowerSource.includes("adwords")) {
            newSource = "Google";
        } else if (lowerSource.includes("meta") || lowerSource.includes("facebook") || lowerSource.includes("instagram")) {
            newSource = "Meta";
        }

        console.log(`Updating Lead ${lead.name}: ${lead.utmSource} -> ${newSource}`);

        await db
            .update(leads)
            .set({ campaignSource: newSource })
            .where(eq(leads.id, lead.id));

        updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} leads.`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
