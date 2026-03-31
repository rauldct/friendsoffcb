import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    // Increment global counter
    await prisma.$executeRaw`
      INSERT INTO "Setting" (key, value) VALUES ('PAGE_VIEWS', '1')
      ON CONFLICT (key) DO UPDATE SET value = (COALESCE(NULLIF("Setting".value, ''), '0')::int + 1)::text
    `;
    // Increment daily counter
    await prisma.$executeRawUnsafe(`
      INSERT INTO daily_pageviews (date, count) VALUES (CURRENT_DATE, 1)
      ON CONFLICT (date) DO UPDATE SET count = daily_pageviews.count + 1
    `);
  } catch { /* ignore */ }

  return new NextResponse(null, { status: 204 });
}
