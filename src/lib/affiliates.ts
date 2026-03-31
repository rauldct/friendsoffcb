import prisma from "@/lib/prisma";
import { TicketOption, HotelOption, ActivityOption } from "@/types";

// ============== FETCH AFFILIATE IDS ==============

interface AffiliateIds {
  stubhub: string;
  booking: string;
  getyourguide: string;
  awinToken: string;
  awinPublisherId: string;
  awinBookingAdvertiserId: string;
}

async function getSettingValue(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env[key] || "";
}

export async function getAffiliateIds(): Promise<AffiliateIds> {
  const [stubhub, booking, getyourguide, awinToken, awinPublisherId, awinBookingAdvertiserId] = await Promise.all([
    getSettingValue("STUBHUB_AFFILIATE_ID"),
    getSettingValue("BOOKING_AFFILIATE_ID"),
    getSettingValue("GETYOURGUIDE_PARTNER_ID"),
    getSettingValue("AWIN_API_TOKEN"),
    getSettingValue("AWIN_PUBLISHER_ID"),
    getSettingValue("AWIN_BOOKING_ADVERTISER_ID"),
  ]);
  return { stubhub, booking, getyourguide, awinToken, awinPublisherId, awinBookingAdvertiserId };
}

// ============== URL GENERATORS ==============

function stubhubUrl(matchTitle: string, affiliateId: string, eventUrl?: string | null): string {
  // Use specific event URL if available from sync
  if (eventUrl) {
    if (affiliateId && !eventUrl.includes("gcid=")) {
      const sep = eventUrl.includes("?") ? "&" : "?";
      return `${eventUrl}${sep}gcid=${encodeURIComponent(affiliateId)}`;
    }
    return eventUrl;
  }
  // Fallback to generic FC Barcelona category page
  const base = "https://www.stubhub.com/fc-barcelona-tickets/category/120817";
  if (!affiliateId) return base;
  return `${base}?gcid=${encodeURIComponent(affiliateId)}`;
}

function buildBookingDestinationUrl(
  hotelLabel: string,
  matchDate: Date,
  nights: number
): string {
  // Calculate check-in (day before match) and check-out
  const checkin = new Date(matchDate);
  checkin.setDate(checkin.getDate() - 1);
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + nights);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  // Determine star filter from label
  let starFilter = "";
  const starMatch = hotelLabel.match(/(\d)★/);
  if (starMatch) {
    starFilter = `&nflt=class%3D${starMatch[1]}`;
  }

  // Determine area from label
  let ss = "Camp Nou Barcelona Spain";
  const labelLower = hotelLabel.toLowerCase();
  if (labelLower.includes("gothic") || labelLower.includes("gòtic")) ss = "Gothic Quarter Barcelona Spain";
  else if (labelLower.includes("eixample")) ss = "Eixample Barcelona Spain";
  else if (labelLower.includes("gràcia") || labelLower.includes("gracia") || labelLower.includes("passeig")) ss = "Passeig de Gracia Barcelona Spain";
  else if (labelLower.includes("les corts")) ss = "Les Corts Barcelona Spain";
  else if (labelLower.includes("center") || labelLower.includes("centre")) ss = "Barcelona City Center Spain";

  const params = new URLSearchParams({
    ss,
    checkin: formatDate(checkin),
    checkout: formatDate(checkout),
    group_adults: "2",
    no_rooms: "1",
  });

  return `https://www.booking.com/searchresults.html?${params}${starFilter}`;
}

function awinTrackingUrl(
  destinationUrl: string,
  publisherId: string,
  advertiserId: string
): string {
  // Build Awin tracking link directly (no API call needed for deterministic format)
  return `https://www.awin1.com/cread.php?awinmid=${advertiserId}&awinaffid=${publisherId}&ued=${encodeURIComponent(destinationUrl)}&platform=pl`;
}

function bookingUrl(
  hotelLabel: string,
  matchDate: Date,
  nights: number,
  affiliateId: string,
  awinPublisherId?: string,
  awinAdvertiserId?: string
): string {
  const destUrl = buildBookingDestinationUrl(hotelLabel, matchDate, nights);

  // Prefer Awin tracking link if configured
  if (awinPublisherId && awinAdvertiserId) {
    return awinTrackingUrl(destUrl, awinPublisherId, awinAdvertiserId);
  }

  // Fallback to old Booking.com aid parameter
  if (affiliateId) {
    return `${destUrl}&aid=${encodeURIComponent(affiliateId)}`;
  }

  return destUrl;
}

