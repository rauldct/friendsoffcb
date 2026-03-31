import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const allowedFields = [
      "name", "abbreviation", "regions", "website", "email",
      "phone", "address", "president", "description", "memberCount", "zone",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        if (field === "memberCount") {
          data[field] = body[field] ? parseInt(body[field]) : null;
        } else {
          data[field] = body[field] || null;
        }
      }
    }

    // Handle socialMedia as JSON
    if ("socialMedia" in body) {
      data.socialMedia = body.socialMedia || undefined;
    }

    const federation = await prisma.penyaFederation.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      federation: {
        ...federation,
        lastScrapedAt: federation.lastScrapedAt?.toISOString() || null,
        createdAt: federation.createdAt.toISOString(),
        updatedAt: federation.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[Federations API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update federation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.penyaFederation.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Federations API] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete federation" },
      { status: 500 }
    );
  }
}
