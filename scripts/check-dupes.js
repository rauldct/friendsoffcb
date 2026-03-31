const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // Check duplicate emails in leads
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  const leadEmails = {};
  for (const l of leads) {
    const e = l.email.toLowerCase().trim();
    if (!leadEmails[e]) leadEmails[e] = [];
    leadEmails[e].push({ id: l.id, source: l.source, date: l.createdAt.toISOString().slice(0,10) });
  }
  const dupeLeads = Object.entries(leadEmails).filter(([, v]) => v.length > 1);

  console.log(`=== LEADS ===`);
  console.log(`Total: ${leads.length}`);
  console.log(`Unique emails: ${Object.keys(leadEmails).length}`);
  console.log(`Duplicate emails: ${dupeLeads.length}`);
  if (dupeLeads.length > 0) {
    console.log('');
    for (const [email, entries] of dupeLeads) {
      console.log(`  ${email} (${entries.length}x):`);
      for (const e of entries) {
        console.log(`    - ${e.date} | ${e.source} | ${e.id}`);
      }
    }
  }

  // Check duplicate emails in subscribers
  const subs = await prisma.subscriber.findMany();
  const subEmails = {};
  for (const s of subs) {
    const e = s.email.toLowerCase().trim();
    if (!subEmails[e]) subEmails[e] = [];
    subEmails[e].push({ id: s.id, active: s.active });
  }
  const dupeSubs = Object.entries(subEmails).filter(([, v]) => v.length > 1);

  console.log(`\n=== SUBSCRIBERS ===`);
  console.log(`Total: ${subs.length}`);
  console.log(`Duplicate emails: ${dupeSubs.length}`);
  if (dupeSubs.length > 0) {
    for (const [email, entries] of dupeSubs) {
      console.log(`  ${email} (${entries.length}x)`);
    }
  }

  // Check duplicate emails in feedback
  const feedback = await prisma.feedback.findMany();
  const fbEmails = {};
  for (const f of feedback) {
    const e = f.email.toLowerCase().trim();
    if (!fbEmails[e]) fbEmails[e] = [];
    fbEmails[e].push({ id: f.id, type: f.type });
  }
  const dupeFb = Object.entries(fbEmails).filter(([, v]) => v.length > 1);

  console.log(`\n=== FEEDBACK ===`);
  console.log(`Total: ${feedback.length}`);
  console.log(`Duplicate emails: ${dupeFb.length}`);
  if (dupeFb.length > 0) {
    for (const [email, entries] of dupeFb) {
      console.log(`  ${email} (${entries.length}x): types=${entries.map(e=>e.type).join(', ')}`);
    }
  }

  await prisma.$disconnect();
})();
