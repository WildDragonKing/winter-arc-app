import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DailyTracking } from '../types';
import { calculateStreak } from '../utils/calculations';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Cache configuration

// Time periods for quote generation (3x daily)



interface UserTrackingStats {
  currentStreak: number;
  totalPushups: number;
  sportSessions: number;
  avgWater: number;
  avgProtein: number;
  recentWeight?: number;
  lastWorkoutDate?: string;
  completedToday: boolean;
}

function analyzeTrackingData(tracking: Record<string, DailyTracking>): UserTrackingStats {
  const trackingDates = Object.keys(tracking).sort();
  const today = new Date().toISOString().split('T')[0];

  const totalPushups = Object.values(tracking).reduce(
    (sum, day) => sum + (day.pushups?.total || 0),
    0
  );

  const sportSessions = Object.values(tracking).reduce(
    (sum, day) => sum + Object.values(day.sports || {}).filter(Boolean).length,
    0
  );

  const waterEntries = Object.values(tracking).filter(day => day.water > 0);
  const avgWater = waterEntries.length > 0
    ? waterEntries.reduce((sum, day) => sum + day.water, 0) / waterEntries.length
    : 0;

  const proteinEntries = Object.values(tracking).filter(day => day.protein > 0);
  const avgProtein = proteinEntries.length > 0
    ? proteinEntries.reduce((sum, day) => sum + day.protein, 0) / proteinEntries.length
    : 0;

  const currentStreak = calculateStreak(trackingDates);

  // Get most recent weight
  const weightEntries = Object.entries(tracking)
    .filter(([_, day]) => day.weight && day.weight.value > 0)
    .sort(([a], [b]) => b.localeCompare(a));

  const recentWeight = weightEntries.length > 0 ? weightEntries[0][1].weight?.value : undefined;
  const lastWorkoutDate = trackingDates.length > 0 ? trackingDates[trackingDates.length - 1] : undefined;
  const completedToday = tracking[today]?.completed || false;

  return {
    currentStreak,
    totalPushups,
    sportSessions,
    avgWater,
    avgProtein,
    recentWeight,
    lastWorkoutDate,
    completedToday,
  };
}

export async function generateDailyMotivation(
  tracking: Record<string, DailyTracking>,
  nickname: string,
  birthday?: string,
  weatherContext?: string
): Promise<{ quote: string; subtext: string }> {
  try {
    // Nur Tracking-Daten der letzten 7 Tage verwenden
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    const trackingLast7: Record<string, DailyTracking> = {};
    for (const date of last7Days) {
      if (tracking[date]) trackingLast7[date] = tracking[date];
    }
    // Debug: Logge alle AI-relevanten Userdaten für das Prompt
    console.log('[AI PROMPT DEBUG] Userdaten für Motivation (letzte 7 Tage):', {
      nickname,
      birthday,
      weatherContext,
      tracking: trackingLast7,
    });

    // Prompt-Variablen vorbereiten
    const now = new Date();
    const isoDatetime = now.toISOString();
    const weatherInfo = weatherContext || '';
    const stats = analyzeTrackingData(trackingLast7);
    const todayReps = trackingLast7[now.toISOString().split('T')[0]]?.pushups?.workout?.reps;

    // Prompt-Variablen vorbereiten
    // (bereits oben deklariert)

    // Prompt-String deklarieren
    // Feedback-Kontext (letzte 7 Feedbacks, falls vorhanden)
    let feedbackHistory: any[] = [];
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('ai_feedback_history');
      if (raw) {
        try {
          feedbackHistory = JSON.parse(raw);
        } catch {}
      }
    }

    const prompt = `Schreibe eine kurze, motivierende Nachricht in maximal 2 Zeilen, basierend auf Streak, heutigen Aufgaben und Protein/Wasser-Fortschritt. Direkt, positiv, ohne Floskeln.

Daten:
${JSON.stringify({
  nickname,
  weatherContext: weatherInfo,
  stats: {
    currentStreak: stats.currentStreak,
    completedToday: stats.completedToday,
    avgWater: Math.round(stats.avgWater),
    avgProtein: Math.round(stats.avgProtein),
    today: todayReps ? { reps: todayReps } : undefined,
  },
  timeContext: isoDatetime,
}, null, 2)}

Anweisungen:
- Maximal 2 Zeilen, kurz und prägnant
- Keine Emojis, kein Fettdruck, keine Aufzählungen
- Beziehe Streak, heutige Aufgaben (completedToday), Wasser/Protein ein
- Direkt und motivierend
- Auf Deutsch

Ausgabe:
Nur der Text, maximal 2 Zeilen.`;

    // Prompt an Google Generative AI senden
    // Nur Gemini 2.5 Flash verwenden
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = result.response;
      // Entferne doppelte Leerzeilen im Output
      let text = response.text().trim();
      text = text.replace(/\n{3,}/g, '\n\n');
      return {
        quote: text,
        subtext: '',
      };
    } catch (err) {
      throw err;
    }
  } catch (error) {
    console.error('[AI PROMPT ERROR]', error);
    return {
      quote: 'Fehler beim Generieren der Motivation.',
      subtext: '',
    };
  }
}
