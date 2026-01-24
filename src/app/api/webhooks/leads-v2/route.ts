import { db } from "@/lib/db";
import { leads, columns } from "@/server/db/schema";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name, email, whatsapp, phone, company, notes, campaignSource, organizationId,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content, source
        } = body;

        // Support both phone and whatsapp fields in payload
        const finalWhatsapp = whatsapp || phone;

        // --- UTM Source Classification Logic ---
        let normalizedSource = campaignSource;

        // Logic Trace: calculated
        const rawSource = (utm_source || source || "").toLowerCase().trim();

        if (!normalizedSource) {
            if (rawSource === 'facebook' || rawSource === 'meta' || rawSource === 'instagram') {
                normalizedSource = "Meta";
            } else if (rawSource === 'google' || rawSource === 'adwords' || rawSource === 'google_ads') {
                normalizedSource = "Google";
            } else if (rawSource) {
                if (rawSource.includes("google")) normalizedSource = "Google";
                else if (rawSource.includes("meta") || rawSource.includes("facebook")) normalizedSource = "Meta";
                else normalizedSource = utm_source || source;
            }
        }

        // Basic validation - only name is required
        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        // Use the SHARED org ID regardless of input
        const orgId = "bilder_agency_shared";

        // Find ANY "Novos Leads" column regardless of organization
        let targetColumn = await db.query.columns.findFirst({
            where: (cols, { eq }) => eq(cols.title, "Novos Leads"),
        });

        if (!targetColumn) {
            targetColumn = await db.query.columns.findFirst({
                orderBy: [asc(columns.order)],
            });
        }

        if (!targetColumn) {
            return NextResponse.json(
                { error: "No columns found for this organization" },
                { status: 500 }
            );
        }

        // Create the lead
        const newLead = await db.insert(leads).values({
            name,
            email,
            whatsapp: finalWhatsapp,
            company,
            // Inject DEBUG info into notes
            notes: (notes || "") + `\n\n[DEBUG V2]\nutm_source: ${utm_source}\nrawSource: ${rawSource}\nnormalized: ${normalizedSource}\nTimestamp: ${new Date().toISOString()}`,
            campaignSource: normalizedSource,
            organizationId: orgId,
            columnId: targetColumn.id,
            status: "active",
            position: 0,
            // Persist raw UTM data
            utmSource: utm_source || source,
            utmMedium: utm_medium,
            utmCampaign: utm_campaign,
            pagePath: body.page_path,
        }).returning();

        return NextResponse.json({ success: true, lead: newLead[0], debug: { rawSource, normalizedSource } });
    } catch (error) {
        console.error("Error processing lead webhook:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
