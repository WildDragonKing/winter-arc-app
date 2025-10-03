import { useStore } from '../store/useStore';
import WeekOverview from '../components/WeekOverview';
import PushupTile from '../components/PushupTile';
import SportTile from '../components/SportTile';
import WaterTile from '../components/WaterTile';
import ProteinTile from '../components/ProteinTile';
import WeightTile from '../components/WeightTile';
import { useState, useEffect } from 'react';
import { generateDailyMotivation } from '../services/aiService';
import { getAIQuote, saveAIQuote, setAIQuoteFeedback, QuoteTimePeriod, AIQuote } from '../services/aiQuoteService';
import { getWeatherForAachen } from '../services/weatherService';


import { useTranslation } from '../hooks/useTranslation';
import { useTracking } from '../hooks/useTracking';

function DashboardPage() {
  const user = useStore((state) => state.user);
  // tracking wird nur für Motivation geladen, nicht für Header
  const tracking = useStore((state) => state.tracking);

  const { t } = useTranslation();
  // Auto-save tracking data to Firebase
  useTracking();
  const [motivation, setMotivation] = useState<AIQuote | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [weather, setWeather] = useState<{ temperature: number; emoji: string; description: string } | null>(null);









  useEffect(() => {
    const loadMotivation = async () => {
      if (!user) return;
      // Warte, bis Tracking-Daten geladen sind (mind. 1 Key)
      if (!tracking || Object.keys(tracking).length === 0) return;
      setLoadingQuote(true);
      try {
        // Wetter laden
        const weatherData = await getWeatherForAachen();
        if (weatherData) {
          setWeather({
            temperature: weatherData.temperature,
            emoji: weatherData.weatherEmoji,
            description: weatherData.weatherDescription,
          });
        }
        // Zeitfenster bestimmen
        const hour = new Date().getHours();
        let period: QuoteTimePeriod = 'morning';
        if (hour >= 12 && hour < 18) period = 'noon';
        else if (hour >= 18 || hour < 6) period = 'evening';

        // Quote aus Firestore laden
        const firestoreQuote = await getAIQuote(user.id, period);
        const today = new Date().toISOString().split('T')[0];
        if (firestoreQuote && firestoreQuote.updatedAt?.slice(0, 10) === today) {
          setMotivation(firestoreQuote);
          setFeedback(firestoreQuote.feedback?.[user.id] || null);
          setLoadingQuote(false);
          return;
        }

        // Wetter-Kontext
        const weatherContext = weatherData
          ? `Weather: ${weatherData.temperature}°C, ${weatherData.weatherDescription}`
          : '';
        // Neue Quote generieren
        const result = await generateDailyMotivation(tracking, user.nickname, user.birthday, weatherContext);
        const newQuote: AIQuote = {
          quote: result.quote,
          subtext: result.subtext,
          period,
          updatedAt: new Date().toISOString(),
          feedback: {},
        };
        await saveAIQuote(user.id, period, newQuote);
        setMotivation(newQuote);
        setFeedback(null);
      } catch (error) {
        console.error('Error loading motivation:', error);
      } finally {
        setLoadingQuote(false);
      }
    };
    loadMotivation();
  }, [user, tracking]);

  return (
    <div className="min-h-screen-mobile safe-pt pb-20">
      {/* Header + AI Quote */}
      <div className="relative text-white px-4 py-6 md:px-6 md:py-8">
        <div className="mobile-container relative z-10">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
            <div className="flex-1 flex items-center gap-3 min-w-0">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.nickname}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border-2 border-white/30 dark:border-white/30 border-gray-300 shadow-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <h1 className="text-3xl font-bold truncate text-gray-900 dark:text-white">
                {t('dashboard.greeting', { nickname: user?.nickname || 'User' })}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {weather && (
                <div className="glass-dark px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 min-w-[60px] justify-center">
                  <span>{weather.emoji}</span>
                  <span>{weather.temperature}°C</span>
                </div>
              )}
            </div>
          </div>
          {/* AI Motivation Quote */}
          <div className="glass-dark touchable animate-fade-in-up p-6 text-white relative transition-all duration-200 hover:bg-white/5 hover:dark:bg-white/10">
            <div className="flex items-start gap-3">
              <div className="text-3xl">💡</div>
              <div className="flex-1">
                {loadingQuote ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-white/20 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-white/20 rounded w-full"></div>
                  </div>
                ) : motivation ? (
                  <>
                    <div className="text-lg whitespace-pre-line mb-1 line-clamp-2">
                      {motivation.quote}
                    </div>
                    {motivation.subtext && (
                      <p className="text-winter-100 text-sm mb-2">{motivation.subtext}</p>
                    )}
                    {/* Feedback-Buttons klein unten rechts */}
                    <div className="absolute right-2 bottom-2 flex gap-1 items-center text-xs opacity-80">
                      <button
                        className={`px-1 py-0.5 rounded-full text-base border border-gray-300 dark:border-white/20 ${feedback === 'up' ? 'bg-green-500/80 text-white' : 'bg-white/40 dark:bg-white/10 hover:bg-green-500/30'}`}
                        disabled={!!feedback || !user}
                        onClick={async () => {
                          if (!motivation || !user) return;
                          setFeedback('up');
                          await setAIQuoteFeedback(user.id, motivation.period, user.id, 'up');
                        }}
                        title="Gefällt mir"
                      >👍</button>
                      <button
                        className={`px-1 py-0.5 rounded-full text-base border border-gray-300 dark:border-white/20 ${feedback === 'down' ? 'bg-red-500/80 text-white' : 'bg-white/40 dark:bg-white/10 hover:bg-red-500/30'}`}
                        disabled={!!feedback || !user}
                        onClick={async () => {
                          if (!motivation || !user) return;
                          setFeedback('down');
                          await setAIQuoteFeedback(user.id, motivation.period, user.id, 'down');
                        }}
                        title="Gefällt mir nicht"
                      >👎</button>
                      {feedback && <span className="ml-2">Feedback gespeichert</span>}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
  </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-6 pt-4">
        {/* Week Overview */}
        <div className="animate-fade-in-up delay-100 mb-4">
          <WeekOverview />
        </div>

        {/* Tracking Tiles */}
        <div className="space-y-4 animate-fade-in-up delay-300">
          {/* Pushups & Sport Side by Side - 2 columns on mobile */}
          <div className="grid grid-cols-2 gap-3">
            <PushupTile />
            <SportTile />
          </div>

          {/* Water & Protein Grid - 2 columns on mobile */}
          <div className="grid grid-cols-2 gap-3">
            <WaterTile />
            <ProteinTile />
          </div>

          {/* Weight - full width */}
          <WeightTile />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
