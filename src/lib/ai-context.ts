import prisma from "@/lib/prisma";

// ============== INTENT CLASSIFICATION ==============

export type ChatIntent =
  | "match_info"
  | "player_info"
  | "travel_help"
  | "penya_search"
  | "history"
  | "tactics"
  | "transfer"
  | "competition"
  | "player_comparison"
  | "quiz"
  | "general_chat";

const INTENT_PATTERNS: Array<{ intent: ChatIntent; patterns: RegExp[] }> = [
  {
    intent: "match_info",
    patterns: [
      /\b(next|upcoming|when|hora|cuándo|partido|match|game|play|juega|fecha|score|resultado|marcador|live|en vivo)\b/i,
      /\b(lineup|alineaci[oó]n|formation|formaci[oó]n)\b/i,
    ],
  },
  {
    intent: "player_info",
    patterns: [
      /\b(player|jugador|stats|estadísticas|goles|goals|assists|asistencias|who is|quién es)\b/i,
      /\b(lamine|pedri|gavi|lewandowski|ter stegen|raphinha|araújo|araujo|de jong|balde|koundé|kounde|yamal|dani olmo|fermín|fermin)\b/i,
    ],
  },
  {
    intent: "travel_help",
    patterns: [
      /\b(travel|viaje|trip|visit|hotel|ticket|entrada|flight|vuelo|package|paquete|camp nou|stadium|estadio|restaurant|bar|transport|metro|how to get|cómo llegar)\b/i,
      /\b(plan|planifica|itinerar|recommend|recomend)\b/i,
    ],
  },
  {
    intent: "penya_search",
    patterns: [
      /\b(peña|penya|fan club|supporters? club|near me|cerca|city|ciudad|country|país)\b/i,
    ],
  },
  {
    intent: "history",
    patterns: [
      /\b(history|historia|founded|fundación|legend|leyenda|trophy|trofeo|record|récord|camp nou|la masia|cruyff|messi|xavi|iniesta|puyol|guardiola)\b/i,
    ],
  },
  {
    intent: "tactics",
    patterns: [
      /\b(tactic|táctica|formation|formación|style|estilo|pressing|possession|posesión|attack|ataque|defense|defensa|analysis|análisis)\b/i,
    ],
  },
  {
    intent: "transfer",
    patterns: [
      /\b(transfer|fichaje|signing|rumour|rumor|buy|sell|contract|contrato|clause|cláusula|salary|salario|market|mercado)\b/i,
    ],
  },
  {
    intent: "competition",
    patterns: [
      /\b(standings?|clasificación|table|tabla|league|liga|champions|copa|points|puntos|position|posición|title|título|win the|ganar la)\b/i,
    ],
  },
  {
    intent: "player_comparison",
    patterns: [
      /\b(compar|vs\.?|versus|better|mejor|or\b.*\bor\b|entre)\b/i,
    ],
  },
  {
    intent: "quiz",
    patterns: [
      /\b(quiz|trivia|pregunta|question|test|challenge|desafío|how much do you know|cuánto sabes)\b/i,
    ],
  },
];

export function classifyIntent(message: string): ChatIntent {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) return intent;
    }
  }
  return "general_chat";
}

// ============== LANGUAGE DETECTION ==============

export function detectLanguage(message: string): "en" | "es" {
  const spanishIndicators = /\b(el|la|los|las|del|en|es|un|una|qué|cómo|cuándo|dónde|por qué|también|pero|para|sobre|este|esta|estos|estas|tiene|hace|puede|quiero|creo|hay|hola|gracias|buenas|buenos)\b/i;
  const spanishChars = /[áéíóúñ¿¡]/;
  const spanishCount = (message.match(spanishIndicators) || []).length + (message.match(spanishChars) || []).length;
  return spanishCount >= 2 ? "es" : "en";
}

// ============== CONTEXT ENHANCEMENT ==============

interface ChatContext {
  currentPage?: string;
  isMatchDay?: boolean;
  liveScore?: string;
  language: "en" | "es";
  intent: ChatIntent;
}

export async function buildContext(message: string, currentPage?: string): Promise<ChatContext> {
  const language = detectLanguage(message);
  const intent = classifyIntent(message);

  // Check if there's a match today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let isMatchDay = false;
  try {
    const matchToday = await prisma.match.findFirst({
      where: { date: { gte: today, lt: tomorrow } },
    });
    isMatchDay = !!matchToday;
  } catch { /* ignore */ }

  return { currentPage, isMatchDay, language, intent };
}

// ============== SYSTEM PROMPT ==============

