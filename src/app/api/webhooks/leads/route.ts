import { db } from "@/lib/db";
import { leads, columns } from "@/server/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

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

    console.log("[Webhook] Processing Lead:", name);
    console.log("[Webhook] Raw Inputs:", { utm_source, source, campaignSource });

    // If no explicit campaignSource provided, try to infer from UTMs or source
    if (!normalizedSource) {
      const rawSource = (utm_source || source || "").toLowerCase();
      console.log("[Webhook] Calculated rawSource:", rawSource);

      if (rawSource) {
        if (rawSource.includes("google") || rawSource.includes("adwords")) {
          normalizedSource = "Google";
        } else if (rawSource.includes("meta") || rawSource.includes("facebook") || rawSource.includes("instagram")) {
          normalizedSource = "Meta";
        } else {
          // Fallback to the raw value if it doesn't match known patterns
          normalizedSource = utm_source || source;
        }
      }
    }

    console.log("[Webhook] Final normalizedSource:", normalizedSource);

    // Basic validation - only name is required
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Use the SHARED org ID regardless of input
    // This ensures all incoming leads go to the shared workspace
    const orgId = "bilder_agency_shared";

    // Find ANY "Novos Leads" column regardless of organization
    // Since we are in Single Tenant Shared Mode, we accept any column.
    let targetColumn = await db.query.columns.findFirst({
      where: (cols, { eq }) => eq(cols.title, "Novos Leads"),
    });

    if (!targetColumn) {
      // Fallback to ANY first column by order
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
      notes: (notes || "") + `\n\n[DEBUG Info]\nutm_source: ${utm_source}\nrawSource: ${(utm_source || source || "").toLowerCase()}\nnormalized: ${normalizedSource}`,
      campaignSource: normalizedSource,
      organizationId: orgId,
      columnId: targetColumn.id,
      status: "active",
      position: 0, // Add to top
      // Persist raw UTM data
      utmSource: utm_source || source,
      utmMedium: utm_medium,
      utmCampaign: utm_campaign,
      pagePath: body.page_path,
    }).returning();

    return NextResponse.json({ success: true, lead: newLead[0] });
  } catch (error) {
    console.error("Error processing lead webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
