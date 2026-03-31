import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { FEDERATIONS } from "@/lib/federation-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const federations = await prisma.penyaFederation.findMany({
      orderBy: { name: "asc" },
    });
    const serialized = federations.map((f) => ({
      ...f,
      lastScrapedAt: f.lastScrapedAt?.toISOString() || null,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));
    return NextResponse.json({ federations: serialized });
  } catch (err) {
    console.error("[Federations API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch federations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Seed mode: insert all known federations
    if (body.action === "seed") {
      let created = 0;
      let skipped = 0;
      for (const fed of FEDERATIONS) {
        const existing = await prisma.penyaFederation.findUnique({
          where: { name: fed.name },
        });
        if (existing) {
          skipped++;
          continue;
        }
        await prisma.penyaFederation.create({
          data: {
            name: fed.name,
            abbreviation: fed.abbreviation,
            regions: fed.regions,
            website: fed.website,
            email: fed.email,
            phone: fed.phone,
            address: fed.address,
            president: fed.president,
            description: fed.description,
            memberCount: fed.memberCount,
            zone: fed.zone,
          },
        });
        created++;
      }
      return NextResponse.json({
        success: true,
        created,
        skipped,
        total: FEDERATIONS.length,
      });
    }

    // Create single federation
    const { name, abbreviation, regions, website, email, phone, address, president, description, memberCount, zone } = body;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const federation = await prisma.penyaFederation.create({
      data: {
        name,
        abbreviation: abbreviation || null,
        regions: regions || [],
        website: website || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        president: president || null,
        description: description || null,
        memberCount: memberCount ? parseInt(memberCount) : null,
        zone: zone || null,
      },
    });
    return NextResponse.json({ success: true, federation });
  } catch (err) {
    console.error("[Federations API] POST error:", err);
    const msg = err instanceof Error ? err.message : "Failed to create";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
