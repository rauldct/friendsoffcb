import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.$executeRaw`
      INSERT INTO "Setting" (key, value) VALUES ('PAGE_VIEWS', '1')
      ON CONFLICT (key) DO UPDATE SET value = (COALESCE(NULLIF("Setting".value, ''), '0')::int + 1)::text
    `;
  } catch { /* ignore */ }

  return new NextResponse(null, { status: 204 });
}
