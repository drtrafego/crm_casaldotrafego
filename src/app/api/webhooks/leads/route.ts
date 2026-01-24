import { db } from "@/lib/db";
import { leads, columns } from "@/server/db/schema";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, email, whatsapp, phone, company, notes, campaignSource, organizationId,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content, source
    } = body;

    const finalWhatsapp = whatsapp || phone;

    // --- UTM Source Classification Logic (Bulletproof V3) ---
    let normalizedSource = campaignSource;

    // Force strict calculation
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

    // Validation
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const orgId = "bilder_agency_shared";

    let targetColumn = await db.query.columns.findFirst({
      where: (cols, { eq }) => eq(cols.title, "Novos Leads"),
    });

    if (!targetColumn) {
      targetColumn = await db.query.columns.findFirst({
        orderBy: [asc(columns.order)],
      });
    }

    if (!targetColumn) {
      return NextResponse.json({ error: "No columns found" }, { status: 500 });
    }

    // Insert with Debug Notes
    const timestamp = new Date().toISOString();
    const debugNote = `\n\n[DEBUG V3 CORRECT]\nTimestamp: ${timestamp}\nRaw: '${rawSource}'\nUTM: '${utm_source}'\nFinal: '${normalizedSource}'`;

    // Safety check for notes to be string
    const currentNotes = typeof notes === 'string' ? notes : "";

    const newLead = await db.insert(leads).values({
      name,
      email,
      whatsapp: finalWhatsapp,
      company,
      notes: currentNotes + debugNote,
      campaignSource: normalizedSource,
      organizationId: orgId,
      columnId: targetColumn.id,
      status: "active",
      position: 0,
      utmSource: utm_source || source,
      utmMedium: utm_medium,
      utmCampaign: utm_campaign,
      pagePath: body.page_path,
    }).returning();

    return NextResponse.json({ success: true, lead: newLead[0] });
  } catch (error) {
    console.error("Error processing lead webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
