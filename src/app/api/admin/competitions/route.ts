import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: list all competitions with active status
export async function GET() {
  const competitions = await prisma.competitionData.findMany({
    select: { id: true, name: true, active: true, season: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(competitions);
}

// PATCH: toggle active status for a competition
export async function PATCH(req: NextRequest) {
  const { id, active } = await req.json();
  if (!id || typeof active !== "boolean") {
    return NextResponse.json({ error: "id and active (boolean) required" }, { status: 400 });
  }
  const updated = await prisma.competitionData.update({
    where: { id },
    data: { active },
    select: { id: true, name: true, active: true },
  });
  return NextResponse.json(updated);
}
