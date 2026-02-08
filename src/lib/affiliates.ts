import prisma from "@/lib/prisma";
import { TicketOption, HotelOption, ActivityOption } from "@/types";

// ============== FETCH AFFILIATE IDS ==============

interface AffiliateIds {
  stubhub: string;
  booking: string;
  getyourguide: string;
}

async function getSettingValue(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch { /* fallback */ }
  return process.env[key] || "";
}

export async function getAffiliateIds(): Promise<AffiliateIds> {
  const [stubhub, booking, getyourguide] = await Promise.all([
    getSettingValue("STUBHUB_AFFILIATE_ID"),
    getSettingValue("BOOKING_AFFILIATE_ID"),
    getSettingValue("GETYOURGUIDE_PARTNER_ID"),
  ]);
  return { stubhub, booking, getyourguide };
}

// ============== URL GENERATORS ==============

function stubhubUrl(matchTitle: string, affiliateId: string): string {
  // StubHub FC Barcelona performer page
  const base = "https://www.stubhub.com/fc-barcelona-barcelona-tickets/performer/2981/";
  if (!affiliateId) return base;
  return `${base}?gcid=${encodeURIComponent(affiliateId)}`;
}

function bookingUrl(
  hotelLabel: string,
  matchDate: Date,
  nights: number,
  affiliateId: string
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

  // Build the Booking.com destination URL
  const bookingParams = new URLSearchParams({
    ss,
    checkin: formatDate(checkin),
    checkout: formatDate(checkout),
    group_adults: "2",
    no_rooms: "1",
  });

  const bookingDestination = `https://www.booking.com/searchresults.html?${bookingParams}${starFilter}`;

  // If we have an Awin affiliate ID, wrap in Awin tracking link
  // Booking.com Awin merchant ID: 5765 (international)
  if (affiliateId) {
    const awinParams = new URLSearchParams({
      awinmid: "5765",
      awinaffid: affiliateId,
      ued: bookingDestination,
    });
    return `https://www.awin1.com/cread.php?${awinParams}`;
  }

  return bookingDestination;
}

function getyourguideUrl(activityLabel: string, partnerId: string): string {
  // Map common activities to search queries
  const labelLower = activityLabel.toLowerCase();
  let query = activityLabel;

  if (labelLower.includes("camp nou") || labelLower.includes("stadium tour")) query = "Camp Nou tour";
  else if (labelLower.includes("bike")) query = "Barcelona bike tour";
  else if (labelLower.includes("sagrada")) query = "Sagrada Familia skip the line";
  else if (labelLower.includes("gothic") || labelLower.includes("gòtic")) query = "Gothic Quarter walking tour";
  else if (labelLower.includes("boqueria") || labelLower.includes("food")) query = "Boqueria food tour Barcelona";
  else if (labelLower.includes("montjuïc") || labelLower.includes("montjuic") || labelLower.includes("cable")) query = "Montjuic cable car Barcelona";
  else if (labelLower.includes("flamenco")) query = "flamenco show Barcelona";
  else if (labelLower.includes("wine") || labelLower.includes("cava")) query = "wine tasting Barcelona";
  else if (labelLower.includes("sailing") || labelLower.includes("boat")) query = "Barcelona sailing tour";

  const params = new URLSearchParams({ q: query });
  if (partnerId) params.set("partner_id", partnerId);

  return `https://www.getyourguide.com/barcelona-l45/s/?${params}`;
}

// ============== INJECT AFFILIATE URLS ==============

export function injectAffiliateUrls(
  tickets: TicketOption[],
  hotels: HotelOption[],
  activities: ActivityOption[],
  matchDate: Date,
  affiliateIds: AffiliateIds
): {
  tickets: TicketOption[];
  hotels: HotelOption[];
  activities: ActivityOption[];
} {
  const enrichedTickets = tickets.map(t => ({
    ...t,
    affiliateUrl: t.affiliateUrl && t.affiliateUrl !== "#"
      ? t.affiliateUrl // Keep manually set URLs
      : stubhubUrl(t.label, affiliateIds.stubhub),
  }));

  const enrichedHotels = hotels.map(h => ({
    ...h,
    affiliateUrl: h.affiliateUrl && h.affiliateUrl !== "#"
      ? h.affiliateUrl
      : bookingUrl(h.label, matchDate, h.nights, affiliateIds.booking),
  }));

  const enrichedActivities = activities.map(a => ({
    ...a,
    affiliateUrl: a.affiliateUrl && a.affiliateUrl !== "#"
      ? a.affiliateUrl
      : getyourguideUrl(a.label, affiliateIds.getyourguide),
  }));

  return { tickets: enrichedTickets, hotels: enrichedHotels, activities: enrichedActivities };
}
