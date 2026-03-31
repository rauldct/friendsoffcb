/**
 * Spam detection utilities for subscriber forms.
 * - Disposable email domain blocklist
 * - IP rate limiting
 * - Honeypot field detection
 * - Timing validation
 * - Suspicious pattern detection
 */

// Disposable / temporary email domains (common ones)
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
  "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
  "dispostable.com", "trashmail.com", "10minutemail.com", "tempail.com",
  "fakeinbox.com", "mailnesia.com", "maildrop.cc", "discard.email",
  "temp-mail.org", "temp-mail.io", "emailondeck.com", "mohmal.com",
  "getnada.com", "mailsac.com", "harakirimail.com", "tmpmail.net",
  "tmpmail.org", "tempr.email", "fakemail.net", "mailcatch.com",
  "mintemail.com", "safetymail.info", "spamgourmet.com", "trashmail.me",
  "mailexpire.com", "jetable.org", "tempinbox.com", "incognitomail.com",
  "guerrillamail.info", "guerrillamail.net", "guerrillamail.de",
  "mailtemp.net", "mailforspam.com", "tempmailaddress.com",
  "burnermail.io", "dropmail.me", "nada.email", "anonbox.net",
  "mytemp.email", "mailnull.com", "MailScrap.com", "crazymailing.com",
  "tmail.ws", "emailfake.com", "emkei.cz", "mailslurp.com",
  "inboxkitten.com", "generator.email", "1secmail.com", "1secmail.org",
  "1secmail.net", "koszmail.pl", "emailnax.com", "tmail.link",
]);

// Rate limit store: "context:IP" -> { count, firstRequestAt }
const ipRateLimit = new Map<string, { count: number; firstAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_DEFAULT = 3; // max 3 per hour per IP

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRateLimit.entries()) {
    if (now - data.firstAt > RATE_LIMIT_WINDOW_MS) {
      ipRateLimit.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export interface SpamCheckResult {
  isSpam: boolean;
  reason: string | null;
  score: number; // 0 = clean, 100 = definitely spam
}

/**
 * Check if an email domain is disposable / temporary.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Check suspicious email patterns.
 */
function checkEmailPatterns(email: string): number {
  let score = 0;
  const local = email.split("@")[0] || "";

  // Random string patterns (lots of consonants in a row, no vowels)
  if (/[^aeiou]{6,}/i.test(local)) score += 20;

  // Very long local part
  if (local.length > 40) score += 15;

  // Lots of dots or special chars
  if ((local.match(/\./g) || []).length > 4) score += 15;

  // All numbers
  if (/^\d+$/.test(local)) score += 10;

  // Pattern: random chars + numbers (like abc123def456)
  if (/^[a-z]+\d+[a-z]+\d+/i.test(local)) score += 10;

  return score;
}

/**
 * Check IP rate limit. Returns true if rate limited.
 * @param ip - Client IP
 * @param context - Rate limit context (e.g. "subscribe", "lead", "contact")
 * @param max - Max requests per window (default 3)
 */
export function isRateLimited(ip: string, context: string = "default", max: number = RATE_LIMIT_MAX_DEFAULT): boolean {
  const key = `${context}:${ip}`;
  const now = Date.now();
  const data = ipRateLimit.get(key);

  if (!data || now - data.firstAt > RATE_LIMIT_WINDOW_MS) {
    ipRateLimit.set(key, { count: 1, firstAt: now });
    return false;
  }

  data.count++;
  return data.count > max;
}

/**
 * Full spam check for any form submission.
 * @param context - Rate limit context (e.g. "subscribe", "lead", "contact", "feedback", "waitlist")
 * @param maxPerHour - Max submissions per hour per IP for this context
 */
export function checkSpam({
  email,
  ip,
  honeypot,
  formLoadedAt,
  context = "default",
  maxPerHour = 3,
}: {
  email: string;
  ip: string;
  honeypot?: string;
  formLoadedAt?: number;
  context?: string;
  maxPerHour?: number;
}): SpamCheckResult {
  // 1. Honeypot field filled → definitely bot
  if (honeypot && honeypot.trim().length > 0) {
    return { isSpam: true, reason: "honeypot", score: 100 };
  }

  // 2. Form submitted too fast (< 2 seconds)
  if (formLoadedAt) {
    const elapsed = Date.now() - formLoadedAt;
    if (elapsed < 2000) {
      return { isSpam: true, reason: "too_fast", score: 90 };
    }
  }

  // 3. Disposable email
  if (isDisposableEmail(email)) {
    return { isSpam: true, reason: "disposable_email", score: 85 };
  }

  // 4. IP rate limit (per context)
  if (isRateLimited(ip, context, maxPerHour)) {
    return { isSpam: true, reason: "rate_limited", score: 80 };
  }

  // 5. Suspicious email patterns (accumulative score)
  const patternScore = checkEmailPatterns(email);
  if (patternScore >= 30) {
    return { isSpam: true, reason: "suspicious_pattern", score: patternScore + 50 };
  }

  return { isSpam: false, reason: null, score: patternScore };
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const hdrs = request.headers;
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
}

/**
 * Analyze existing subscriber for spam indicators (for admin view).
 */
export function analyzeSubscriberSpam(subscriber: {
  email: string;
  name: string | null;
  source: string;
  active: boolean;
  totalOpens: number;
  subscribedAt: string;
}): { spamScore: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  // Disposable email
  if (isDisposableEmail(subscriber.email)) {
    flags.push("Disposable email");
    score += 40;
  }

  // Suspicious email patterns
  const patternScore = checkEmailPatterns(subscriber.email);
  if (patternScore > 0) {
    if (patternScore >= 20) flags.push("Suspicious email pattern");
    score += patternScore;
  }

  // Never opened any newsletter
  if (subscriber.totalOpens === 0) {
    const daysSince = Math.floor(
      (Date.now() - new Date(subscriber.subscribedAt).getTime()) / 86400000
    );
    if (daysSince > 14) {
      flags.push("No opens in 14+ days");
      score += 15;
    }
  }

  // No name provided
  if (!subscriber.name) {
    score += 5;
  }

  return { spamScore: Math.min(score, 100), flags };
}