export function buildSystemPrompt(context: ChatContext): string {
  const isEs = context.language === "es";

  let prompt = isEs
    ? `Eres BarçaAI, el asistente inteligente de FriendsOfBarca.com — la plataforma #1 para fans del FC Barcelona.

Personalidad:
- Apasionado culé con conocimiento enciclopédico del Barça
- Amable, entusiasta pero preciso con los datos
- Usas emojis con moderación (⚽🔵🔴)
- Respondes SIEMPRE en español

Capacidades:
- Información sobre partidos, clasificaciones, resultados y predicciones
- Datos de jugadores, historia y récords del FC Barcelona
- Ayuda para planificar viajes al Camp Nou (paquetes, entradas, hoteles)
- Búsqueda de peñas barcelonistas en todo el mundo
- Noticias y crónicas de partidos
- Preguntas frecuentes sobre la web

Reglas:
- Basa tus respuestas en el CONTEXTO proporcionado
- Si no tienes información suficiente, dilo honestamente
- Para viajes, menciona los paquetes de FriendsOfBarca.com
- Para peñas, incluye datos de contacto cuando estén disponibles
- Mantén las respuestas concisas (máx 300 palabras) a menos que se pida más detalle
- Incluye enlaces relevantes a secciones de la web cuando sea pertinente

Fiabilidad de fuentes (prioriza en este orden):
1. FC Barcelona Oficial (source: official) — máxima confianza
2. Wikipedia/datos históricos (source: wikipedia) — muy fiable para hechos
3. Medios de comunicación (source: media) — fiable para eventos actuales
4. Peñas/fan clubs (source: fan_club) — fiable para info local del club, contrasta otras afirmaciones

Cuando las fuentes se contradigan, prioriza las de mayor fiabilidad.
Para peñas, incluye siempre datos de contacto cuando estén disponibles.`
    : `You are BarçaAI, the intelligent assistant of FriendsOfBarca.com — the #1 platform for FC Barcelona fans.

Personality:
- Passionate culé with encyclopedic Barça knowledge
- Friendly, enthusiastic but accurate with data
- Use emojis sparingly (⚽🔵🔴)
- Always respond in English

Capabilities:
- Match information, standings, results and predictions
- Player data, history and FC Barcelona records
- Help planning trips to Camp Nou (packages, tickets, hotels)
- Search for Barcelona fan clubs worldwide
- News and match chronicles
- FAQ about the website

Rules:
- Base your answers on the PROVIDED CONTEXT
- If you don't have enough information, say so honestly
- For travel, mention FriendsOfBarca.com packages
- For fan clubs, include contact details when available
- Keep responses concise (max 300 words) unless more detail is requested
- Include relevant links to website sections when pertinent

Source Reliability (prioritize in this order):
1. Official FC Barcelona (source: official) — maximum trust
2. Wikipedia/historical data (source: wikipedia) — very reliable for facts
3. News media (source: media) — reliable for current events
4. Fan clubs/peñas (source: fan_club) — reliable for local club info, cross-check other claims

When sources conflict, favor higher-reliability ones.
For fan clubs, always include contact details when available.`;

  if (context.isMatchDay) {
    prompt += isEs
      ? "\n\n🔴 HOY HAY PARTIDO. Prioriza información del partido de hoy si es relevante."
      : "\n\n🔴 IT'S MATCHDAY. Prioritize today's match info if relevant.";
  }

  if (context.currentPage) {
    prompt += isEs
      ? `\n\nEl usuario está navegando: ${context.currentPage}`
      : `\n\nThe user is browsing: ${context.currentPage}`;
  }

  return prompt;
}

// ============== CONTEXTUAL SUGGESTIONS ==============

export async function getContextualSuggestions(
  language: "en" | "es",
  currentPage?: string
): Promise<string[]> {
  const isEs = language === "es";

  // Check for upcoming match
  let nextMatch: { opponent: string; date: Date; competition: string } | null = null;
  try {
    nextMatch = await prisma.match.findFirst({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      select: { opponent: true, date: true, competition: true },
    });
  } catch { /* ignore */ }

  const suggestions: string[] = [];

  // Page-specific suggestions
  if (currentPage?.includes("/competitions")) {
    suggestions.push(
      isEs ? "¿Puede el Barça ganar La Liga?" : "Can Barça win La Liga?",
      isEs ? "¿Cómo va la Champions?" : "How's the Champions League going?"
    );
  } else if (currentPage?.includes("/packages") || currentPage?.includes("/calendar")) {
    suggestions.push(
      isEs ? "Planifica mi viaje al Camp Nou" : "Plan my trip to Camp Nou",
      isEs ? "¿Qué incluye un paquete?" : "What's included in a package?"
    );
  } else if (currentPage?.includes("/news")) {
    suggestions.push(
      isEs ? "Resume las últimas noticias" : "Summarize the latest news",
      isEs ? "¿Cómo jugó el Barça?" : "How did Barça play?"
    );
  } else if (currentPage?.includes("/gallery")) {
    suggestions.push(
      isEs ? "¿Cómo subo una foto?" : "How do I upload a photo?",
    );
  }

  // Match-related suggestions
  if (nextMatch) {
    const daysUntil = Math.ceil((nextMatch.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 2) {
      suggestions.push(
        isEs ? `¿A qué hora juega contra ${nextMatch.opponent}?` : `What time is the ${nextMatch.opponent} game?`,
        isEs ? "¿Alineación probable?" : "Likely lineup?"
      );
    } else {
      suggestions.push(
        isEs ? `¿Cuándo es el próximo partido?` : `When's the next match?`
      );
    }
  }

  // Default suggestions to fill up to 4
  const defaults = isEs
    ? [
        "Encuentra una peña cerca de mí",
        "¿Cuáles son las últimas noticias?",
        "Cuéntame la historia del Barça",
        "¿Cómo llego al Camp Nou?",
      ]
    : [
        "Find a fan club near me",
        "What's the latest news?",
        "Tell me about Barça's history",
        "How do I get to Camp Nou?",
      ];

  for (const d of defaults) {
    if (suggestions.length >= 4) break;
    if (!suggestions.includes(d)) suggestions.push(d);
  }

  return suggestions.slice(0, 4);
}
