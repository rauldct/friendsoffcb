import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getSettingValue(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env[key] || "";
}

export async function GET() {
  try {
    const [awinToken, awinPublisherId, awinAdvertiserId, stubhubId, bookingId, gygId] = await Promise.all([
      getSettingValue("AWIN_API_TOKEN"),
      getSettingValue("AWIN_PUBLISHER_ID"),
      getSettingValue("AWIN_BOOKING_ADVERTISER_ID"),
      getSettingValue("STUBHUB_AFFILIATE_ID"),
      getSettingValue("BOOKING_AFFILIATE_ID"),
      getSettingValue("GETYOURGUIDE_PARTNER_ID"),
    ]);

    const partners = [
      {
        name: "StubHub",
        type: "Tickets",
        configured: !!stubhubId,
        affiliateId: stubhubId ? `${stubhubId.slice(0, 4)}...` : "",
        trackingParam: "gcid",
        baseUrl: "stubhub.com",
        logo: "🎫",
      },
      {
        name: "Booking.com",
        type: "Hotels",
        configured: !!(awinPublisherId && awinAdvertiserId) || !!bookingId,
        affiliateId: awinPublisherId ? `Awin ${awinPublisherId}` : (bookingId ? `aid ${bookingId.slice(0, 4)}...` : ""),
        trackingParam: awinPublisherId ? "awin1.com redirect" : "aid",
        baseUrl: "booking.com",
        logo: "🏨",
      },
      {
        name: "GetYourGuide",
        type: "Activities",
        configured: !!gygId,
        affiliateId: gygId || "",
        trackingParam: "partner_id",
        baseUrl: "getyourguide.com",
        logo: "🎯",
      },
      {
        name: "Awin Network",
        type: "Affiliate Network",
        configured: !!(awinToken && awinPublisherId),
        affiliateId: awinPublisherId || "",
        trackingParam: "awinaffid",
        baseUrl: "awin.com",
        logo: "🔗",
      },
    ];

    if (!awinToken || !awinPublisherId) {
      return NextResponse.json({ configured: false, partners });
    }

    const headers = { Authorization: `Bearer ${awinToken}` };

    // Fetch account info, programmes, and transactions in parallel
    const [accountRes, programmesRes, transactionsRes] = await Promise.all([
      fetch(`https://api.awin.com/accounts`, { headers }).catch(() => null),
      fetch(`https://api.awin.com/publishers/${awinPublisherId}/programmes?relationship=joined`, { headers }).catch(() => null),
      fetchTransactions(awinPublisherId, awinToken),
    ]);

    const account = accountRes?.ok ? await accountRes.json() : null;
    const programmes = programmesRes?.ok ? await programmesRes.json() : [];
    const transactions = transactionsRes;

    // Fetch commission groups for each programme
    const programmesWithCommissions = [];
    for (const prog of (Array.isArray(programmes) ? programmes : [])) {
      let commissionGroups: unknown[] = [];
      try {
        const cgRes = await fetch(
          `https://api.awin.com/publishers/${awinPublisherId}/commissiongroups?advertiserId=${prog.id}`,
          { headers }
        );
        if (cgRes.ok) {
          const cgData = await cgRes.json();
          commissionGroups = cgData.commissionGroups || [];
        }
      } catch { /* ignore */ }

      programmesWithCommissions.push({
        id: prog.id,
        name: prog.name,
        status: prog.status,
        primarySector: prog.primarySector,
        currencyCode: prog.currencyCode,
        displayUrl: prog.displayUrl,
        logoUrl: prog.logoUrl,
        clickThroughUrl: prog.clickThroughUrl,
        commissionGroups,
      });
    }

    return NextResponse.json({
      configured: true,
      publisherId: awinPublisherId,
      account,
      programmes: programmesWithCommissions,
      transactions,
      partners,
    });
  } catch (err) {
    console.error("[Referrals API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch referral data" }, { status: 500 });
  }
}

async function fetchTransactions(publisherId: string, token: string) {
  try {
    // Last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const url = `https://api.awin.com/publishers/${publisherId}/transactions/?startDate=${startDate.toISOString().slice(0, 19)}&endDate=${endDate.toISOString().slice(0, 19)}&timezone=UTC`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch {
    return [];
  }
}
