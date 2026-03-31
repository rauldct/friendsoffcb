import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await prisma.waitlist.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entries.map(e => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  })));
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.waitlist.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