// Direct deep links to specific GYG activities (instead of generic search pages)
const GYG_DIRECT_LINKS: Array<{ keywords: string[]; path: string }> = [
  { keywords: ["camp nou", "stadium tour", "museum", "barca tour"], path: "/barcelona-l45/camp-nou-experience-fc-barcelona-museum-tour-t1227/" },
  { keywords: ["bike", "cycling"], path: "/barcelona-l45/bike-tour-through-barcelona-t32004/" },
  { keywords: ["sagrada"], path: "/sagrada-familia-l2699/sagrada-familia-skip-the-line-ticket-t50027/" },
  { keywords: ["gothic", "gòtic", "barrio gotico"], path: "/barcelona-l45/barcelona-old-town-and-gothic-quarter-walking-tour-t61664/" },
  { keywords: ["boqueria", "food", "tapas tour", "street food"], path: "/barcelona-l45/barcelona-street-food-tour-la-boqueria-market-and-more-t625749/" },
  { keywords: ["montjuïc", "montjuic", "cable car"], path: "/barcelona-l45/barcelona-montjuic-cable-car-roundtrip-ticket-t23477/" },
  { keywords: ["flamenco"], path: "/barcelona-l45/tapas-and-flamenco-experience-t66363/" },
  { keywords: ["wine", "cava", "vineyard", "winery"], path: "/barcelona-l45/exclusive-local-cava-and-wine-tasting-at-family-run-winery-t94605/" },
  { keywords: ["sailing", "boat", "cruise"], path: "/barcelona-l45/barcelona-two-hour-sailing-cruise-t212973/" },
  { keywords: ["park güell", "park guell", "güell"], path: "/barcelona-l45/park-guell-guided-tour-with-skip-the-line-entry-ticket-t2323/" },
];

function getyourguideUrl(activityLabel: string, partnerId: string): string {
  const labelLower = activityLabel.toLowerCase();
  const partnerParam = partnerId ? `?partner_id=${encodeURIComponent(partnerId)}` : "";

  // Try to match a direct deep link
  for (const entry of GYG_DIRECT_LINKS) {
    if (entry.keywords.some(kw => labelLower.includes(kw))) {
      return `https://www.getyourguide.com${entry.path}${partnerParam}`;
    }
  }

  // Fallback to search page for unknown activities
  const params = new URLSearchParams({ q: activityLabel });
  if (partnerId) params.set("partner_id", partnerId);
  return `https://www.getyourguide.com/barcelona-l45/s/?${params}`;
}

// ============== INJECT AFFILIATE URLS ==============

export function injectAffiliateUrls(
  tickets: TicketOption[],
  hotels: HotelOption[],
  activities: ActivityOption[],
  matchDate: Date,
  affiliateIds: AffiliateIds,
  stubhubEventUrl?: string | null
): {
  tickets: TicketOption[];
  hotels: HotelOption[];
  activities: ActivityOption[];
} {
  const enrichedTickets = tickets.map(t => ({
    ...t,
    affiliateUrl: t.affiliateUrl && t.affiliateUrl !== "#"
      ? t.affiliateUrl // Keep manually set URLs
      : stubhubUrl(t.label, affiliateIds.stubhub, stubhubEventUrl),
  }));

  const enrichedHotels = hotels.map(h => ({
    ...h,
    affiliateUrl: h.affiliateUrl && h.affiliateUrl !== "#"
      ? h.affiliateUrl
      : bookingUrl(h.label, matchDate, h.nights, affiliateIds.booking, affiliateIds.awinPublisherId, affiliateIds.awinBookingAdvertiserId),
  }));

  const enrichedActivities = activities.map(a => ({
    ...a,
    affiliateUrl: a.affiliateUrl && a.affiliateUrl !== "#"
      ? a.affiliateUrl
      : getyourguideUrl(a.label, affiliateIds.getyourguide),
  }));

  return { tickets: enrichedTickets, hotels: enrichedHotels, activities: enrichedActivities };
}
