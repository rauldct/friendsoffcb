const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Gmail dot-abuse and suspicious patterns
function isSpammyEmail(email) {
  const local = email.split('@')[0] || '';
  const domain = (email.split('@')[1] || '').toLowerCase();

  // Gmail dot abuse: more than 3 dots in local part of gmail
  if (domain === 'gmail.com' && (local.match(/\./g) || []).length >= 3) return true;

  // Random chars: 6+ consonants in a row
  if (/[^aeiou\d@._ -]{6,}/i.test(local)) return true;

  // Very long local part
  if (local.length > 40) return true;

  return false;
}

(async () => {
  console.log('=== CLEANING SPAM ===\n');

  // 1. Clean spam subscribers
  const subs = await prisma.subscriber.findMany();
  const botLeadEmails = new Set();

  // Find emails that submitted BOTH lead + contact_form on same day (bot pattern)
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'asc' } });
  const leadByEmail = {};
  for (const l of leads) {
    const e = l.email.toLowerCase().trim();
    if (!leadByEmail[e]) leadByEmail[e] = [];
    leadByEmail[e].push(l);
  }
  for (const [email, entries] of Object.entries(leadByEmail)) {
    const sources = entries.map(e => e.source);
    // Bot pattern: both package page AND contact_form
    const hasPackage = sources.some(s => s && s.startsWith('/packages/'));
    const hasContact = sources.some(s => s === 'contact_form');
    if (hasPackage && hasContact) botLeadEmails.add(email);
  }

  let subDeleted = 0;
  for (const s of subs) {
    const email = s.email.toLowerCase().trim();
    let reason = null;

    if (isSpammyEmail(email)) reason = 'spammy_email_pattern';
    else if (botLeadEmails.has(email)) reason = 'matches_bot_lead_pattern';

    if (reason) {
      console.log(`  [SUB DELETE] ${s.email} — ${reason}`);
      // Delete newsletter opens first (FK constraint)
      await prisma.newsletterOpen.deleteMany({ where: { subscriberId: s.id } });
      await prisma.subscriber.delete({ where: { id: s.id } });
      subDeleted++;
    }
  }
  console.log(`\nSubscribers deleted: ${subDeleted}`);

  // 2. Clean duplicate leads — keep first per email, delete rest
  let leadDupsDeleted = 0;
  for (const [email, entries] of Object.entries(leadByEmail)) {
    if (entries.length <= 1) continue;
    // Keep first (oldest), delete rest
    const toDelete = entries.slice(1);
    for (const dup of toDelete) {
      await prisma.lead.delete({ where: { id: dup.id } });
      leadDupsDeleted++;
    }
    console.log(`  [LEAD DEDUP] ${email}: kept 1, deleted ${toDelete.length}`);
  }
  console.log(`\nLead duplicates deleted: ${leadDupsDeleted}`);

  // 3. Delete clearly spammy leads (dotted gmail abuse etc.)
  const remainingLeads = await prisma.lead.findMany();
  let spamLeadsDeleted = 0;
  for (const l of remainingLeads) {
    if (isSpammyEmail(l.email)) {
      console.log(`  [LEAD SPAM] ${l.email}`);
      await prisma.lead.delete({ where: { id: l.id } });
      spamLeadsDeleted++;
    }
  }
  console.log(`\nSpam leads deleted: ${spamLeadsDeleted}`);

  // Summary
  const finalSubs = await prisma.subscriber.count();
  const finalLeads = await prisma.lead.count();
  console.log(`\n=== FINAL STATE ===`);
  console.log(`Subscribers: ${finalSubs}`);
  console.log(`Leads: ${finalLeads}`);

  await prisma.$disconnect();
})();
