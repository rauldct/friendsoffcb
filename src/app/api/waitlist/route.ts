import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { checkSpam, getClientIp } from "@/lib/spam-detection";

export async function GET() {
  const count = await prisma.waitlist.count();
  return NextResponse.json({ count });
}

async function lookupGeoIP(ip: string): Promise<{ city?: string; region?: string; country?: string }> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    if (data.status === "success") {
      return { city: data.city, region: data.regionName, country: data.country };
    }
  } catch {}
  return {};
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source, country, _hp, _ts } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const ip = getClientIp(req);

    // Spam check
    const spamResult = checkSpam({
      email: normalized,
      ip,
      honeypot: _hp,
      formLoadedAt: _ts ? Number(_ts) : undefined,
      context: "waitlist",
      maxPerHour: 3,
    });

    if (spamResult.isSpam) {
      console.log(`[Waitlist] Blocked spam: ${normalized} (${spamResult.reason})`);
      return NextResponse.json({ ok: true, message: "registered" });
    }

    // Dedup silently
    const existing = await prisma.waitlist.findUnique({ where: { email: normalized } });
    if (existing) {
      return NextResponse.json({ ok: true, message: "already_registered" });
    }

    // Capture IP and User Agent
    const hdrs = headers();
    const userAgent = hdrs.get("user-agent") || null;

    // GeoIP lookup
    let geoCity: string | null = null;
    let geoRegion: string | null = null;
    let geoCountry: string | null = null;

    if (ip && ip !== "unknown") {
      const geo = await lookupGeoIP(ip);
      geoCity = geo.city || null;
      geoRegion = geo.region || null;
      geoCountry = geo.country || null;
    }

    await prisma.waitlist.create({
      data: {
        email: normalized,
        source: source ? String(source).slice(0, 50) : "barcaai",
        country: country ? String(country).slice(0, 100) : null,
        ip,
        userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
        geoCity,
        geoRegion,
        geoCountry,
      },
    });

    return NextResponse.json({ ok: true, message: "registered" });
  } catch (e) {
    console.error("Waitlist error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
