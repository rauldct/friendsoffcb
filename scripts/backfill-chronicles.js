const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 15 Barcelona matches from Aug 2025 - Jan 2026 (Feb 7 Mallorca already exists)
const MATCHES = [
  {
    date: '2025-08-16T20:00:00Z',
    competition: 'La Liga Matchday 1',
    home: 'RCD Mallorca', away: 'FC Barcelona',
    scoreHome: 0, scoreAway: 3,
    venue: 'Estadi Mallorca Son Moix',
    details: `Season opener. Barcelona goals: Raphinha (7'), Ferran Torres (23'), Lamine Yamal (90+4'). Mallorca had TWO red cards: Manu Morlanes (33', second yellow for foul on Yamal) and Vedat Muriqi (39', straight red after VAR review for violent conduct). Mallorca played with 9 men from the 39th minute. Marcus Rashford made his Barcelona debut as a substitute. Flick's first competitive match in charge of the new season.`,
    slug: 'barca-cruise-at-mallorca-3-0-season-opener-laliga-2025',
    coverImage: '/images/packages/camp-nou-match.jpg',
  },
  {
    date: '2025-09-14T18:30:00Z',
    competition: 'La Liga Matchday 4',
    home: 'FC Barcelona', away: 'Valencia CF',
    scoreHome: 6, scoreAway: 0,
    venue: 'Estadi Olímpic Lluís Companys (Montjuïc)',
    details: `Demolition job at Montjuïc. Three players scored doubles: Fermín López (29', 56'), Raphinha (53', 67'), Robert Lewandowski (76', 86'). Lewandowski's second goal was a delightful chip over the keeper. VAR initially disallowed a Lewandowski goal for offside but reversed the decision. Barcelona completely dominant with 74% possession and 24 shots.`,
    slug: 'barca-demolish-valencia-6-0-laliga-matchday-4',
    coverImage: '/images/packages/camp-nou-match.jpg',
  },
  {
    date: '2025-09-18T20:00:00Z',
    competition: 'UEFA Champions League Matchday 1 (League Phase)',
    home: 'Newcastle United', away: 'FC Barcelona',
    scoreHome: 1, scoreAway: 2,
    venue: "St James' Park, Newcastle",
    details: `Marcus Rashford scored twice against his former Premier League rivals. First goal (58') was a powerful header from a Yamal cross. Second goal (67') was a thunderous strike from 25 yards that flew into the top corner. Anthony Gordon pulled one back for Newcastle in the 90th minute but it was too late. A superb away victory to open Barcelona's Champions League campaign.`,
    slug: 'barca-win-at-newcastle-2-1-champions-league-opener',
    coverImage: '/images/packages/camp-nou-night.jpg',
  },
  {
    date: '2025-10-01T20:00:00Z',
    competition: 'UEFA Champions League Matchday 2 (League Phase)',
    home: 'FC Barcelona', away: 'Paris Saint-Germain',
    scoreHome: 1, scoreAway: 2,
    venue: 'Estadi Olímpic Lluís Companys (Montjuïc)',
    details: `Painful home defeat. Ferran Torres opened the scoring (19') with an assist from Rashford. Senny Mayulu equalized for PSG (38') before half-time. The match seemed headed for a draw until Gonçalo Ramos scored a devastating last-minute winner (90') to silence the Montjuïc crowd. Barcelona dominated possession but PSG were clinical on the counter-attack. A setback in Barcelona's Champions League campaign.`,
    slug: 'barca-fall-to-psg-1-2-champions-league-heartbreak',
    coverImage: '/images/packages/camp-nou-night.jpg',
  },
  {
    date: '2025-10-05T20:00:00Z',
    competition: 'La Liga Matchday 8',
    home: 'Sevilla FC', away: 'FC Barcelona',
    scoreHome: 4, scoreAway: 1,
    venue: 'Ramón Sánchez-Pizjuán, Seville',
    details: `Barcelona's worst defeat of the season. Former Barça player Alexis Sánchez opened from the penalty spot (13') after a foul by Ronald Araújo. Isaac Romero doubled the lead (36'). Marcus Rashford pulled one back just before half-time (45+'). Critical moment: Lewandowski MISSED a penalty (hit the left post) when the score was 2-1, which could have equalized. Sevilla killed the game in injury time with goals from José Ángel Carmona (90+') and Akor Adams (90+'). A humbling night at the Pizjuán.`,
    slug: 'barca-humbled-at-sevilla-1-4-worst-defeat-of-season',
    coverImage: '/images/packages/camp-nou-match.jpg',
  },
  {
    date: '2025-10-19T18:30:00Z',
    competition: 'La Liga Matchday 9',
    home: 'FC Barcelona', away: 'Girona FC',
    scoreHome: 2, scoreAway: 1,
    venue: 'Estadi Olímpic Lluís Companys (Montjuïc)',
    details: `Dramatic late winner. Pedri opened the scoring in the first half with a composed finish. Axel Witsel equalized with a spectacular bicycle kick that stunned the crowd. Hansi Flick was sent off in the 90th minute for protesting. But Ronald Araújo, who came on as a substitute, headed home the winner in stoppage time (90+') from a Frenkie de Jong assist. Incredible scenes at Montjuïc as Barcelona snatched all three points at the death.`,
    slug: 'barca-snatch-dramatic-win-over-girona-2-1-araujo-hero',
    coverImage: '/images/packages/camp-nou-match.jpg',
  },
  {
    date: '2025-10-21T20:00:00Z',
    competition: 'UEFA Champions League Matchday 3 (League Phase)',
    home: 'FC Barcelona', away: 'Olympiacos FC',
    scoreHome: 6, scoreAway: 1,
    venue: 'Estadi Olímpic Lluís Companys (Montjuïc)',
    details: `Fermín López scored his first career hat-trick and became the first Spaniard to score a hat-trick for Barcelona in the Champions League. Goals: Fermín (7', 38', 76'), Marcus Rashford (2 goals), Lamine Yamal (68' penalty). Olympiacos' Ayoub El Kaabi scored from the penalty spot (53') for the visitors' only goal. Santiago Hezze was sent off for Olympiacos. Barcelona's biggest Champions League win of the season, putting them firmly in the qualification picture.`,
    slug: 'barca-thrash-olympiacos-6-1-fermin-hat-trick-champions-league',
    coverImage: '/images/packages/camp-nou-night.jpg',
  },
  {
    date: '2025-10-26T20:00:00Z',
    competition: 'La Liga Matchday 10 (El Clásico)',
    home: 'Real Madrid', away: 'FC Barcelona',
    scoreHome: 2, scoreAway: 1,
    venue: 'Santiago Bernabéu, Madrid',
    details: `Defeat in El Clásico. Kylian Mbappé opened the scoring (22') with a clinical finish. Fermín López equalized (38') with a well-placed shot into the corner. But Jude Bellingham restored Madrid's lead (43') just before half-time, becoming the first Englishman to both score and assist in a La Liga Clásico. In the second half, Mbappé missed a penalty (52') — saved by Szczęsny. Despite the miss, Madrid held on. Barcelona left the Bernabéu 5 points behind Madrid. A tense, physical encounter with many fouls.`,
    slug: 'barca-lose-el-clasico-at-bernabeu-1-2-mbappe-bellingham',
    coverImage: '/images/packages/camp-nou-match.jpg',
  },
  {
    date: '2025-11-09T20:00:00Z',
    competition: 'La Liga Matchday 12',
    home: 'RC Celta de Vigo', away: 'FC Barcelona',
    scoreHome: 2, scoreAway: 4,
    venue: 'Abanca-Balaídos, Vigo',
    details: `Robert Lewandowski scored a historic hat-trick: penalty (10'), open play (37'), and a composed finish (73'). At 37 years and 80 days old, he became the oldest player to score a La Liga hat-trick in the 21st century. Lamine Yamal added the fourth (45+') just before half-time. Celta scored through Sergio Carreira and Borja Iglesias. Marcus Rashford provided two assists. The penalty was awarded after VAR spotted a handball by Marcos Alonso. A six-goal thriller that Barcelona controlled.`,
    slug: 'lewandowski-hat-trick-barca-win-at-celta-4-2-historic',
    coverImage: '/images/packages/camp-nou-match.jpg',
  },
  {
    date: '2025-11-22T20:00:00Z',
    competition: 'La Liga Matchday 13',
    home: 'FC Barcelona', away: 'Athletic Club',
    scoreHome: 4, scoreAway: 0,
    venue: 'Spotify Camp Nou, Barcelona',
    details: `HISTORIC NIGHT: The first competitive match at the Spotify Camp Nou since May 2023, after the stadium renovation (Phase 1B, capacity 45,401). Lewandowski opened in the 4th minute capitalizing on a defensive error. Ferran Torres doubled the lead (45') with a Yamal assist. Fermín López made it 3-0 (50') shortly after the break. Torres completed his brace (80') with another Yamal assist. Oihan Sancet was sent off with a straight red card for a dangerous tackle on Fermín. Celebrations included fireworks and "Caminem Lluny" anthem. Barcelona moved to the top of La Liga with 31 points.`,
    slug: 'camp-nou-reopens-barca-thrash-athletic-4-0-historic-night',
    coverImage: '/images/packages/camp-nou-exterior.jpg',
  },
  {
    date: '2025-12-09T20:00:00Z',
    competition: 'UEFA Champions League Matchday 6 (League Phase)',
    home: 'FC Barcelona', away: 'Eintracht Frankfurt',
    scoreHome: 2, scoreAway: 1,
    venue: 'Spotify Camp Nou, Barcelona',
    details: `Jules Koundé was the unlikely hero with two headed goals in three minutes. Ansgar Knauff gave Frankfurt the lead (21') with a well-taken goal. Koundé equalized (50') heading home a Rashford cross, then scored again (53') from a Yamal delivery. He became the first Barcelona player to score two headed goals in a single Champions League match. A crucial comeback victory that kept Barcelona's hopes of direct qualification to the Round of 16 alive.`,
    slug: 'kounde-double-header-barca-comeback-vs-frankfurt-2-1-ucl',
    coverImage: '/images/packages/camp-nou-night.jpg',
  },
  {
    date: '2026-01-03T20:00:00Z',
    competition: 'La Liga Matchday 18 (Catalan Derby)',
    home: 'RCD Espanyol', away: 'FC Barcelona',
    scoreHome: 0, scoreAway: 2,
    venue: 'RCDE Stadium, Cornellà-El Prat',
    details: `Late drama in the Catalan derby. Espanyol defended stubbornly for 85 minutes with goalkeeper Joan García making several outstanding saves. The deadlock was broken when substitute Fermín López set up Dani Olmo, who scored with a precise finish (86'). Lewandowski sealed the victory (90') with another assist from Fermín. The quality of Barcelona's bench proved decisive. Three vital points in the derby that maintained pressure at the top of La Liga.`,
    slug: 'barca-win-catalan-derby-espanyol-0-2-late-drama',
    coverImage: '/images/packages/camp-nou-match.jpg',
  },
  {
    date: '2026-01-07T20:00:00Z',
    competition: 'Supercopa de España (Semi-final)',
    home: 'FC Barcelona', away: 'Athletic Club',
    scoreHome: 5, scoreAway: 0,
    venue: 'King Abdullah Sports City, Jeddah',
    details: `Total demolition in Saudi Arabia. Four goals in 16 devastating minutes: Ferran Torres (22'), Fermín López (30'), Roony Bardghji (34'), and Raphinha (38'). Raphinha added a fifth after the break (52') to complete his brace. Barcelona were absolutely irresistible in that first-half blitz, with Athletic unable to cope with the speed and movement. An emphatic semi-final performance that sent Barcelona to the Supercopa final.`,
    slug: 'barca-demolish-athletic-5-0-supercopa-semifinal-jeddah',
    coverImage: '/images/packages/camp-nou-match.jpg',
  },
  {
    date: '2026-01-11T19:00:00Z',
    competition: 'Supercopa de España (Final - El Clásico)',
    home: 'FC Barcelona', away: 'Real Madrid',
    scoreHome: 3, scoreAway: 2,
    venue: 'King Abdullah Sports City, Jeddah',
    details: `Epic Clásico in the Supercopa final. Raphinha opened the scoring (35') with a brilliant individual effort. The second half exploded: Lewandowski extended the lead (49') but Real Madrid hit back with two goals in two minutes — Vinícius Júnior (47') and Gonzalo García (51') — to make it 2-2. Raphinha scored the winner (73') with a shot that deflected off Asencio to wrong-foot Courtois. Frenkie de Jong was sent off in injury time. Barcelona's 16th Supercopa title. Raphinha was named Player of the Tournament.`,
    slug: 'barca-beat-real-madrid-3-2-supercopa-final-raphinha-hero',
    coverImage: '/images/packages/camp-nou-match.jpg',
  },
  {
    date: '2026-01-28T20:00:00Z',
    competition: 'UEFA Champions League Matchday 8 (League Phase)',
    home: 'FC Barcelona', away: 'FC Copenhagen',
    scoreHome: 4, scoreAway: 1,
    venue: 'Spotify Camp Nou, Barcelona',
    details: `Comfortable victory to seal direct qualification to the Round of 16 (top 8). Viktor Dadason shocked the Camp Nou with an early opener for Copenhagen after a defensive error. But Barcelona responded emphatically: Lewandowski equalized, Yamal scored a trademark curling shot, Raphinha added the third, and Rashford completed the rout with a brilliant free-kick that bent over the wall into the top corner. Four different scorers. Barcelona finished the league phase in the top 8, avoiding the playoff round.`,
    slug: 'barca-secure-top-8-finish-beating-copenhagen-4-1-ucl',
    coverImage: '/images/packages/camp-nou-night.jpg',
  },
];

