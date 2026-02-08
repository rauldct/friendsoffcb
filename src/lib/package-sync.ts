import prisma from "@/lib/prisma";

async function getSettingKey(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env[key] || "";
}

interface StubhubEvent {
  title: string;
  url: string;
  date: string | null;
  priceSnippet: string | null;
}

interface GygActivity {
  title: string;
  url: string;
  priceSnippet: string | null;
}

// ============== STUBHUB SEARCH ==============

async function searchStubhubEvents(): Promise<StubhubEvent[]> {
  const braveKey = await getSettingKey("BRAVE_API_KEY");
  if (!braveKey) {
    console.log("[PackageSync] No BRAVE_API_KEY, skipping StubHub search");
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: "site:stubhub.com FC Barcelona tickets 2025 2026",
      count: "15",
      search_lang: "en",
    });

    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": braveKey,
      },
    });

    if (!res.ok) {
      console.error(`[PackageSync] Brave Search error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results = data.web?.results || [];

    const events: StubhubEvent[] = [];
    for (const r of results) {
      const url = r.url || "";
      // Only keep stubhub.com event/ticket pages
      if (!url.includes("stubhub.com") || !url.includes("ticket")) continue;

      // Try to extract a price from the snippet
      const priceMatch = (r.description || "").match(/(?:from\s+)?\$[\d,.]+/i);

      events.push({
        title: r.title || "",
        url,
        date: null, // Will be matched by opponent name
        priceSnippet: priceMatch ? priceMatch[0] : null,
      });
    }

    console.log(`[PackageSync] Found ${events.length} StubHub events`);
    return events;
  } catch (err) {
    console.error("[PackageSync] StubHub search error:", err);
    return [];
  }
}

// ============== GETYOURGUIDE SEARCH ==============

async function searchGetYourGuideActivities(): Promise<GygActivity[]> {
  const braveKey = await getSettingKey("BRAVE_API_KEY");
  if (!braveKey) {
    console.log("[PackageSync] No BRAVE_API_KEY, skipping GYG search");
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: "site:getyourguide.com Barcelona tours activities Camp Nou",
      count: "15",
      search_lang: "en",
    });

    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": braveKey,
      },
    });

    if (!res.ok) {
      console.error(`[PackageSync] Brave Search GYG error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results = data.web?.results || [];

    const activities: GygActivity[] = [];
    for (const r of results) {
      const url = r.url || "";
      if (!url.includes("getyourguide.com")) continue;

      const priceMatch = (r.description || "").match(/(?:from\s+)?(?:€|\$|£)[\d,.]+/i);

      activities.push({
        title: r.title || "",
        url,
        priceSnippet: priceMatch ? priceMatch[0] : null,
      });
    }

    console.log(`[PackageSync] Found ${activities.length} GYG activities`);
    return activities;
  } catch (err) {
    console.error("[PackageSync] GYG search error:", err);
    return [];
  }
}

// ============== MATCH STUBHUB EVENTS TO PACKAGES ==============

function matchEventToPackage(event: StubhubEvent, opponent: string): boolean {
  const titleLower = event.title.toLowerCase();
  const opponentLower = opponent.toLowerCase();

  // Direct opponent name match
  if (titleLower.includes(opponentLower)) return true;

  // Common name variations
  const aliases: Record<string, string[]> = {
    "real madrid": ["real madrid", "el clasico", "el clásico"],
    "atletico madrid": ["atletico", "atlético"],
    "real sociedad": ["real sociedad", "sociedad"],
    "real betis": ["real betis", "betis"],
    "athletic club": ["athletic bilbao", "athletic club"],
    "celta vigo": ["celta", "celta de vigo"],
    "rayo vallecano": ["rayo"],
    "deportivo alaves": ["alaves", "alavés"],
  };

  for (const [key, names] of Object.entries(aliases)) {
    if (opponentLower.includes(key) || key.includes(opponentLower)) {
      if (names.some((n) => titleLower.includes(n))) return true;
    }
  }

  return false;
}

function parsePrice(snippet: string | null): number | null {
  if (!snippet) return null;
  const match = snippet.match(/[\d,.]+/);
  if (!match) return null;
  return parseFloat(match[0].replace(/,/g, ""));
}

// ============== SYNC PACKAGES ==============

