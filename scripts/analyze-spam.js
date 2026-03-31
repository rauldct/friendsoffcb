const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DISPOSABLE = new Set([
  'mailinator.com','guerrillamail.com','tempmail.com','throwaway.email',
  'yopmail.com','sharklasers.com','guerrillamailblock.com','grr.la',
  'dispostable.com','trashmail.com','10minutemail.com','tempail.com',
  'fakeinbox.com','mailnesia.com','maildrop.cc','discard.email',
  'temp-mail.org','temp-mail.io','emailondeck.com','mohmal.com',
  'getnada.com','mailsac.com','harakirimail.com','tmpmail.net',
  'tmpmail.org','tempr.email','fakemail.net','mailcatch.com',
  'mintemail.com','safetymail.info','spamgourmet.com','trashmail.me',
  'mailexpire.com','jetable.org','tempinbox.com','incognitomail.com',
  'guerrillamail.info','guerrillamail.net','guerrillamail.de',
  'mailtemp.net','mailforspam.com','tempmailaddress.com',
  'burnermail.io','dropmail.me','nada.email','anonbox.net',
  'mytemp.email','mailnull.com','mailscrap.com','crazymailing.com',
  'tmail.ws','emailfake.com','emkei.cz','mailslurp.com',
  'inboxkitten.com','generator.email','1secmail.com','1secmail.org',
  '1secmail.net','koszmail.pl','emailnax.com','tmail.link',
]);

(async () => {
  const subs = await prisma.subscriber.findMany({ orderBy: { subscribedAt: 'desc' } });
  const opens = await prisma.newsletterOpen.groupBy({
    by: ['subscriberId'],
    _count: { id: true },
  });
  const openMap = new Map(opens.map(o => [o.subscriberId, o._count.id]));

  console.log('Total subscribers:', subs.length);
  console.log('Active:', subs.filter(s => s.active).length);
  console.log('');

  const spam = [];
  for (const s of subs) {
    const domain = (s.email.split('@')[1] || '').toLowerCase();
    const local = s.email.split('@')[0] || '';
    const totalOpens = openMap.get(s.id) || 0;
    const daysSince = Math.floor((Date.now() - new Date(s.subscribedAt).getTime()) / 86400000);

    let score = 0;
    const flags = [];

    if (DISPOSABLE.has(domain)) { flags.push('DISPOSABLE'); score += 40; }
    if (/[^aeiou]{6,}/i.test(local)) { flags.push('random_chars'); score += 20; }
    if (local.length > 40) { flags.push('long_local'); score += 15; }
    if ((local.match(/\./g) || []).length > 4) { flags.push('many_dots'); score += 15; }
    if (/^\d+$/.test(local)) { flags.push('all_numbers'); score += 10; }
    if (totalOpens === 0 && daysSince > 14) { flags.push('no_opens_' + daysSince + 'd'); score += 15; }
    if (s.name === null || s.name === '') { score += 5; }

    if (score >= 25) {
      spam.push({ email: s.email, id: s.id, score, flags: flags.join(', '), opens: totalOpens, days: daysSince, active: s.active });
    }
  }

  spam.sort((a, b) => b.score - a.score);
  console.log('Suspected spam (score >= 25):', spam.length);
  console.log('');
  for (const s of spam) {
    console.log(`  [${s.score}] ${s.email} | opens:${s.opens} | ${s.days}d | ${s.active ? 'active' : 'inactive'} | ${s.flags}`);
  }

  await prisma.$disconnect();
})();
