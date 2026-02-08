const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Seed Matches
  const matches = [
    { date: new Date("2026-03-01T20:00:00Z"), time: "21:00 CET", opponent: "Real Madrid", competition: "La Liga", venue: "home", packageSlug: "barca-vs-real-madrid-mar-2026" },
    { date: new Date("2026-03-08T17:00:00Z"), time: "18:00 CET", opponent: "Atlético Madrid", competition: "La Liga", venue: "home", packageSlug: "barca-vs-atletico-mar-2026" },
    { date: new Date("2026-03-15T20:00:00Z"), time: "21:00 CET", opponent: "Bayern Munich", competition: "Champions League", venue: "home", packageSlug: "barca-vs-bayern-mar-2026" },
    { date: new Date("2026-03-22T15:00:00Z"), time: "16:00 CET", opponent: "Real Sociedad", competition: "La Liga", venue: "away" },
    { date: new Date("2026-04-05T20:00:00Z"), time: "21:00 CET", opponent: "Manchester City", competition: "Champions League", venue: "home", packageSlug: "barca-vs-man-city-apr-2026" },
    { date: new Date("2026-04-12T17:00:00Z"), time: "18:00 CET", opponent: "Sevilla", competition: "La Liga", venue: "home", packageSlug: "barca-vs-sevilla-apr-2026" },
    { date: new Date("2026-04-19T20:00:00Z"), time: "21:00 CET", opponent: "Valencia", competition: "La Liga", venue: "away" },
    { date: new Date("2026-04-26T17:00:00Z"), time: "18:00 CET", opponent: "Villarreal", competition: "La Liga", venue: "home", packageSlug: "barca-vs-villarreal-apr-2026" },
  ];

  for (const m of matches) {
    await prisma.match.upsert({ where: { id: m.packageSlug || m.opponent }, create: m, update: m });
  }
  console.log("Matches seeded");

  // Seed Packages
  const packages = [
    {
      slug: "barca-vs-real-madrid-mar-2026",
      matchTitle: "FC Barcelona vs Real Madrid",
      competition: "La Liga",
      matchDate: new Date("2026-03-01T20:00:00Z"),
      matchTime: "21:00 CET",
      opponent: "Real Madrid",
      description: "El Clásico — the biggest match in world football. Experience the legendary rivalry between FC Barcelona and Real Madrid at the Spotify Camp Nou. Over 90,000 fans creating an electric atmosphere as Barça take on their eternal rivals. This is more than a football match — it's a once-in-a-lifetime experience.",
      tickets: [
        { label: "General Admission", priceFrom: 250, currency: "€", affiliateUrl: "#", provider: "StubHub" },
        { label: "Premium Sideline", priceFrom: 450, currency: "€", affiliateUrl: "#", provider: "StubHub" },
        { label: "VIP Hospitality", priceFrom: 890, currency: "€", affiliateUrl: "#", provider: "P1 Travel" },
      ],
      hotels: [
        { label: "Hotel near Camp Nou (3★)", priceFrom: 95, affiliateUrl: "#", nights: 2 },
        { label: "Boutique Hotel Gothic Quarter (4★)", priceFrom: 165, affiliateUrl: "#", nights: 2 },
        { label: "Luxury Hotel Passeig de Gràcia (5★)", priceFrom: 290, affiliateUrl: "#", nights: 2 },
      ],
      activities: [
        { label: "Camp Nou Stadium Tour", priceFrom: 28, affiliateUrl: "#" },
        { label: "Barcelona City Bike Tour", priceFrom: 35, affiliateUrl: "#" },
        { label: "Sagrada Familia Skip-the-Line", priceFrom: 42, affiliateUrl: "#" },
      ],
      tips: [
        "Arrive at least 90 minutes early for El Clásico — security queues are longer than usual",
        "Head to the Cervecería Ciudad Condal for pre-match tapas (30 min walk from stadium)",
        "Take the L3 metro line to Palau Reial station — it's less crowded than Collblanc",
        "Bring a power bank — you'll want to film the mosaic and tifo displays",
        "Stay after the match for 30 minutes to avoid the metro rush",
      ],
      meetupInfo: "Join our pre-match meetup at Bar La Tomaquera (Carrer de Galileu 58) at 18:00. Free drink for Friends of Barça fans!",
      metaTitle: "FC Barcelona vs Real Madrid Tickets & Packages | El Clásico 2026",
      metaDescription: "Get El Clásico tickets, hotels near Camp Nou, and tours. Complete FC Barcelona vs Real Madrid matchday package for March 2026.",
      status: "upcoming",
      featured: true,
    },
    {
      slug: "barca-vs-atletico-mar-2026",
      matchTitle: "FC Barcelona vs Atlético Madrid",
      competition: "La Liga",
      matchDate: new Date("2026-03-08T17:00:00Z"),
      matchTime: "18:00 CET",
      opponent: "Atlético Madrid",
      description: "A top-of-the-table clash as Barça host Atlético Madrid at the Spotify Camp Nou. Always a tightly contested affair, this match promises intensity, passion, and world-class football. Simeone vs Barcelona — a modern classic.",
      tickets: [
        { label: "General Admission", priceFrom: 120, currency: "€", affiliateUrl: "#", provider: "StubHub" },
        { label: "Premium Sideline", priceFrom: 280, currency: "€", affiliateUrl: "#", provider: "StubHub" },
        { label: "VIP Hospitality", priceFrom: 550, currency: "€", affiliateUrl: "#", provider: "P1 Travel" },
      ],
      hotels: [
        { label: "Hotel near Camp Nou (3★)", priceFrom: 85, affiliateUrl: "#", nights: 2 },
        { label: "Hotel Eixample District (4★)", priceFrom: 140, affiliateUrl: "#", nights: 2 },
      ],
      activities: [
        { label: "Camp Nou Stadium Tour", priceFrom: 28, affiliateUrl: "#" },
        { label: "Gothic Quarter Walking Tour", priceFrom: 25, affiliateUrl: "#" },
      ],
      tips: [
        "The atmosphere for big La Liga matches is incredible — arrive early to soak it in",
        "Try the local vermut at any bar in Les Corts neighborhood before the match",
        "Gate 14 is usually the fastest entry point for general admission tickets",
      ],
      metaTitle: "FC Barcelona vs Atlético Madrid Tickets & Packages 2026",
      metaDescription: "Get FC Barcelona vs Atlético Madrid tickets and hotel packages. Complete matchday experience at Camp Nou, March 2026.",
      status: "upcoming",
      featured: true,
    },
    {
      slug: "barca-vs-bayern-mar-2026",
      matchTitle: "FC Barcelona vs Bayern Munich",
      competition: "Champions League",
      matchDate: new Date("2026-03-15T20:00:00Z"),
      matchTime: "21:00 CET",
      opponent: "Bayern Munich",
      description: "Champions League nights at Camp Nou are legendary. When FC Barcelona face Bayern Munich under the floodlights, the stadium comes alive like nowhere else. A clash of European giants with history, drama, and world-class talent.",
      tickets: [
        { label: "General Admission", priceFrom: 180, currency: "€", affiliateUrl: "#", provider: "StubHub" },
        { label: "Premium Sideline", priceFrom: 380, currency: "€", affiliateUrl: "#", provider: "LiveFootballTickets" },
        { label: "VIP Hospitality", priceFrom: 750, currency: "€", affiliateUrl: "#", provider: "P1 Travel" },
      ],
      hotels: [
        { label: "Hotel near Camp Nou (3★)", priceFrom: 95, affiliateUrl: "#", nights: 2 },
        { label: "Hotel Barcelona Center (4★)", priceFrom: 155, affiliateUrl: "#", nights: 2 },
      ],
      activities: [
        { label: "Camp Nou Stadium Tour", priceFrom: 28, affiliateUrl: "#" },
        { label: "La Boqueria Food Tour", priceFrom: 45, affiliateUrl: "#" },
      ],
      tips: [
        "Champions League nights have a special atmosphere — the Barça hymn before kickoff gives goosebumps",
        "Wear your Barça colors! The mosaic display before CL matches is spectacular",
        "Book dinner reservations early — restaurants near Camp Nou fill up on CL nights",
      ],
      metaTitle: "FC Barcelona vs Bayern Munich Champions League Tickets 2026",
      metaDescription: "Champions League tickets for FC Barcelona vs Bayern Munich at Camp Nou. Complete matchday package with hotels and tours.",
      status: "upcoming",
      featured: true,
    },
    {
      slug: "barca-vs-man-city-apr-2026",
      matchTitle: "FC Barcelona vs Manchester City",
      competition: "Champions League",
      matchDate: new Date("2026-04-05T20:00:00Z"),
      matchTime: "21:00 CET",
      opponent: "Manchester City",
      description: "Two of Europe's most exciting teams go head to head in the Champions League. Barcelona vs Manchester City is a clash of styles and philosophies — both rooted in the Barça DNA of possession football. An unmissable European night.",
      tickets: [
        { label: "General Admission", priceFrom: 190, currency: "€", affiliateUrl: "#", provider: "StubHub" },
        { label: "Premium Sideline", priceFrom: 400, currency: "€", affiliateUrl: "#", provider: "StubHub" },
        { label: "VIP Hospitality", priceFrom: 800, currency: "€", affiliateUrl: "#", provider: "P1 Travel" },
      ],
      hotels: [
        { label: "Hotel Les Corts (3★)", priceFrom: 100, affiliateUrl: "#", nights: 2 },
        { label: "Hotel Passeig de Gràcia (4★)", priceFrom: 175, affiliateUrl: "#", nights: 2 },
      ],
      activities: [
        { label: "Camp Nou Stadium Tour", priceFrom: 28, affiliateUrl: "#" },
        { label: "Montjuïc Cable Car & Castle", priceFrom: 15, affiliateUrl: "#" },
      ],
      tips: [
        "This will be one of the hottest tickets of the season — book as early as possible",
        "Enjoy pre-match at Plaça Espanya area if coming from the city center",
      ],
      metaTitle: "FC Barcelona vs Manchester City Champions League Tickets 2026",
      metaDescription: "Get Barcelona vs Man City Champions League tickets and packages. Hotels near Camp Nou and Barcelona tours included.",
      status: "upcoming",
      featured: true,
    },
    {
      slug: "barca-vs-sevilla-apr-2026",
      matchTitle: "FC Barcelona vs Sevilla",
      competition: "La Liga",
      matchDate: new Date("2026-04-12T17:00:00Z"),
      matchTime: "18:00 CET",
      opponent: "Sevilla",
      description: "A classic La Liga fixture as Barça welcome Sevilla to Camp Nou. Always a competitive match with plenty of goals. Perfect for first-time visitors looking for a great atmosphere at an accessible price point.",
      tickets: [
        { label: "General Admission", priceFrom: 75, currency: "€", affiliateUrl: "#", provider: "StubHub" },
        { label: "Premium Sideline", priceFrom: 180, currency: "€", affiliateUrl: "#", provider: "StubHub" },
      ],
      hotels: [
        { label: "Budget Hotel near Metro (2★)", priceFrom: 65, affiliateUrl: "#", nights: 2 },
        { label: "Hotel Eixample (3★)", priceFrom: 95, affiliateUrl: "#", nights: 2 },
      ],
      activities: [
        { label: "Camp Nou Stadium Tour", priceFrom: 28, affiliateUrl: "#" },
        { label: "Park Güell Guided Visit", priceFrom: 22, affiliateUrl: "#" },
      ],
      tips: [
        "Great value match for first-time visitors — excellent atmosphere without the premium prices",
        "April weather in Barcelona is perfect — pack a light jacket for evening matches",
      ],
      metaTitle: "FC Barcelona vs Sevilla Tickets & Packages 2026",
      metaDescription: "Affordable FC Barcelona vs Sevilla tickets and matchday packages at Camp Nou, April 2026.",
      status: "upcoming",
      featured: false,
    },
    {
      slug: "barca-vs-villarreal-apr-2026",
      matchTitle: "FC Barcelona vs Villarreal",
      competition: "La Liga",
      matchDate: new Date("2026-04-26T17:00:00Z"),
      matchTime: "18:00 CET",
      opponent: "Villarreal",
      description: "Barça vs the Yellow Submarine. Villarreal always bring attractive football to Camp Nou, making this an entertaining La Liga encounter. A great option for fans looking for an authentic Spanish football experience.",
      tickets: [
        { label: "General Admission", priceFrom: 65, currency: "€", affiliateUrl: "#", provider: "StubHub" },
        { label: "Premium Sideline", priceFrom: 160, currency: "€", affiliateUrl: "#", provider: "StubHub" },
      ],
      hotels: [
        { label: "Hotel Les Corts (3★)", priceFrom: 85, affiliateUrl: "#", nights: 2 },
      ],
      activities: [
        { label: "Camp Nou Stadium Tour", priceFrom: 28, affiliateUrl: "#" },
      ],
      tips: [
        "Spring in Barcelona is beautiful — combine the match with a beach day",
        "Villarreal fans are friendly — great atmosphere in the mixed areas",
      ],
      metaTitle: "FC Barcelona vs Villarreal Tickets & Packages 2026",
      metaDescription: "FC Barcelona vs Villarreal tickets and matchday packages at Camp Nou, April 2026.",
      status: "upcoming",
      featured: false,
    },
  ];

  for (const pkg of packages) {
    await prisma.matchPackage.upsert({
      where: { slug: pkg.slug },
      create: pkg,
      update: pkg,
    });
  }
  console.log("Packages seeded");

  // Seed Blog Posts
  const posts = [
    {
      slug: "el-clasico-preview-march-2026",
      title: "El Clásico Preview: What to Expect from Barça vs Real Madrid in March 2026",
      excerpt: "Everything you need to know about the upcoming El Clásico at Camp Nou, including form guide, key players, and predictions.",
      content: "El Clásico is upon us once again, and this time the stakes couldn't be higher. FC Barcelona welcome Real Madrid to the Spotify Camp Nou in what promises to be one of the defining matches of the La Liga season.\n\n## Form Guide\n\nBarcelona come into this match on the back of an impressive run of form, having won their last six consecutive matches across all competitions. The team has been playing some of the best football in Europe, with their pressing game and positional play reaching new heights.\n\nReal Madrid, meanwhile, have been solid but not spectacular. They remain unbeaten in their last ten league matches, but draws against lower-table opposition have cost them valuable points.\n\n## Key Players to Watch\n\nThe battle in midfield will likely decide this match. Barcelona's midfield maestros have been pulling the strings all season, while Madrid's counter-attacking threat remains lethal on the break.\n\n## Prediction\n\nWith Camp Nou behind them and momentum on their side, we're backing Barça to edge this one. Prediction: Barcelona 2-1 Real Madrid.\n\n## Getting Tickets\n\nEl Clásico is the most in-demand match of the season. Tickets sell out within minutes through official channels, but you can still find availability through authorized resellers. Check our El Clásico package for the best deals on tickets, hotels, and activities.",
      category: "analysis",
      tags: ["el-clasico", "real-madrid", "la-liga", "preview"],
      metaTitle: "El Clásico Preview: Barça vs Real Madrid March 2026",
      metaDescription: "Full preview of El Clásico at Camp Nou. Form guide, key players, prediction, and how to get tickets for FC Barcelona vs Real Madrid.",
      relatedPackageSlug: "barca-vs-real-madrid-mar-2026",
    },
    {
      slug: "champions-league-road-to-final-2026",
      title: "Barcelona's Road to the Champions League Final: Can They Do It?",
      excerpt: "An in-depth look at Barça's Champions League campaign and their chances of reaching the final in 2026.",
      content: "FC Barcelona's Champions League journey this season has been nothing short of extraordinary. From a shaky group stage start to commanding knockout performances, this team has shown the resilience and quality needed to go all the way.\n\n## The Journey So Far\n\nBarcelona topped their Champions League group with five wins from six matches, scoring 16 goals and conceding just four. The Round of 16 saw them dispatch a tough Italian opponent with clinical efficiency over two legs.\n\n## What Makes This Team Different\n\nUnlike previous seasons where Barcelona would crumble under pressure in Europe, this squad has developed a mental toughness that sets them apart. The mix of experienced campaigners and fearless youngsters has created a perfect balance.\n\n## The Road Ahead\n\nWith Bayern Munich up next, the challenge doesn't get any easier. But if there's one team capable of producing magic on European nights, it's Barcelona at Camp Nou. The atmosphere under the lights, the passion of 90,000 fans — there's no place like it.\n\n## Experience It Live\n\nDon't miss the chance to be part of Champions League history. Our matchday packages include tickets, accommodation near Camp Nou, and local tours to make your trip unforgettable.",
      category: "analysis",
      tags: ["champions-league", "analysis", "season-review"],
      metaTitle: "Barcelona's Champions League 2026 Campaign Analysis",
      metaDescription: "In-depth analysis of FC Barcelona's Champions League campaign. Can they reach the final? Road to glory at Camp Nou.",
    },
    {
      slug: "new-camp-nou-what-to-expect",
      title: "The New Spotify Camp Nou: What to Expect as a Visitor",
      excerpt: "A comprehensive guide to the renovated Spotify Camp Nou, including new features, seating, and visitor tips.",
      content: "The renovation of Camp Nou into the new Spotify Camp Nou is one of the most ambitious stadium projects in football history. Here's everything you need to know about visiting the new stadium.\n\n## What's New\n\nThe Spotify Camp Nou features an expanded capacity of over 105,000 seats, making it the largest football stadium in Europe. The new design includes a complete roof covering all seats, improved acoustics, and a spectacular 360-degree LED ring.\n\n## The Fan Experience\n\nThe renovated stadium puts the fan experience at the center of everything. New concourse areas, improved food and beverage options, faster entry points, and state-of-the-art connectivity mean you'll have the best possible matchday experience.\n\n## Getting There\n\nThe stadium is well-connected by public transport. Metro stations Palau Reial (L3) and Collblanc (L5) are both within a 10-minute walk. Alternatively, bus routes and the tramway system provide easy access.\n\n## Tips for Your Visit\n\nArrive at least 60 minutes before kickoff to enjoy the pre-match atmosphere. The new museum and interactive areas are worth exploring if you arrive early. Make sure to download the official app for mobile ticketing and wayfinding.",
      category: "guide",
      tags: ["camp-nou", "stadium", "renovation", "guide"],
      metaTitle: "New Spotify Camp Nou Guide: Everything You Need to Know",
      metaDescription: "Complete guide to the renovated Spotify Camp Nou. New features, capacity, tips for visitors, and how to get there.",
    },
    {
      slug: "first-time-camp-nou",
      title: "First Time at Camp Nou: The Complete Guide for International Fans",
      excerpt: "Everything first-time visitors need to know about attending a match at the Spotify Camp Nou in Barcelona.",
      content: "Visiting Camp Nou for the first time is a dream come true for any football fan. This guide covers everything you need to know to make your first visit perfect.\n\n## Before You Go\n\nBook your tickets well in advance, especially for big matches. The Spotify Camp Nou has over 99,000 seats, but popular fixtures sell out quickly. Use authorized resellers if official channels are sold out.\n\n## What to Bring\n\nBring your ID (passport for international visitors) as it may be checked against your ticket name. A power bank for your phone, sun protection for afternoon matches, and a light jacket for evening games are all recommended.\n\n## The Matchday Experience\n\nArrive at least 60-90 minutes before kickoff. The areas around the stadium come alive with street vendors, fans singing, and an incredible atmosphere. Head to the Gol Nord end for the most vocal supporters.\n\n## Food and Drink\n\nWhile the stadium has improved its food options, we recommend eating before the match. The Les Corts and Sants neighborhoods have excellent restaurants and bars. Try a classic patatas bravas and a cold cerveza to get in the mood.\n\n## After the Match\n\nDon't rush to leave. Stay 15-20 minutes after the final whistle to let the crowds thin out. The metro can be packed immediately after big matches. Alternatively, walk 10 minutes to find a quieter metro station.\n\n## Our Top Tip\n\nBook a stadium tour for the day before your match. Understanding the history and layout of Camp Nou will make your matchday experience even more special.",
      category: "guide",
      tags: ["camp-nou", "first-time", "guide", "tips"],
      metaTitle: "First Time at Camp Nou: Complete Guide for Visitors 2026",
      metaDescription: "The ultimate guide for first-time visitors to Camp Nou. What to bring, where to eat, how to get there, and insider tips.",
    },
    {
      slug: "best-bars-camp-nou",
      title: "Best Bars Near Camp Nou for Pre-Match Drinks",
      excerpt: "Discover the top bars and restaurants near the Spotify Camp Nou for the perfect pre-match experience.",
      content: "No matchday is complete without pre-match drinks at a great bar. Here are our top picks near the Spotify Camp Nou.\n\n## La Tomaquera (5 min walk)\n\nA local favorite with great Catalan cuisine and an excellent wine selection. Gets busy on matchdays, so arrive early. Their pan con tomate is legendary.\n\n## Bar Bambú (10 min walk)\n\nA classic sports bar with big screens, cold beer, and a lively atmosphere. Popular with both local and international fans. Great for watching the early match while waiting for yours.\n\n## Cervecería Ciudad Condal (30 min walk)\n\nIf you're willing to walk a bit further (or take a short metro ride), this is one of Barcelona's most iconic bars. Their seafood tapas and craft beers are worth the trip.\n\n## La Pepita (20 min walk)\n\nHip burger joint in the Gràcia neighborhood. Their gourmet burgers are perfect pre-match fuel. The cocktail menu is impressive too.\n\n## Tips for Pre-Match Drinking\n\nMost bars in the Camp Nou area start filling up 2-3 hours before kickoff for big matches. Reservations aren't usually possible, so arrive early. Spanish bars typically serve tapas with drinks — perfect for a light pre-match meal.",
      category: "guide",
      tags: ["bars", "restaurants", "camp-nou", "food", "guide"],
      metaTitle: "Best Bars Near Camp Nou 2026 | Pre-Match Drinks Guide",
      metaDescription: "Top bars and restaurants near the Spotify Camp Nou for pre-match drinks. Local favorites, craft beer spots, and tapas bars.",
    },
    {
      slug: "getting-to-camp-nou",
      title: "How to Get to Camp Nou from Barcelona City Center and Airport",
      excerpt: "Complete transport guide to reaching the Spotify Camp Nou from the airport, city center, and major hotels.",
      content: "Getting to Camp Nou is easy once you know your options. Here's how to reach the stadium from anywhere in Barcelona.\n\n## From Barcelona Airport (El Prat)\n\nThe Aerobús from Terminal 1 or 2 takes you to Plaça Espanya in about 35 minutes. From there, take the L3 metro to Palau Reial (just 3 stops). Total journey time: approximately 50-60 minutes. Cost: around €7-8.\n\nAlternatively, a taxi from the airport costs €35-45 and takes 25-40 minutes depending on traffic.\n\n## From City Center (Plaça Catalunya)\n\nTake the L3 (green line) metro directly to Palau Reial. The journey takes about 15 minutes. This is the most popular and efficient option.\n\n## From Sagrada Familia\n\nTake the L5 (blue line) to Collblanc station, then walk 10 minutes to the stadium. Alternatively, take the L5 to Diagonal, change to L3, and go to Palau Reial.\n\n## By Bus\n\nSeveral bus routes serve Camp Nou, including lines 7, 33, 54, 63, 67, 68, 75, 78, and 113. The buses can be slower due to traffic on matchdays.\n\n## By Tram\n\nThe tramway T1, T2, and T3 stop at Avinguda de Xile, a 5-minute walk from the stadium.\n\n## Walking\n\nFrom Plaça Espanya, it's a pleasant 20-minute walk through the university campus area. Great option if the weather is nice.\n\n## Our Recommendation\n\nMetro L3 to Palau Reial is the best option for most visitors. Buy a T-Casual card (10 trips) for €11.35 — much cheaper than single tickets.",
      category: "guide",
      tags: ["transport", "camp-nou", "getting-there", "metro", "guide"],
      metaTitle: "How to Get to Camp Nou | Transport Guide 2026",
      metaDescription: "Complete guide to reaching Camp Nou by metro, bus, tram, taxi from the airport and city center. Best routes and tips.",
    },
    {
      slug: "barca-ticket-prices",
      title: "How Much Do FC Barcelona Tickets Cost? Complete Price Guide 2026",
      excerpt: "A detailed breakdown of FC Barcelona ticket prices for every type of match and seating category at Camp Nou.",
      content: "Understanding FC Barcelona ticket prices can be confusing. Here's a complete breakdown of what you can expect to pay in 2026.\n\n## La Liga Matches\n\nPrices vary significantly depending on the opponent. Here's a rough guide:\n\n### Low-demand matches (e.g., Celta Vigo, Getafe)\n- General admission: €35-60\n- Premium seats: €80-150\n\n### Medium-demand matches (e.g., Sevilla, Valencia)\n- General admission: €65-100\n- Premium seats: €150-250\n\n### High-demand matches (e.g., Real Madrid, Atlético)\n- General admission: €150-300\n- Premium seats: €350-600\n- VIP Hospitality: €500-1,000+\n\n## Champions League Matches\n\nChampions League tickets are generally more expensive:\n- Group stage: €60-150\n- Knockout rounds: €100-400\n- Quarter-finals and beyond: €200-800+\n\n## Where to Buy\n\nOfficial channels often sell out quickly. Authorized resellers like StubHub offer availability after official sales close, typically at a premium of 30-100% above face value.\n\n## Tips for Saving Money\n\nBook early — prices only go up as the match approaches. Consider less popular fixtures for better value. Midweek La Liga matches tend to be cheaper than weekend games.",
      category: "guide",
      tags: ["tickets", "prices", "camp-nou", "guide", "budget"],
      metaTitle: "FC Barcelona Ticket Prices 2026 | Complete Guide",
      metaDescription: "How much do FC Barcelona tickets cost? Complete price guide for La Liga, Champions League, and Copa del Rey matches at Camp Nou.",
    },
    {
      slug: "top-transfer-targets-summer-2026",
      title: "FC Barcelona's Top Transfer Targets for Summer 2026",
      excerpt: "Analyzing the players Barça are reportedly targeting in the upcoming summer transfer window.",
      content: "The summer transfer window is always an exciting time for Barcelona fans. Here's a look at the players reportedly on Barça's radar.\n\n## Midfield Reinforcements\n\nWith the squad's average age in midfield being one of the lowest in Europe, Barcelona are still looking to add experience and quality. Several top midfielders from the Premier League and Serie A have been linked with moves to Camp Nou.\n\n## Defensive Options\n\nThe defense has been solid this season, but depth remains a concern. A versatile center-back who can play out from the back is reportedly a priority.\n\n## What About Attack?\n\nBarcelona's attack has been the most prolific in Europe this season. While there's no urgent need for additions, the club is always monitoring top young talent for the future.\n\n## Financial Situation\n\nThanks to the new stadium sponsorship deal and increased matchday revenue, Barcelona are in a stronger financial position than previous years. However, FFP regulations mean the club must be strategic with their spending.\n\n## Our Verdict\n\nExpect 2-3 quality signings rather than a squad overhaul. Barcelona's philosophy under the current management is clear: develop young talent and supplement with targeted acquisitions.",
      category: "transfers",
      tags: ["transfers", "summer-window", "rumors", "squad"],
      metaTitle: "Barcelona Transfer Targets Summer 2026",
      metaDescription: "Who are FC Barcelona targeting this summer? Analysis of the top transfer targets, financial situation, and predicted signings.",
    },
    {
      slug: "match-report-barca-dominates",
      title: "Match Report: Barcelona Put on a Show with Dominant Home Win",
      excerpt: "Barça delivered a masterclass in attacking football with a comprehensive victory at the Spotify Camp Nou.",
      content: "FC Barcelona put on a dazzling display of attacking football as they cruised to a comfortable victory at the Spotify Camp Nou in front of a packed house.\n\n## First Half\n\nBarcelona started on the front foot and never let up. From the opening whistle, the home side pressed high and moved the ball with incredible speed and precision. The first goal came in the 23rd minute, a beautiful team move involving 18 passes.\n\n## Second Half\n\nThe second half was more of the same. Barcelona's relentless pressing suffocated the opposition, and two more goals followed in quick succession. The Camp Nou was bouncing.\n\n## Key Takeaways\n\nThis performance showed why Barcelona are the favorites for the league title. The pressing, the passing, the movement — everything was at the highest level. The fans played their part too, creating an atmosphere that intimidated the visitors from the start.\n\n## Player Ratings\n\nThe entire team deserves praise, but the midfield was particularly outstanding. The control they exerted over the match was reminiscent of the greatest Barcelona teams of the past.\n\n## What's Next\n\nBarça now turn their attention to the Champions League, where they face Bayern Munich next week. If they play like they did today, they'll be a match for anyone in Europe.",
      category: "matchday",
      tags: ["match-report", "la-liga", "home-win", "camp-nou"],
      metaTitle: "Match Report: Barcelona Dominant Home Win | Camp Nou",
      metaDescription: "Full match report of Barcelona's dominant home victory at Camp Nou. Player ratings, key moments, and analysis.",
    },
    {
      slug: "history-of-el-clasico",
      title: "The Complete History of El Clásico: Barcelona vs Real Madrid",
      excerpt: "A deep dive into the greatest rivalry in football — the history, greatest moments, and legends of El Clásico.",
      content: "El Clásico — the name alone sends shivers down the spine of football fans worldwide. The rivalry between FC Barcelona and Real Madrid transcends sport. It's cultural, political, and deeply personal.\n\n## Origins\n\nThe first official match between Barcelona and Real Madrid took place on May 13, 1902. Since then, the two clubs have faced each other over 250 times, creating one of the most storied rivalries in sports history.\n\n## The Political Dimension\n\nMore than any other football rivalry, El Clásico carries political weight. Barcelona represents Catalan identity and pride, while Real Madrid is seen as the establishment club of the Spanish capital. During the Franco era, this tension reached its peak.\n\n## Greatest Moments\n\nFrom the 5-0 in 2010 to Di Stéfano's era, from Cruyff's transformation of Barcelona to Messi's countless masterclasses — El Clásico has produced some of football's most iconic moments.\n\n## The Modern Era\n\nThe Messi vs Ronaldo years elevated El Clásico to unprecedented global attention. Now, a new generation of stars carries the torch, and the rivalry remains as fierce and compelling as ever.\n\n## Experiencing El Clásico at Camp Nou\n\nThere is simply nothing in football that compares to being at Camp Nou for El Clásico. The noise, the passion, the mosaic displays — it's an experience every football fan should have at least once in their lifetime.",
      category: "guide",
      tags: ["el-clasico", "history", "real-madrid", "guide"],
      metaTitle: "History of El Clásico: Barcelona vs Real Madrid | Complete Guide",
      metaDescription: "The complete history of El Clásico. Greatest moments, legends, and why Barcelona vs Real Madrid is the biggest match in football.",
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: post,
      update: post,
    });
  }
  console.log("Blog posts seeded");

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
