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
      matchTitleEs: "FC Barcelona vs Real Madrid",
      competition: "La Liga",
      matchDate: new Date("2026-03-01T20:00:00Z"),
      matchTime: "21:00 CET",
      opponent: "Real Madrid",
      description: "El Clásico — the biggest match in world football. Experience the legendary rivalry between FC Barcelona and Real Madrid at the Spotify Camp Nou. Over 90,000 fans creating an electric atmosphere as Barça take on their eternal rivals. This is more than a football match — it's a once-in-a-lifetime experience.",
      descriptionEs: "El Clásico — el partido más grande del fútbol mundial. Vive la legendaria rivalidad entre el FC Barcelona y el Real Madrid en el Spotify Camp Nou. Más de 90.000 aficionados creando una atmósfera electrizante mientras el Barça se enfrenta a su eterno rival. Esto es más que un partido de fútbol — es una experiencia única en la vida.",
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
      tipsEs: [
        "Llega al menos 90 minutos antes de El Clásico — las colas de seguridad son más largas de lo habitual",
        "Ve a la Cervecería Ciudad Condal para unas tapas prepartido (30 min andando desde el estadio)",
        "Coge la línea L3 de metro hasta la estación Palau Reial — hay menos aglomeración que en Collblanc",
        "Lleva una batería portátil — querrás grabar el mosaico y los tifos",
        "Quédate 30 minutos después del partido para evitar la avalancha del metro",
      ],
      meetupInfo: "Join our pre-match meetup at Bar La Tomaquera (Carrer de Galileu 58) at 18:00. Free drink for Friends of Barça fans!",
      meetupInfoEs: "Únete a nuestra quedada prepartido en el Bar La Tomaquera (Carrer de Galileu 58) a las 18:00. ¡Bebida gratis para los fans de Friends of Barça!",
      metaTitle: "FC Barcelona vs Real Madrid Tickets & Packages | El Clásico 2026",
      metaTitleEs: "Entradas FC Barcelona vs Real Madrid | El Clásico 2026",
      metaDescription: "Get El Clásico tickets, hotels near Camp Nou, and tours. Complete FC Barcelona vs Real Madrid matchday package for March 2026.",
      metaDescriptionEs: "Consigue entradas para El Clásico, hoteles cerca del Camp Nou y tours. Paquete completo para el FC Barcelona vs Real Madrid en marzo 2026.",
      status: "upcoming",
      featured: true,
    },
    {
      slug: "barca-vs-atletico-mar-2026",
      matchTitle: "FC Barcelona vs Atlético Madrid",
      matchTitleEs: "FC Barcelona vs Atlético de Madrid",
      competition: "La Liga",
      matchDate: new Date("2026-03-08T17:00:00Z"),
      matchTime: "18:00 CET",
      opponent: "Atlético Madrid",
      description: "A top-of-the-table clash as Barça host Atlético Madrid at the Spotify Camp Nou. Always a tightly contested affair, this match promises intensity, passion, and world-class football. Simeone vs Barcelona — a modern classic.",
      descriptionEs: "Un choque por lo alto de la clasificación con el Atlético de Madrid en el Spotify Camp Nou. Siempre un encuentro reñido, este partido promete intensidad, pasión y fútbol de primer nivel. Simeone contra el Barcelona — un clásico moderno.",
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
      tipsEs: [
        "El ambiente en los grandes partidos de Liga es increíble — llega pronto para empaparte de él",
        "Prueba el vermut local en cualquier bar del barrio de Les Corts antes del partido",
        "La puerta 14 suele ser el acceso más rápido para las entradas de admisión general",
      ],
      metaTitle: "FC Barcelona vs Atlético Madrid Tickets & Packages 2026",
      metaTitleEs: "Entradas FC Barcelona vs Atlético de Madrid 2026",
      metaDescription: "Get FC Barcelona vs Atlético Madrid tickets and hotel packages. Complete matchday experience at Camp Nou, March 2026.",
      metaDescriptionEs: "Consigue entradas y paquetes de hotel para el FC Barcelona vs Atlético de Madrid. Experiencia completa en el Camp Nou, marzo 2026.",
      status: "upcoming",
      featured: true,
    },
    {
      slug: "barca-vs-bayern-mar-2026",
      matchTitle: "FC Barcelona vs Bayern Munich",
      matchTitleEs: "FC Barcelona vs Bayern de Múnich",
      competition: "Champions League",
      matchDate: new Date("2026-03-15T20:00:00Z"),
      matchTime: "21:00 CET",
      opponent: "Bayern Munich",
      description: "Champions League nights at Camp Nou are legendary. When FC Barcelona face Bayern Munich under the floodlights, the stadium comes alive like nowhere else. A clash of European giants with history, drama, and world-class talent.",
      descriptionEs: "Las noches de Champions League en el Camp Nou son legendarias. Cuando el FC Barcelona se enfrenta al Bayern de Múnich bajo los focos, el estadio cobra vida como en ningún otro lugar. Un choque de gigantes europeos con historia, drama y talento de primer nivel.",
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
      tipsEs: [
        "Las noches de Champions tienen un ambiente especial — el himno del Barça antes del pitido inicial pone la piel de gallina",
        "¡Viste los colores del Barça! El mosaico antes de los partidos de Champions es espectacular",
        "Reserva para cenar con antelación — los restaurantes cerca del Camp Nou se llenan en noches de Champions",
      ],
      metaTitle: "FC Barcelona vs Bayern Munich Champions League Tickets 2026",
      metaTitleEs: "Entradas FC Barcelona vs Bayern de Múnich | Champions League 2026",
      metaDescription: "Champions League tickets for FC Barcelona vs Bayern Munich at Camp Nou. Complete matchday package with hotels and tours.",
      metaDescriptionEs: "Entradas de Champions League para el FC Barcelona vs Bayern de Múnich en el Camp Nou. Paquete completo con hoteles y tours.",
      status: "upcoming",
      featured: true,
    },
    {
      slug: "barca-vs-man-city-apr-2026",
      matchTitle: "FC Barcelona vs Manchester City",
      matchTitleEs: "FC Barcelona vs Manchester City",
      competition: "Champions League",
      matchDate: new Date("2026-04-05T20:00:00Z"),
      matchTime: "21:00 CET",
      opponent: "Manchester City",
      description: "Two of Europe's most exciting teams go head to head in the Champions League. Barcelona vs Manchester City is a clash of styles and philosophies — both rooted in the Barça DNA of possession football. An unmissable European night.",
      descriptionEs: "Dos de los equipos más emocionantes de Europa se enfrentan en la Champions League. Barcelona vs Manchester City es un choque de estilos y filosofías — ambos enraizados en el ADN del Barça y el fútbol de posesión. Una noche europea imperdible.",
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
      tipsEs: [
        "Será una de las entradas más codiciadas de la temporada — reserva lo antes posible",
        "Disfruta del prepartido en la zona de Plaça Espanya si vienes desde el centro de la ciudad",
      ],
      metaTitle: "FC Barcelona vs Manchester City Champions League Tickets 2026",
      metaTitleEs: "Entradas FC Barcelona vs Manchester City | Champions League 2026",
      metaDescription: "Get Barcelona vs Man City Champions League tickets and packages. Hotels near Camp Nou and Barcelona tours included.",
      metaDescriptionEs: "Consigue entradas y paquetes para el Barcelona vs Manchester City en Champions League. Hoteles cerca del Camp Nou y tours por Barcelona incluidos.",
      status: "upcoming",
      featured: true,
    },
    {
      slug: "barca-vs-sevilla-apr-2026",
      matchTitle: "FC Barcelona vs Sevilla",
      matchTitleEs: "FC Barcelona vs Sevilla FC",
      competition: "La Liga",
      matchDate: new Date("2026-04-12T17:00:00Z"),
      matchTime: "18:00 CET",
      opponent: "Sevilla",
      description: "A classic La Liga fixture as Barça welcome Sevilla to Camp Nou. Always a competitive match with plenty of goals. Perfect for first-time visitors looking for a great atmosphere at an accessible price point.",
      descriptionEs: "Un clásico de La Liga con el Sevilla FC en el Camp Nou. Siempre un partido competitivo con muchos goles. Perfecto para quienes visitan el estadio por primera vez y buscan un gran ambiente a un precio accesible.",
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
      tipsEs: [
        "Partido con muy buena relación calidad-precio para quienes van por primera vez — gran ambiente sin precios desorbitados",
        "El clima de abril en Barcelona es ideal — lleva una chaqueta ligera para los partidos nocturnos",
      ],
      metaTitle: "FC Barcelona vs Sevilla Tickets & Packages 2026",
      metaTitleEs: "Entradas FC Barcelona vs Sevilla FC 2026",
      metaDescription: "Affordable FC Barcelona vs Sevilla tickets and matchday packages at Camp Nou, April 2026.",
      metaDescriptionEs: "Entradas asequibles y paquetes para el FC Barcelona vs Sevilla FC en el Camp Nou, abril 2026.",
      status: "upcoming",
      featured: false,
    },
    {
      slug: "barca-vs-villarreal-apr-2026",
      matchTitle: "FC Barcelona vs Villarreal",
      matchTitleEs: "FC Barcelona vs Villarreal CF",
      competition: "La Liga",
      matchDate: new Date("2026-04-26T17:00:00Z"),
      matchTime: "18:00 CET",
      opponent: "Villarreal",
      description: "Barça vs the Yellow Submarine. Villarreal always bring attractive football to Camp Nou, making this an entertaining La Liga encounter. A great option for fans looking for an authentic Spanish football experience.",
      descriptionEs: "El Barça contra el Submarino Amarillo. El Villarreal siempre trae fútbol atractivo al Camp Nou, convirtiendo este en un entretenido encuentro de Liga. Una gran opción para aficionados que buscan una auténtica experiencia futbolística española.",
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
      tipsEs: [
        "La primavera en Barcelona es preciosa — combina el partido con un día de playa",
        "Los aficionados del Villarreal son muy majos — gran ambiente en las zonas mixtas",
      ],
      metaTitle: "FC Barcelona vs Villarreal Tickets & Packages 2026",
      metaTitleEs: "Entradas FC Barcelona vs Villarreal CF 2026",
      metaDescription: "FC Barcelona vs Villarreal tickets and matchday packages at Camp Nou, April 2026.",
      metaDescriptionEs: "Entradas y paquetes para el FC Barcelona vs Villarreal CF en el Camp Nou, abril 2026.",
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
      titleEs: "Previa de El Clásico: Qué esperar del Barça vs Real Madrid en marzo 2026",
      excerpt: "Everything you need to know about the upcoming El Clásico at Camp Nou, including form guide, key players, and predictions.",
      excerptEs: "Todo lo que necesitas saber sobre el próximo Clásico en el Camp Nou: estado de forma, jugadores clave y pronósticos.",
      content: "El Clásico is upon us once again, and this time the stakes couldn't be higher. FC Barcelona welcome Real Madrid to the Spotify Camp Nou in what promises to be one of the defining matches of the La Liga season.\n\n## Form Guide\n\nBarcelona come into this match on the back of an impressive run of form, having won their last six consecutive matches across all competitions. The team has been playing some of the best football in Europe, with their pressing game and positional play reaching new heights.\n\nReal Madrid, meanwhile, have been solid but not spectacular. They remain unbeaten in their last ten league matches, but draws against lower-table opposition have cost them valuable points.\n\n## Key Players to Watch\n\nThe battle in midfield will likely decide this match. Barcelona's midfield maestros have been pulling the strings all season, while Madrid's counter-attacking threat remains lethal on the break.\n\n## Prediction\n\nWith Camp Nou behind them and momentum on their side, we're backing Barça to edge this one. Prediction: Barcelona 2-1 Real Madrid.\n\n## Getting Tickets\n\nEl Clásico is the most in-demand match of the season. Tickets sell out within minutes through official channels, but you can still find availability through authorized resellers. Check our El Clásico package for the best deals on tickets, hotels, and activities.",
      contentEs: "El Clásico vuelve una vez más, y en esta ocasión lo que está en juego no podría ser mayor. El FC Barcelona recibe al Real Madrid en el Spotify Camp Nou en lo que promete ser uno de los partidos decisivos de la temporada en La Liga.\n\n## Estado de forma\n\nEl Barcelona llega a este encuentro en un gran momento de forma, habiendo ganado sus últimos seis partidos consecutivos en todas las competiciones. El equipo está desplegando uno de los mejores fútboles de Europa, con su juego de presión y su fútbol posicional alcanzando nuevas cotas.\n\nEl Real Madrid, por su parte, ha sido sólido pero no espectacular. Se mantienen invictos en sus últimos diez partidos de Liga, pero los empates contra rivales de la zona baja les han costado puntos valiosos.\n\n## Jugadores clave a seguir\n\nLa batalla en el centro del campo probablemente decidirá este partido. Los maestros del mediocampo del Barcelona han llevado la batuta toda la temporada, mientras que la amenaza del Madrid al contraataque sigue siendo letal.\n\n## Pronóstico\n\nCon el Camp Nou empujando y el impulso de su lado, apostamos por el Barça para llevarse la victoria. Pronóstico: Barcelona 2-1 Real Madrid.\n\n## Cómo conseguir entradas\n\nEl Clásico es el partido con mayor demanda de la temporada. Las entradas se agotan en minutos a través de los canales oficiales, pero aún puedes encontrar disponibilidad en revendedores autorizados. Consulta nuestro paquete de El Clásico para las mejores ofertas en entradas, hoteles y actividades.",
      category: "analysis",
      tags: ["el-clasico", "real-madrid", "la-liga", "preview"],
      metaTitle: "El Clásico Preview: Barça vs Real Madrid March 2026",
      metaTitleEs: "Previa El Clásico: Barça vs Real Madrid marzo 2026",
      metaDescription: "Full preview of El Clásico at Camp Nou. Form guide, key players, prediction, and how to get tickets for FC Barcelona vs Real Madrid.",
      metaDescriptionEs: "Previa completa de El Clásico en el Camp Nou. Estado de forma, jugadores clave, pronóstico y cómo conseguir entradas para el FC Barcelona vs Real Madrid.",
      relatedPackageSlug: "barca-vs-real-madrid-mar-2026",
    },
    {
      slug: "champions-league-road-to-final-2026",
      title: "Barcelona's Road to the Champions League Final: Can They Do It?",
      titleEs: "El camino del Barcelona a la final de la Champions League: ¿Pueden conseguirlo?",
      excerpt: "An in-depth look at Barça's Champions League campaign and their chances of reaching the final in 2026.",
      excerptEs: "Un análisis en profundidad de la campaña del Barça en la Champions League y sus posibilidades de llegar a la final en 2026.",
      content: "FC Barcelona's Champions League journey this season has been nothing short of extraordinary. From a shaky group stage start to commanding knockout performances, this team has shown the resilience and quality needed to go all the way.\n\n## The Journey So Far\n\nBarcelona topped their Champions League group with five wins from six matches, scoring 16 goals and conceding just four. The Round of 16 saw them dispatch a tough Italian opponent with clinical efficiency over two legs.\n\n## What Makes This Team Different\n\nUnlike previous seasons where Barcelona would crumble under pressure in Europe, this squad has developed a mental toughness that sets them apart. The mix of experienced campaigners and fearless youngsters has created a perfect balance.\n\n## The Road Ahead\n\nWith Bayern Munich up next, the challenge doesn't get any easier. But if there's one team capable of producing magic on European nights, it's Barcelona at Camp Nou. The atmosphere under the lights, the passion of 90,000 fans — there's no place like it.\n\n## Experience It Live\n\nDon't miss the chance to be part of Champions League history. Our matchday packages include tickets, accommodation near Camp Nou, and local tours to make your trip unforgettable.",
      contentEs: "El recorrido del FC Barcelona en la Champions League esta temporada ha sido sencillamente extraordinario. Desde un inicio titubeante en la fase de grupos hasta actuaciones dominantes en las eliminatorias, este equipo ha demostrado la resiliencia y la calidad necesarias para llegar hasta el final.\n\n## El camino hasta ahora\n\nEl Barcelona lideró su grupo de Champions League con cinco victorias en seis partidos, anotando 16 goles y encajando solo cuatro. En los octavos de final despacharon a un duro rival italiano con eficacia clínica a lo largo de las dos eliminatorias.\n\n## Qué hace diferente a este equipo\n\nA diferencia de temporadas anteriores en las que el Barcelona se derrumbaba bajo presión en Europa, esta plantilla ha desarrollado una fortaleza mental que la distingue. La mezcla de veteranos curtidos y jóvenes sin miedo ha creado un equilibrio perfecto.\n\n## El camino que queda\n\nCon el Bayern de Múnich como siguiente rival, el desafío no se pone nada fácil. Pero si hay un equipo capaz de crear magia en las noches europeas, ese es el Barcelona en el Camp Nou. La atmósfera bajo los focos, la pasión de 90.000 aficionados — no hay lugar comparable.\n\n## Vívelo en directo\n\nNo te pierdas la oportunidad de ser parte de la historia de la Champions League. Nuestros paquetes de día de partido incluyen entradas, alojamiento cerca del Camp Nou y tours locales para que tu viaje sea inolvidable.",
      category: "analysis",
      tags: ["champions-league", "analysis", "season-review"],
      metaTitle: "Barcelona's Champions League 2026 Campaign Analysis",
      metaTitleEs: "Análisis de la campaña del Barcelona en la Champions League 2026",
      metaDescription: "In-depth analysis of FC Barcelona's Champions League campaign. Can they reach the final? Road to glory at Camp Nou.",
      metaDescriptionEs: "Análisis en profundidad de la campaña del FC Barcelona en la Champions League. ¿Pueden llegar a la final? El camino a la gloria en el Camp Nou.",
    },
    {
      slug: "new-camp-nou-what-to-expect",
      title: "The New Spotify Camp Nou: What to Expect as a Visitor",
      titleEs: "El nuevo Spotify Camp Nou: Qué esperar como visitante",
      excerpt: "A comprehensive guide to the renovated Spotify Camp Nou, including new features, seating, and visitor tips.",
      excerptEs: "Una guía completa del renovado Spotify Camp Nou: nuevas prestaciones, asientos y consejos para visitantes.",
      content: "The renovation of Camp Nou into the new Spotify Camp Nou is one of the most ambitious stadium projects in football history. Here's everything you need to know about visiting the new stadium.\n\n## What's New\n\nThe Spotify Camp Nou features an expanded capacity of over 105,000 seats, making it the largest football stadium in Europe. The new design includes a complete roof covering all seats, improved acoustics, and a spectacular 360-degree LED ring.\n\n## The Fan Experience\n\nThe renovated stadium puts the fan experience at the center of everything. New concourse areas, improved food and beverage options, faster entry points, and state-of-the-art connectivity mean you'll have the best possible matchday experience.\n\n## Getting There\n\nThe stadium is well-connected by public transport. Metro stations Palau Reial (L3) and Collblanc (L5) are both within a 10-minute walk. Alternatively, bus routes and the tramway system provide easy access.\n\n## Tips for Your Visit\n\nArrive at least 60 minutes before kickoff to enjoy the pre-match atmosphere. The new museum and interactive areas are worth exploring if you arrive early. Make sure to download the official app for mobile ticketing and wayfinding.",
      contentEs: "La renovación del Camp Nou en el nuevo Spotify Camp Nou es uno de los proyectos de estadio más ambiciosos de la historia del fútbol. Aquí tienes todo lo que necesitas saber para visitar el nuevo estadio.\n\n## Qué hay de nuevo\n\nEl Spotify Camp Nou cuenta con una capacidad ampliada de más de 105.000 asientos, convirtiéndolo en el estadio de fútbol más grande de Europa. El nuevo diseño incluye una cubierta completa sobre todas las localidades, acústica mejorada y un espectacular anillo LED de 360 grados.\n\n## La experiencia del aficionado\n\nEl estadio renovado sitúa la experiencia del aficionado en el centro de todo. Nuevas zonas de tránsito, opciones mejoradas de comida y bebida, accesos más rápidos y conectividad de última generación garantizan la mejor experiencia posible en día de partido.\n\n## Cómo llegar\n\nEl estadio está bien conectado por transporte público. Las estaciones de metro Palau Reial (L3) y Collblanc (L5) están a menos de 10 minutos a pie. Alternativamente, varias líneas de autobús y el tranvía ofrecen fácil acceso.\n\n## Consejos para tu visita\n\nLlega al menos 60 minutos antes del inicio para disfrutar del ambiente previo al partido. El nuevo museo y las zonas interactivas merecen una visita si llegas con tiempo. Asegúrate de descargar la app oficial para las entradas digitales y orientarte dentro del estadio.",
      category: "guide",
      tags: ["camp-nou", "stadium", "renovation", "guide"],
      metaTitle: "New Spotify Camp Nou Guide: Everything You Need to Know",
      metaTitleEs: "Guía del nuevo Spotify Camp Nou: Todo lo que necesitas saber",
      metaDescription: "Complete guide to the renovated Spotify Camp Nou. New features, capacity, tips for visitors, and how to get there.",
      metaDescriptionEs: "Guía completa del renovado Spotify Camp Nou. Nuevas prestaciones, capacidad, consejos para visitantes y cómo llegar.",
    },
    {
      slug: "first-time-camp-nou",
      title: "First Time at Camp Nou: The Complete Guide for International Fans",
      titleEs: "Tu primera vez en el Camp Nou: Guía completa para aficionados internacionales",
      excerpt: "Everything first-time visitors need to know about attending a match at the Spotify Camp Nou in Barcelona.",
      excerptEs: "Todo lo que necesitas saber si es tu primera vez asistiendo a un partido en el Spotify Camp Nou de Barcelona.",
      content: "Visiting Camp Nou for the first time is a dream come true for any football fan. This guide covers everything you need to know to make your first visit perfect.\n\n## Before You Go\n\nBook your tickets well in advance, especially for big matches. The Spotify Camp Nou has over 99,000 seats, but popular fixtures sell out quickly. Use authorized resellers if official channels are sold out.\n\n## What to Bring\n\nBring your ID (passport for international visitors) as it may be checked against your ticket name. A power bank for your phone, sun protection for afternoon matches, and a light jacket for evening games are all recommended.\n\n## The Matchday Experience\n\nArrive at least 60-90 minutes before kickoff. The areas around the stadium come alive with street vendors, fans singing, and an incredible atmosphere. Head to the Gol Nord end for the most vocal supporters.\n\n## Food and Drink\n\nWhile the stadium has improved its food options, we recommend eating before the match. The Les Corts and Sants neighborhoods have excellent restaurants and bars. Try a classic patatas bravas and a cold cerveza to get in the mood.\n\n## After the Match\n\nDon't rush to leave. Stay 15-20 minutes after the final whistle to let the crowds thin out. The metro can be packed immediately after big matches. Alternatively, walk 10 minutes to find a quieter metro station.\n\n## Our Top Tip\n\nBook a stadium tour for the day before your match. Understanding the history and layout of Camp Nou will make your matchday experience even more special.",
      contentEs: "Visitar el Camp Nou por primera vez es un sueño hecho realidad para cualquier aficionado al fútbol. Esta guía cubre todo lo que necesitas saber para que tu primera visita sea perfecta.\n\n## Antes de ir\n\nReserva tus entradas con mucha antelación, especialmente para los partidos grandes. El Spotify Camp Nou tiene más de 99.000 localidades, pero los encuentros más populares se agotan rápidamente. Utiliza revendedores autorizados si los canales oficiales están agotados.\n\n## Qué llevar\n\nLleva tu DNI o pasaporte (para visitantes internacionales), ya que pueden comprobarlo con el nombre de tu entrada. Una batería portátil para el móvil, protección solar para los partidos de tarde y una chaqueta ligera para los nocturnos son muy recomendables.\n\n## La experiencia del día de partido\n\nLlega al menos 60-90 minutos antes del inicio. Los alrededores del estadio cobran vida con vendedores ambulantes, aficionados cantando y un ambiente increíble. Dirígete a la zona del Gol Nord para estar con los seguidores más animosos.\n\n## Comida y bebida\n\nAunque el estadio ha mejorado sus opciones gastronómicas, recomendamos comer antes del partido. Los barrios de Les Corts y Sants tienen excelentes restaurantes y bares. Prueba unas patatas bravas clásicas y una cerveza bien fría para entrar en ambiente.\n\n## Después del partido\n\nNo tengas prisa por irte. Quédate 15-20 minutos después del pitido final para dejar que la multitud se disperse. El metro puede estar abarrotado justo después de los partidos grandes. Otra opción es caminar 10 minutos hasta una estación de metro más tranquila.\n\n## Nuestro mejor consejo\n\nReserva un tour del estadio para el día anterior a tu partido. Conocer la historia y la distribución del Camp Nou hará que tu experiencia en día de partido sea aún más especial.",
      category: "guide",
      tags: ["camp-nou", "first-time", "guide", "tips"],
      metaTitle: "First Time at Camp Nou: Complete Guide for Visitors 2026",
      metaTitleEs: "Primera vez en el Camp Nou: Guía completa para visitantes 2026",
      metaDescription: "The ultimate guide for first-time visitors to Camp Nou. What to bring, where to eat, how to get there, and insider tips.",
      metaDescriptionEs: "La guía definitiva para quienes visitan el Camp Nou por primera vez. Qué llevar, dónde comer, cómo llegar y consejos de experto.",
    },
    {
      slug: "best-bars-camp-nou",
      title: "Best Bars Near Camp Nou for Pre-Match Drinks",
      titleEs: "Los mejores bares cerca del Camp Nou para el prepartido",
      excerpt: "Discover the top bars and restaurants near the Spotify Camp Nou for the perfect pre-match experience.",
      excerptEs: "Descubre los mejores bares y restaurantes cerca del Spotify Camp Nou para un prepartido perfecto.",
      content: "No matchday is complete without pre-match drinks at a great bar. Here are our top picks near the Spotify Camp Nou.\n\n## La Tomaquera (5 min walk)\n\nA local favorite with great Catalan cuisine and an excellent wine selection. Gets busy on matchdays, so arrive early. Their pan con tomate is legendary.\n\n## Bar Bambú (10 min walk)\n\nA classic sports bar with big screens, cold beer, and a lively atmosphere. Popular with both local and international fans. Great for watching the early match while waiting for yours.\n\n## Cervecería Ciudad Condal (30 min walk)\n\nIf you're willing to walk a bit further (or take a short metro ride), this is one of Barcelona's most iconic bars. Their seafood tapas and craft beers are worth the trip.\n\n## La Pepita (20 min walk)\n\nHip burger joint in the Gràcia neighborhood. Their gourmet burgers are perfect pre-match fuel. The cocktail menu is impressive too.\n\n## Tips for Pre-Match Drinking\n\nMost bars in the Camp Nou area start filling up 2-3 hours before kickoff for big matches. Reservations aren't usually possible, so arrive early. Spanish bars typically serve tapas with drinks — perfect for a light pre-match meal.",
      contentEs: "Ningún día de partido está completo sin unas cañas en un buen bar antes del encuentro. Aquí van nuestras recomendaciones cerca del Spotify Camp Nou.\n\n## La Tomaquera (5 min andando)\n\nUn clásico local con gran cocina catalana y una excelente selección de vinos. Se llena en días de partido, así que llega pronto. Su pa amb tomàquet es legendario.\n\n## Bar Bambú (10 min andando)\n\nUn bar deportivo clásico con pantallas grandes, cerveza fría y un ambiente animado. Popular tanto entre aficionados locales como internacionales. Genial para ver el partido previo mientras esperas al tuyo.\n\n## Cervecería Ciudad Condal (30 min andando)\n\nSi estás dispuesto a caminar un poco más (o coger un metro rápido), este es uno de los bares más emblemáticos de Barcelona. Sus tapas de marisco y cervezas artesanales merecen el desplazamiento.\n\n## La Pepita (20 min andando)\n\nHamburgesería moderna en el barrio de Gràcia. Sus hamburguesas gourmet son el combustible perfecto antes del partido. La carta de cócteles también impresiona.\n\n## Consejos para el prepartido\n\nLa mayoría de bares en la zona del Camp Nou empiezan a llenarse 2-3 horas antes del inicio en los partidos grandes. No suelen admitir reservas, así que llega con tiempo. Los bares españoles normalmente sirven tapas con las bebidas — perfecto para picar algo ligero antes del partido.",
      category: "guide",
      tags: ["bars", "restaurants", "camp-nou", "food", "guide"],
      metaTitle: "Best Bars Near Camp Nou 2026 | Pre-Match Drinks Guide",
      metaTitleEs: "Mejores bares cerca del Camp Nou 2026 | Guía prepartido",
      metaDescription: "Top bars and restaurants near the Spotify Camp Nou for pre-match drinks. Local favorites, craft beer spots, and tapas bars.",
      metaDescriptionEs: "Los mejores bares y restaurantes cerca del Spotify Camp Nou para el prepartido. Locales favoritos, cerveza artesanal y bares de tapas.",
    },
    {
      slug: "getting-to-camp-nou",
      title: "How to Get to Camp Nou from Barcelona City Center and Airport",
      titleEs: "Cómo llegar al Camp Nou desde el centro de Barcelona y el aeropuerto",
      excerpt: "Complete transport guide to reaching the Spotify Camp Nou from the airport, city center, and major hotels.",
      excerptEs: "Guía completa de transporte para llegar al Spotify Camp Nou desde el aeropuerto, el centro de la ciudad y los principales hoteles.",
      content: "Getting to Camp Nou is easy once you know your options. Here's how to reach the stadium from anywhere in Barcelona.\n\n## From Barcelona Airport (El Prat)\n\nThe Aerobús from Terminal 1 or 2 takes you to Plaça Espanya in about 35 minutes. From there, take the L3 metro to Palau Reial (just 3 stops). Total journey time: approximately 50-60 minutes. Cost: around €7-8.\n\nAlternatively, a taxi from the airport costs €35-45 and takes 25-40 minutes depending on traffic.\n\n## From City Center (Plaça Catalunya)\n\nTake the L3 (green line) metro directly to Palau Reial. The journey takes about 15 minutes. This is the most popular and efficient option.\n\n## From Sagrada Familia\n\nTake the L5 (blue line) to Collblanc station, then walk 10 minutes to the stadium. Alternatively, take the L5 to Diagonal, change to L3, and go to Palau Reial.\n\n## By Bus\n\nSeveral bus routes serve Camp Nou, including lines 7, 33, 54, 63, 67, 68, 75, 78, and 113. The buses can be slower due to traffic on matchdays.\n\n## By Tram\n\nThe tramway T1, T2, and T3 stop at Avinguda de Xile, a 5-minute walk from the stadium.\n\n## Walking\n\nFrom Plaça Espanya, it's a pleasant 20-minute walk through the university campus area. Great option if the weather is nice.\n\n## Our Recommendation\n\nMetro L3 to Palau Reial is the best option for most visitors. Buy a T-Casual card (10 trips) for €11.35 — much cheaper than single tickets.",
      contentEs: "Llegar al Camp Nou es fácil una vez que conoces las opciones. Así puedes llegar al estadio desde cualquier punto de Barcelona.\n\n## Desde el aeropuerto de Barcelona (El Prat)\n\nEl Aerobús desde la Terminal 1 o 2 te lleva a Plaça Espanya en unos 35 minutos. Desde allí, coge el metro L3 hasta Palau Reial (solo 3 paradas). Tiempo total del trayecto: aproximadamente 50-60 minutos. Coste: unos 7-8 €.\n\nAlternativamente, un taxi desde el aeropuerto cuesta entre 35-45 € y tarda 25-40 minutos dependiendo del tráfico.\n\n## Desde el centro de la ciudad (Plaça Catalunya)\n\nCoge el metro L3 (línea verde) directamente hasta Palau Reial. El trayecto dura unos 15 minutos. Es la opción más popular y eficiente.\n\n## Desde la Sagrada Familia\n\nCoge la L5 (línea azul) hasta la estación de Collblanc y camina 10 minutos hasta el estadio. Otra opción es tomar la L5 hasta Diagonal, hacer transbordo a la L3 e ir hasta Palau Reial.\n\n## En autobús\n\nVarias líneas de autobús llegan al Camp Nou, incluyendo las líneas 7, 33, 54, 63, 67, 68, 75, 78 y 113. Los autobuses pueden ser más lentos por el tráfico en días de partido.\n\n## En tranvía\n\nLas líneas de tranvía T1, T2 y T3 paran en Avinguda de Xile, a 5 minutos andando del estadio.\n\n## Andando\n\nDesde Plaça Espanya es un agradable paseo de 20 minutos atravesando la zona del campus universitario. Excelente opción si hace buen tiempo.\n\n## Nuestra recomendación\n\nEl metro L3 hasta Palau Reial es la mejor opción para la mayoría de visitantes. Compra una tarjeta T-Casual (10 viajes) por 11,35 € — mucho más barata que los billetes sueltos.",
      category: "guide",
      tags: ["transport", "camp-nou", "getting-there", "metro", "guide"],
      metaTitle: "How to Get to Camp Nou | Transport Guide 2026",
      metaTitleEs: "Cómo llegar al Camp Nou | Guía de transporte 2026",
      metaDescription: "Complete guide to reaching Camp Nou by metro, bus, tram, taxi from the airport and city center. Best routes and tips.",
      metaDescriptionEs: "Guía completa para llegar al Camp Nou en metro, autobús, tranvía y taxi desde el aeropuerto y el centro de la ciudad. Mejores rutas y consejos.",
    },
    {
      slug: "barca-ticket-prices",
      title: "How Much Do FC Barcelona Tickets Cost? Complete Price Guide 2026",
      titleEs: "Cuánto cuestan las entradas del FC Barcelona? Guía completa de precios 2026",
      excerpt: "A detailed breakdown of FC Barcelona ticket prices for every type of match and seating category at Camp Nou.",
      excerptEs: "Un desglose detallado de los precios de las entradas del FC Barcelona para cada tipo de partido y categoría de asiento en el Camp Nou.",
      content: "Understanding FC Barcelona ticket prices can be confusing. Here's a complete breakdown of what you can expect to pay in 2026.\n\n## La Liga Matches\n\nPrices vary significantly depending on the opponent. Here's a rough guide:\n\n### Low-demand matches (e.g., Celta Vigo, Getafe)\n- General admission: €35-60\n- Premium seats: €80-150\n\n### Medium-demand matches (e.g., Sevilla, Valencia)\n- General admission: €65-100\n- Premium seats: €150-250\n\n### High-demand matches (e.g., Real Madrid, Atlético)\n- General admission: €150-300\n- Premium seats: €350-600\n- VIP Hospitality: €500-1,000+\n\n## Champions League Matches\n\nChampions League tickets are generally more expensive:\n- Group stage: €60-150\n- Knockout rounds: €100-400\n- Quarter-finals and beyond: €200-800+\n\n## Where to Buy\n\nOfficial channels often sell out quickly. Authorized resellers like StubHub offer availability after official sales close, typically at a premium of 30-100% above face value.\n\n## Tips for Saving Money\n\nBook early — prices only go up as the match approaches. Consider less popular fixtures for better value. Midweek La Liga matches tend to be cheaper than weekend games.",
      contentEs: "Entender los precios de las entradas del FC Barcelona puede resultar confuso. Aquí tienes un desglose completo de lo que puedes esperar pagar en 2026.\n\n## Partidos de La Liga\n\nLos precios varían significativamente según el rival. Aquí va una guía orientativa:\n\n### Partidos de baja demanda (ej. Celta de Vigo, Getafe)\n- Entrada general: 35-60 €\n- Asientos premium: 80-150 €\n\n### Partidos de demanda media (ej. Sevilla, Valencia)\n- Entrada general: 65-100 €\n- Asientos premium: 150-250 €\n\n### Partidos de alta demanda (ej. Real Madrid, Atlético)\n- Entrada general: 150-300 €\n- Asientos premium: 350-600 €\n- Hospitalidad VIP: 500-1.000+ €\n\n## Partidos de Champions League\n\nLas entradas de Champions League suelen ser más caras:\n- Fase de grupos: 60-150 €\n- Rondas eliminatorias: 100-400 €\n- Cuartos de final en adelante: 200-800+ €\n\n## Dónde comprar\n\nLos canales oficiales se agotan rápidamente. Revendedores autorizados como StubHub ofrecen disponibilidad tras cerrarse las ventas oficiales, normalmente con un recargo del 30-100% sobre el precio original.\n\n## Consejos para ahorrar\n\nReserva con antelación — los precios solo suben a medida que se acerca el partido. Considera los partidos menos populares para una mejor relación calidad-precio. Los partidos de Liga entre semana suelen ser más baratos que los de fin de semana.",
      category: "guide",
      tags: ["tickets", "prices", "camp-nou", "guide", "budget"],
      metaTitle: "FC Barcelona Ticket Prices 2026 | Complete Guide",
      metaTitleEs: "Precios de entradas del FC Barcelona 2026 | Guía completa",
      metaDescription: "How much do FC Barcelona tickets cost? Complete price guide for La Liga, Champions League, and Copa del Rey matches at Camp Nou.",
      metaDescriptionEs: "Cuánto cuestan las entradas del FC Barcelona? Guía completa de precios para partidos de La Liga, Champions League y Copa del Rey en el Camp Nou.",
    },
    {
      slug: "top-transfer-targets-summer-2026",
      title: "FC Barcelona's Top Transfer Targets for Summer 2026",
      titleEs: "Los principales objetivos de fichaje del FC Barcelona para el verano 2026",
      excerpt: "Analyzing the players Barça are reportedly targeting in the upcoming summer transfer window.",
      excerptEs: "Analizamos los jugadores que el Barça tiene en su punto de mira para el próximo mercado de fichajes de verano.",
      content: "The summer transfer window is always an exciting time for Barcelona fans. Here's a look at the players reportedly on Barça's radar.\n\n## Midfield Reinforcements\n\nWith the squad's average age in midfield being one of the lowest in Europe, Barcelona are still looking to add experience and quality. Several top midfielders from the Premier League and Serie A have been linked with moves to Camp Nou.\n\n## Defensive Options\n\nThe defense has been solid this season, but depth remains a concern. A versatile center-back who can play out from the back is reportedly a priority.\n\n## What About Attack?\n\nBarcelona's attack has been the most prolific in Europe this season. While there's no urgent need for additions, the club is always monitoring top young talent for the future.\n\n## Financial Situation\n\nThanks to the new stadium sponsorship deal and increased matchday revenue, Barcelona are in a stronger financial position than previous years. However, FFP regulations mean the club must be strategic with their spending.\n\n## Our Verdict\n\nExpect 2-3 quality signings rather than a squad overhaul. Barcelona's philosophy under the current management is clear: develop young talent and supplement with targeted acquisitions.",
      contentEs: "El mercado de fichajes de verano es siempre una época emocionante para los aficionados del Barcelona. Aquí echamos un vistazo a los jugadores que el Barça tiene supuestamente en su radar.\n\n## Refuerzos para el mediocampo\n\nCon la media de edad del centro del campo siendo una de las más bajas de Europa, el Barcelona sigue buscando añadir experiencia y calidad. Varios mediocampistas top de la Premier League y la Serie A han sido vinculados con un posible traspaso al Camp Nou.\n\n## Opciones en defensa\n\nLa defensa ha sido sólida esta temporada, pero la profundidad de banquillo sigue siendo una preocupación. Un central versátil capaz de sacar el balón jugado desde atrás es supuestamente una prioridad.\n\n## Y la delantera?\n\nEl ataque del Barcelona ha sido el más goleador de Europa esta temporada. Aunque no hay una necesidad urgente de incorporaciones, el club siempre está monitorizando jóvenes talentos de primer nivel para el futuro.\n\n## Situación económica\n\nGracias al nuevo acuerdo de patrocinio del estadio y el aumento de los ingresos por día de partido, el Barcelona se encuentra en una posición financiera más fuerte que en años anteriores. Sin embargo, las regulaciones del Fair Play Financiero obligan al club a ser estratégico con sus gastos.\n\n## Nuestra valoración\n\nEspera 2-3 fichajes de calidad en lugar de una revolución de la plantilla. La filosofía del Barcelona bajo la dirección actual es clara: desarrollar jóvenes talentos y complementar con fichajes puntuales.",
      category: "transfers",
      tags: ["transfers", "summer-window", "rumors", "squad"],
      metaTitle: "Barcelona Transfer Targets Summer 2026",
      metaTitleEs: "Objetivos de fichaje del Barcelona para el verano 2026",
      metaDescription: "Who are FC Barcelona targeting this summer? Analysis of the top transfer targets, financial situation, and predicted signings.",
      metaDescriptionEs: "A quién quiere fichar el FC Barcelona este verano? Análisis de los principales objetivos, situación financiera y fichajes previstos.",
    },
    {
      slug: "match-report-barca-dominates",
      title: "Match Report: Barcelona Put on a Show with Dominant Home Win",
      titleEs: "Crónica: El Barcelona ofrece un recital con una victoria contundente en casa",
      excerpt: "Barça delivered a masterclass in attacking football with a comprehensive victory at the Spotify Camp Nou.",
      excerptEs: "El Barça ofreció una exhibición de fútbol ofensivo con una victoria contundente en el Spotify Camp Nou.",
      content: "FC Barcelona put on a dazzling display of attacking football as they cruised to a comfortable victory at the Spotify Camp Nou in front of a packed house.\n\n## First Half\n\nBarcelona started on the front foot and never let up. From the opening whistle, the home side pressed high and moved the ball with incredible speed and precision. The first goal came in the 23rd minute, a beautiful team move involving 18 passes.\n\n## Second Half\n\nThe second half was more of the same. Barcelona's relentless pressing suffocated the opposition, and two more goals followed in quick succession. The Camp Nou was bouncing.\n\n## Key Takeaways\n\nThis performance showed why Barcelona are the favorites for the league title. The pressing, the passing, the movement — everything was at the highest level. The fans played their part too, creating an atmosphere that intimidated the visitors from the start.\n\n## Player Ratings\n\nThe entire team deserves praise, but the midfield was particularly outstanding. The control they exerted over the match was reminiscent of the greatest Barcelona teams of the past.\n\n## What's Next\n\nBarça now turn their attention to the Champions League, where they face Bayern Munich next week. If they play like they did today, they'll be a match for anyone in Europe.",
      contentEs: "El FC Barcelona ofreció una exhibición deslumbrante de fútbol ofensivo arrollando a su rival con una cómoda victoria en el Spotify Camp Nou ante un lleno absoluto.\n\n## Primera parte\n\nEl Barcelona salió al ataque desde el primer minuto y no aflojó en ningún momento. Desde el pitido inicial, el equipo local presionó en campo contrario y movió el balón con una velocidad y precisión increíbles. El primer gol llegó en el minuto 23, con una preciosa jugada colectiva de 18 toques.\n\n## Segunda parte\n\nLa segunda mitad fue más de lo mismo. La presión implacable del Barcelona asfixió al rival, y dos goles más llegaron en rápida sucesión. El Camp Nou se venía abajo.\n\n## Claves del partido\n\nEsta actuación demostró por qué el Barcelona es el favorito para el título de Liga. La presión, el pase, el movimiento — todo estuvo al más alto nivel. La afición también puso de su parte, creando una atmósfera que intimidó al visitante desde el principio.\n\n## Puntuaciones de los jugadores\n\nTodo el equipo merece elogios, pero el centro del campo estuvo particularmente brillante. El control que ejercieron sobre el partido recordó a los mejores Barcelonas de la historia.\n\n## Lo que viene\n\nEl Barça ahora centra su atención en la Champions League, donde se enfrenta al Bayern de Múnich la próxima semana. Si juegan como lo hicieron hoy, podrán competir contra cualquiera en Europa.",
      category: "matchday",
      tags: ["match-report", "la-liga", "home-win", "camp-nou"],
      metaTitle: "Match Report: Barcelona Dominant Home Win | Camp Nou",
      metaTitleEs: "Crónica: Victoria dominante del Barcelona en el Camp Nou",
      metaDescription: "Full match report of Barcelona's dominant home victory at Camp Nou. Player ratings, key moments, and analysis.",
      metaDescriptionEs: "Crónica completa de la contundente victoria del Barcelona en el Camp Nou. Puntuaciones, momentos clave y análisis.",
    },
    {
      slug: "history-of-el-clasico",
      title: "The Complete History of El Clásico: Barcelona vs Real Madrid",
      titleEs: "La historia completa de El Clásico: Barcelona vs Real Madrid",
      excerpt: "A deep dive into the greatest rivalry in football — the history, greatest moments, and legends of El Clásico.",
      excerptEs: "Un análisis en profundidad de la mayor rivalidad del fútbol — la historia, los mejores momentos y las leyendas de El Clásico.",
      content: "El Clásico — the name alone sends shivers down the spine of football fans worldwide. The rivalry between FC Barcelona and Real Madrid transcends sport. It's cultural, political, and deeply personal.\n\n## Origins\n\nThe first official match between Barcelona and Real Madrid took place on May 13, 1902. Since then, the two clubs have faced each other over 250 times, creating one of the most storied rivalries in sports history.\n\n## The Political Dimension\n\nMore than any other football rivalry, El Clásico carries political weight. Barcelona represents Catalan identity and pride, while Real Madrid is seen as the establishment club of the Spanish capital. During the Franco era, this tension reached its peak.\n\n## Greatest Moments\n\nFrom the 5-0 in 2010 to Di Stéfano's era, from Cruyff's transformation of Barcelona to Messi's countless masterclasses — El Clásico has produced some of football's most iconic moments.\n\n## The Modern Era\n\nThe Messi vs Ronaldo years elevated El Clásico to unprecedented global attention. Now, a new generation of stars carries the torch, and the rivalry remains as fierce and compelling as ever.\n\n## Experiencing El Clásico at Camp Nou\n\nThere is simply nothing in football that compares to being at Camp Nou for El Clásico. The noise, the passion, the mosaic displays — it's an experience every football fan should have at least once in their lifetime.",
      contentEs: "El Clásico — solo el nombre pone la piel de gallina a los aficionados al fútbol de todo el mundo. La rivalidad entre el FC Barcelona y el Real Madrid trasciende el deporte. Es cultural, política y profundamente personal.\n\n## Orígenes\n\nEl primer partido oficial entre el Barcelona y el Real Madrid se disputó el 13 de mayo de 1902. Desde entonces, ambos clubes se han enfrentado más de 250 veces, creando una de las rivalidades más legendarias de la historia del deporte.\n\n## La dimensión política\n\nMás que cualquier otra rivalidad futbolística, El Clásico tiene un peso político. El Barcelona representa la identidad y el orgullo catalán, mientras que el Real Madrid es visto como el club del establishment de la capital española. Durante la era de Franco, esta tensión alcanzó su punto álgido.\n\n## Los mejores momentos\n\nDesde el 5-0 de 2010 hasta la era de Di Stéfano, desde la transformación del Barcelona por Cruyff hasta las incontables exhibiciones de Messi — El Clásico ha producido algunos de los momentos más icónicos del fútbol.\n\n## La era moderna\n\nLos años de Messi contra Ronaldo elevaron El Clásico a una atención global sin precedentes. Ahora, una nueva generación de estrellas toma el relevo, y la rivalidad sigue siendo tan feroz y apasionante como siempre.\n\n## Vivir El Clásico en el Camp Nou\n\nSencillamente no hay nada en el fútbol comparable a estar en el Camp Nou para El Clásico. El ruido, la pasión, los mosaicos — es una experiencia que todo aficionado al fútbol debería vivir al menos una vez en la vida.",
      category: "guide",
      tags: ["el-clasico", "history", "real-madrid", "guide"],
      metaTitle: "History of El Clásico: Barcelona vs Real Madrid | Complete Guide",
      metaTitleEs: "Historia de El Clásico: Barcelona vs Real Madrid | Guía completa",
      metaDescription: "The complete history of El Clásico. Greatest moments, legends, and why Barcelona vs Real Madrid is the biggest match in football.",
      metaDescriptionEs: "La historia completa de El Clásico. Mejores momentos, leyendas y por qué el Barcelona vs Real Madrid es el partido más grande del fútbol.",
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