async function getAnthropicKey() {
  try {
    const s = await prisma.setting.findUnique({ where: { key: 'ANTHROPIC_API_KEY' } });
    if (s?.value) return s.value;
  } catch {}
  return process.env.ANTHROPIC_API_KEY || '';
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

async function generateChronicle(match, anthropicKey) {
  const isHome = match.home === 'FC Barcelona';
  const barcaGoals = isHome ? match.scoreHome : match.scoreAway;
  const opponentGoals = isHome ? match.scoreAway : match.scoreHome;
  const opponent = isHome ? match.away : match.home;
  const result = barcaGoals > opponentGoals ? 'win' : barcaGoals < opponentGoals ? 'loss' : 'draw';
  const scoreStr = `${barcaGoals}-${opponentGoals}`;

  const matchDate = new Date(match.date);
  const dateStr = matchDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const prompt = `You are a passionate, knowledgeable sports journalist writing for FriendsOfBarca.com, a fan site dedicated to FC Barcelona.

Write a detailed, engaging match chronicle/report based on the following REAL match data. Use the specific details provided — do NOT invent additional details or player names not mentioned.

MATCH DATA:
- Competition: ${match.competition}
- Date: ${dateStr}
- ${match.home} ${match.scoreHome} - ${match.scoreAway} ${match.away}
- Venue: ${match.venue}
- Result for Barcelona: ${result.toUpperCase()}

SPECIFIC DETAILS:
${match.details}

Write in English. The article should be 500-800 words. Use ## for section headers. Include:
1. An engaging introduction setting the scene
2. Detailed first half summary with specific goals and incidents
3. Second half summary with key moments
4. Standout player performances
5. What this result means for Barcelona's season

Respond ONLY with valid JSON (no markdown code blocks, no backticks):
{
  "title": "Engaging headline including score (e.g. 'Barcelona 4-0 Athletic: Camp Nou Reopens in Style')",
  "excerpt": "Compelling 2-3 sentence summary (150-200 characters)",
  "content": "Full match report text with ## section headers",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description under 160 chars"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  let text = data.content[0].text;
  // Strip markdown code blocks if present
  text = text.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  return JSON.parse(text);
}

async function main() {
  const anthropicKey = await getAnthropicKey();
  if (!anthropicKey) {
    console.error('ERROR: No ANTHROPIC_API_KEY configured');
    process.exit(1);
  }

  console.log(`Starting backfill of ${MATCHES.length} match chronicles...`);
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < MATCHES.length; i++) {
    const match = MATCHES[i];
    const isHome = match.home === 'FC Barcelona';
    const barcaGoals = isHome ? match.scoreHome : match.scoreAway;
    const opponentGoals = isHome ? match.scoreAway : match.scoreHome;
    const result = barcaGoals > opponentGoals ? 'win' : barcaGoals < opponentGoals ? 'loss' : 'draw';
    const scoreStr = `${barcaGoals}-${opponentGoals}`;

    console.log(`\n[${i + 1}/${MATCHES.length}] ${match.home} ${match.scoreHome}-${match.scoreAway} ${match.away} (${match.competition})`);

    // Check if already exists
    const existing = await prisma.newsArticle.findUnique({ where: { slug: match.slug } });
    if (existing) {
      console.log('  -> Already exists, skipping');
      skipped++;
      continue;
    }

    try {
      console.log('  -> Generating chronicle with Claude AI...');
      const parsed = await generateChronicle(match, anthropicKey);

      const matchDate = new Date(match.date);
      const article = await prisma.newsArticle.create({
        data: {
          slug: match.slug,
          title: parsed.title || `Barcelona ${scoreStr} vs ${isHome ? match.away : match.home}`,
          excerpt: parsed.excerpt || '',
          content: parsed.content || '',
          coverImage: match.coverImage,
          category: 'chronicle',
          matchDate,
          matchResult: `${scoreStr} (${result})`,
          sources: JSON.stringify([
            { name: 'ESPN', url: 'https://www.espn.com/soccer/team/_/id/83/barcelona' },
            { name: 'UEFA.com', url: 'https://www.uefa.com/uefachampionsleague/clubs/50080--barcelona/' },
            { name: 'FC Barcelona Official', url: 'https://www.fcbarcelona.com' },
          ]),
          author: 'Friends of Barça AI',
          metaTitle: parsed.metaTitle || '',
          metaDescription: parsed.metaDescription || '',
          publishedAt: matchDate,
          status: 'published',
        },
      });

      console.log(`  -> Created: "${parsed.title}" (${article.id})`);
      created++;

      // Rate limit: 2.5 seconds between API calls
      if (i < MATCHES.length - 1) {
        console.log('  -> Waiting 2.5s...');
        await new Promise(r => setTimeout(r, 2500));
      }
    } catch (err) {
      console.error(`  -> ERROR: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Backfill complete: ${created} created, ${skipped} skipped, ${errors} errors`);
  console.log(`========================================`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
