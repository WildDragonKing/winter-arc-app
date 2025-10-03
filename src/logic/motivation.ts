/**
 * Motivation Engine
 *
 * Generates personalized, time-aware motivational messages
 * based on user tracking stats and current context.
 *
 * Features:
 * - Time-based messages (morning, midday, evening)
 * - Stat-aware (streak, pushups, sports, water, protein)
 * - Variant pool with cooldown to prevent repetition
 * - Short, clear, pushy but positive tone
 */

export interface MotivationContext {
  // Time context
  hour: number; // 0-23
  dayOfWeek: number; // 0 (Sunday) - 6 (Saturday)

  // User stats
  streak: number; // Consecutive training days
  pushups: number; // Total pushups this week
  sportsCount: number; // Sports sessions this week
  waterIntake: number; // Water in ml today
  proteinIntake: number; // Protein in g today

  // Completion status
  completedToday: boolean;
  completedYesterday: boolean;
}

export interface MotivationMessage {
  title: string;
  body: string;
  cta?: string; // Call to action
}

type TimeOfDay = 'morning' | 'midday' | 'evening';
type MessageVariant = {
  title: string;
  body: string;
  cta?: string;
  weight?: number; // Higher weight = more likely to be selected
};

/**
 * Determine time of day based on hour
 */
function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'midday';
  return 'evening';
}

/**
 * Message pools for different contexts
 */
const MESSAGE_POOLS: Record<string, MessageVariant[]> = {
  // Morning messages
  'morning.fresh': [
    {
      title: '🌅 Guten Morgen, Champion!',
      body: 'Ein neuer Tag, eine neue Chance. Lass uns Gas geben!',
      cta: 'Jetzt starten',
    },
    {
      title: '☀️ Zeit für Greatness',
      body: 'Der frühe Vogel fängt den Wurm. Dein Körper wartet!',
      cta: 'Los geht\'s',
    },
    {
      title: '💪 Morning Grind',
      body: 'Während andere schlafen, baust du Momentum auf.',
      cta: 'Training starten',
    },
  ],

  'morning.streak': [
    {
      title: '🔥 {streak} Tage Streak!',
      body: 'Du bist auf Feuer. Lass den Streak nicht reißen!',
      cta: 'Streak halten',
    },
    {
      title: '⚡ {streak} Tage Unstoppable',
      body: 'Ohne Pause. Das ist echte Disziplin!',
      cta: 'Weitermachen',
    },
  ],

  // Midday messages
  'midday.reminder': [
    {
      title: '⏰ Halbzeit!',
      body: 'Der Tag ist halb rum. Hast du dein Training schon gemacht?',
      cta: 'Jetzt checken',
    },
    {
      title: '🎯 Stay on Track',
      body: 'Prokrastination ist der Feind. Action ist der Weg.',
      cta: 'Tracking öffnen',
    },
    {
      title: '💧 Hydration Check',
      body: '{water}ml getrunken. Ziel: 3000ml. Nachfüllen!',
      cta: 'Wasser tracken',
    },
  ],

  'midday.motivation': [
    {
      title: '🚀 Keep Pushing',
      body: 'Durchschnitt ist das Schlimmste. Du bist nicht durchschnittlich.',
      cta: 'Beweisen',
    },
    {
      title: '⚡ Energy Boost',
      body: 'Ein schnelles Workout gibt dir mehr Energie als Kaffee.',
      cta: 'Quick Session',
    },
  ],

  // Evening messages
  'evening.completion': [
    {
      title: '✅ Tag abschließen',
      body: 'Zeit für das Tages-Review. Hast du alles gegeben?',
      cta: 'Tracking checken',
    },
    {
      title: '🌙 Evening Grind',
      body: 'Gewinner beenden, was sie starten. Heute alles erledigt?',
      cta: 'Abschließen',
    },
  ],

  'evening.congrats': [
    {
      title: '🎉 Beast Mode!',
      body: 'Du hast heute alles abgehakt. Stolz verdient!',
      cta: 'Morgen weitermachen',
    },
    {
      title: '👑 King Shit',
      body: '{pushups} Pushups diese Woche. Du bist eine Maschine!',
    },
  ],

  // Low performance messages
  'lowperf.pushup': [
    {
      title: '💪 Pushup Time?',
      body: 'Diese Woche noch keine Pushups? Das geht besser!',
      cta: 'Jetzt starten',
      weight: 2,
    },
    {
      title: '🔥 Activate Beast Mode',
      body: 'Der Boden wartet. Zeig ihm, wer hier Boss ist.',
      cta: 'Pushups machen',
      weight: 2,
    },
  ],

  'lowperf.sports': [
    {
      title: '🏃 Move Your Ass',
      body: 'Nur {sports} Sessions diese Woche. Zeit für mehr!',
      cta: 'Sport tracken',
      weight: 2,
    },
  ],

  'lowperf.water': [
    {
      title: '💧 Dehydrated?',
      body: 'Nur {water}ml heute? Du bist keine Pflanze im Wasser-Sparmodus.',
      cta: 'Trinken!',
      weight: 2,
    },
  ],

  // Streak messages
  'streak.milestone': [
    {
      title: '🏆 {streak} Days Strong!',
      body: 'Du bist ein absoluter Warrior. Weiter so!',
    },
    {
      title: '🔥 {streak} Tage Streak Legend',
      body: 'Ohne Miss. Das ist Championship-Material!',
    },
  ],

  'streak.broken': [
    {
      title: '⚠️ Streak in Gefahr',
      body: 'Gestern verpasst? Heute doppelt Gas geben!',
      cta: 'Comeback starten',
      weight: 3,
    },
  ],
};

