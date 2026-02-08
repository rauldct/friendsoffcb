import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });
  return NextResponse.json({ subscribers });
}