export async function syncPackages(): Promise<{
  packagesUpdated: number;
  stubhubMatched: number;
  gygActivities: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let packagesUpdated = 0;
  let stubhubMatched = 0;
  let gygActivities = 0;

  const runId = crypto.randomUUID();
  await prisma.automationRun.create({
    data: { id: runId, type: "package_sync", status: "running" },
  });

  try {
    // Fetch current packages
    const packages = await prisma.matchPackage.findMany({
      where: { status: "upcoming" },
      orderBy: { matchDate: "asc" },
    });

    if (packages.length === 0) {
      await prisma.automationRun.update({
        where: { id: runId },
        data: { status: "success", message: "No upcoming packages to sync.", endedAt: new Date() },
      });
      return { packagesUpdated: 0, stubhubMatched: 0, gygActivities: 0, errors: [] };
    }

    // Search StubHub + GYG in parallel
    const [stubhubEvents, gygResults] = await Promise.all([
      searchStubhubEvents(),
      searchGetYourGuideActivities(),
    ]);

    const affiliateId = await getSettingKey("STUBHUB_AFFILIATE_ID");
    const gygPartnerId = await getSettingKey("GETYOURGUIDE_PARTNER_ID");

    // Match StubHub events to packages
    for (const pkg of packages) {
      try {
        let updated = false;
        const updateData: Record<string, unknown> = { lastSyncedAt: new Date() };

        // Match StubHub event by opponent name
        const matchedEvent = stubhubEvents.find((e) => matchEventToPackage(e, pkg.opponent));
        if (matchedEvent) {
          let eventUrl = matchedEvent.url;
          if (affiliateId && !eventUrl.includes("gcid=")) {
            const sep = eventUrl.includes("?") ? "&" : "?";
            eventUrl += `${sep}gcid=${encodeURIComponent(affiliateId)}`;
          }
          updateData.stubhubEventUrl = eventUrl;
          updateData.stubhubEventId = matchedEvent.url.match(/\/(\d+)(?:\?|$)/)?.[1] || null;

          // Update ticket prices if found
          const price = parsePrice(matchedEvent.priceSnippet);
          if (price) {
            const tickets = pkg.tickets as Array<{ label: string; priceFrom: number; currency: string; affiliateUrl: string; provider: string }>;
            const updatedTickets = tickets.map((t) => ({
              ...t,
              priceFrom: price,
              affiliateUrl: eventUrl,
            }));
            updateData.tickets = updatedTickets;
          }

          stubhubMatched++;
          updated = true;
        }

        // Update activities with GYG results
        if (gygResults.length > 0) {
          const activities = pkg.activities as Array<{ label: string; priceFrom: number; affiliateUrl: string }>;
          if (activities.length > 0) {
            const updatedActivities = activities.map((activity) => {
              // Find a matching GYG activity by keyword
              const actLower = activity.label.toLowerCase();
              const matched = gygResults.find((g) => {
                const gLower = g.title.toLowerCase();
                if (actLower.includes("camp nou") && gLower.includes("camp nou")) return true;
                if (actLower.includes("sagrada") && gLower.includes("sagrada")) return true;
                if (actLower.includes("bike") && gLower.includes("bike")) return true;
                if (actLower.includes("food") && (gLower.includes("food") || gLower.includes("tapas"))) return true;
                if (actLower.includes("gothic") && gLower.includes("gothic")) return true;
                return false;
              });

              if (matched) {
                let gygUrl = matched.url;
                if (gygPartnerId && !gygUrl.includes("partner_id=")) {
                  const sep = gygUrl.includes("?") ? "&" : "?";
                  gygUrl += `${sep}partner_id=${encodeURIComponent(gygPartnerId)}`;
                }
                const price = parsePrice(matched.priceSnippet);
                gygActivities++;
                return {
                  ...activity,
                  affiliateUrl: gygUrl,
                  ...(price ? { priceFrom: price } : {}),
                };
              }
              return activity;
            });
            updateData.activities = updatedActivities;
            updated = true;
          }
        }

        if (updated) {
          await prisma.matchPackage.update({
            where: { id: pkg.id },
            data: updateData,
          });
          packagesUpdated++;
        }
      } catch (err) {
        errors.push(`Package ${pkg.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Archive past packages
    const now = new Date();
    await prisma.matchPackage.updateMany({
      where: {
        status: "upcoming",
        matchDate: { lt: new Date(now.getTime() - 2 * 86400000) }, // 2 days past
      },
      data: { status: "past" },
    });

    const message = `Synced ${packagesUpdated} packages: ${stubhubMatched} StubHub matches, ${gygActivities} GYG activities`;
    await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: "success",
        message,
        details: { packagesUpdated, stubhubMatched, gygActivities, errors },
        endedAt: new Date(),
      },
    });

    return { packagesUpdated, stubhubMatched, gygActivities, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "error", message: msg, endedAt: new Date() },
    });
    throw err;
  }
}