/**
 * Cooldown tracking to prevent message repetition
 */
const MESSAGE_HISTORY: string[] = [];
const MAX_HISTORY = 10;

function addToHistory(key: string) {
  MESSAGE_HISTORY.unshift(key);
  if (MESSAGE_HISTORY.length > MAX_HISTORY) {
    MESSAGE_HISTORY.pop();
  }
}

function wasRecentlyShown(key: string): boolean {
  return MESSAGE_HISTORY.includes(key);
}

/**
 * Select random variant from pool with weight consideration
 */
function selectVariant(pool: MessageVariant[]): MessageVariant {
  const totalWeight = pool.reduce((sum, v) => sum + (v.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (const variant of pool) {
    random -= variant.weight || 1;
    if (random <= 0) return variant;
  }

  return pool[pool.length - 1];
}

/**
 * Replace placeholders in message
 */
function replacePlaceholders(text: string, ctx: MotivationContext): string {
  return text
    .replace('{streak}', ctx.streak.toString())
    .replace('{pushups}', ctx.pushups.toString())
    .replace('{sports}', ctx.sportsCount.toString())
    .replace('{water}', ctx.waterIntake.toString())
    .replace('{protein}', ctx.proteinIntake.toString());
}

/**
 * Main function: Get motivation message based on context
 */
export function getMotivationMessage(ctx: MotivationContext): MotivationMessage {
  const timeOfDay = getTimeOfDay(ctx.hour);

  // Priority 1: Streak broken or at risk
  if (!ctx.completedYesterday && ctx.streak > 0) {
    const pool = MESSAGE_POOLS['streak.broken'];
    const variant = selectVariant(pool);
    addToHistory('streak.broken');
    return {
      title: replacePlaceholders(variant.title, ctx),
      body: replacePlaceholders(variant.body, ctx),
      cta: variant.cta,
    };
  }

  // Priority 2: Celebrate streak milestone
  if (ctx.streak > 0 && ctx.streak % 7 === 0 && !wasRecentlyShown('streak.milestone')) {
    const pool = MESSAGE_POOLS['streak.milestone'];
    const variant = selectVariant(pool);
    addToHistory('streak.milestone');
    return {
      title: replacePlaceholders(variant.title, ctx),
      body: replacePlaceholders(variant.body, ctx),
      cta: variant.cta,
    };
  }

  // Priority 3: Low performance alerts
  if (ctx.pushups === 0 && timeOfDay === 'midday' && !wasRecentlyShown('lowperf.pushup')) {
    const pool = MESSAGE_POOLS['lowperf.pushup'];
    const variant = selectVariant(pool);
    addToHistory('lowperf.pushup');
    return {
      title: replacePlaceholders(variant.title, ctx),
      body: replacePlaceholders(variant.body, ctx),
      cta: variant.cta,
    };
  }

  if (ctx.sportsCount < 2 && timeOfDay === 'evening' && !wasRecentlyShown('lowperf.sports')) {
    const pool = MESSAGE_POOLS['lowperf.sports'];
    const variant = selectVariant(pool);
    addToHistory('lowperf.sports');
    return {
      title: replacePlaceholders(variant.title, ctx),
      body: replacePlaceholders(variant.body, ctx),
      cta: variant.cta,
    };
  }

  if (ctx.waterIntake < 1500 && timeOfDay === 'midday' && !wasRecentlyShown('lowperf.water')) {
    const pool = MESSAGE_POOLS['lowperf.water'];
    const variant = selectVariant(pool);
    addToHistory('lowperf.water');
    return {
      title: replacePlaceholders(variant.title, ctx),
      body: replacePlaceholders(variant.body, ctx),
      cta: variant.cta,
    };
  }

  // Priority 4: Completed today - congrats
  if (ctx.completedToday && timeOfDay === 'evening' && !wasRecentlyShown('evening.congrats')) {
    const pool = MESSAGE_POOLS['evening.congrats'];
    const variant = selectVariant(pool);
    addToHistory('evening.congrats');
    return {
      title: replacePlaceholders(variant.title, ctx),
      body: replacePlaceholders(variant.body, ctx),
      cta: variant.cta,
    };
  }

  // Default: Time-based messages
  let poolKey = '';
  if (timeOfDay === 'morning') {
    poolKey = ctx.streak >= 3 && !wasRecentlyShown('morning.streak')
      ? 'morning.streak'
      : 'morning.fresh';
  } else if (timeOfDay === 'midday') {
    poolKey = ctx.waterIntake < 2000 && !wasRecentlyShown('midday.reminder')
      ? 'midday.reminder'
      : 'midday.motivation';
  } else {
    poolKey = !ctx.completedToday && !wasRecentlyShown('evening.completion')
      ? 'evening.completion'
      : 'morning.fresh'; // Fallback to morning fresh
  }

  const pool = MESSAGE_POOLS[poolKey];
  const variant = selectVariant(pool);
  addToHistory(poolKey);

  return {
    title: replacePlaceholders(variant.title, ctx),
    body: replacePlaceholders(variant.body, ctx),
    cta: variant.cta,
  };
}

/**
 * Clear message history (for testing)
 */
export function clearMessageHistory() {
  MESSAGE_HISTORY.length = 0;
}
