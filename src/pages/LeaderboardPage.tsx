import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { getGroupMembers, checkUserInTop3 } from '../services/firestoreService';
import { calculateStreak } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';
import { useWeeklyTop3 } from '../hooks/useWeeklyTop3';

function LeaderboardPage() {
  const { t, language } = useTranslation();
  const [filter, setFilter] = useState<'week' | 'month' | 'all'>('month');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTop3, setIsTop3] = useState(false);

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const locale = language === 'de' ? de : enUS;

  // Check weekly Top 3 snapshots
  useWeeklyTop3();

  // Calculate current user stats
  const userStats = useMemo(() => {
    const trackingDates = Object.keys(tracking).sort();
    const totalPushups = Object.values(tracking).reduce(
      (sum, day) => sum + (day.pushups?.total || 0),
      0
    );
    const sportSessions = Object.values(tracking).reduce(
      (sum, day) =>
        sum +
        Object.values(day.sports || {}).filter(Boolean).length,
      0
    );
    const streak = calculateStreak(trackingDates);

    return {
      totalPushups,
      sportSessions,
      streak,
    };
  }, [tracking]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!user?.groupCode) return;

      setLoading(true);
      try {
        const now = new Date();
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        switch (filter) {
          case 'week':
            startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
            endDate = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
            break;
          case 'month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'all':
            // Don't pass date range for all-time stats
            startDate = undefined;
            endDate = undefined;
            break;
        }

        const result = await getGroupMembers(user.groupCode, startDate, endDate);
        if (result.success && result.data) {
          setLeaderboardData(result.data);
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [user?.groupCode, filter]);

  // Check if current user is in Top 3
  useEffect(() => {
    const checkTop3Status = async () => {
      if (!user?.id || !user?.groupCode) return;
      const inTop3 = await checkUserInTop3(user.id, user.groupCode);
      setIsTop3(inTop3);
    };
    checkTop3Status();
  }, [user?.id, user?.groupCode]);

  // Sort leaderboard data
  const sortedLeaderboardData = useMemo(() => {
    if (!leaderboardData.length) return [];

    // Sort by total pushups in the filtered period, then by streak
    return [...leaderboardData].sort((a, b) => {
      if (b.totalPushups !== a.totalPushups) return b.totalPushups - a.totalPushups;
      return b.streak - a.streak;
    });
  }, [leaderboardData]);

  const now = new Date();

  // Week data
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Month data
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate offset for first day (0 = Monday, 6 = Sunday)
  const firstDayOffset = (monthStart.getDay() + 6) % 7;

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500';
      case 2:
        return 'bg-gray-400';
      case 3:
        return 'bg-orange-600';
      default:
        return 'bg-winter-600';
    }
  };

  return (
  <div className="min-h-screen glass-dark safe-area-inset-top">
      {/* Header */}
  <div className="glass-dark text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">👥 {t('group.title')}</h1>
          <p className="text-winter-100">{t('group.code')}: {user?.groupCode || t('group.none')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-20 space-y-4">
        {/* Filter Tabs */}
        <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-2 flex gap-2">
          {[
            { key: 'week' as const, label: t('group.week') },
            { key: 'month' as const, label: t('group.month') },
            { key: 'all' as const, label: t('group.all') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-winter-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2-Column Layout: Heatmap left, Rankings right (on md+) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Heatmap */}
          <div>
            {/* Week Heatmap - Only show in week view */}
            {filter === 'week' && (
          <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              {t('group.trainingWeek')} ({t('group.weekNumber')} {format(now, 'ww', { locale })})
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {daysInWeek.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTracking = tracking[dateStr];
                const isCurrentDay = isToday(day);

                // Calculate progress percentage
                const pushups = dayTracking?.pushups?.total || 0;
                const sports = Object.values(dayTracking?.sports || {}).filter(Boolean).length;
                const water = dayTracking?.water || 0;
                const protein = dayTracking?.protein || 0;
                const weight = dayTracking?.weight?.value || 0;
                const tasksCompleted = [
                  pushups > 0,
                  sports > 0,
                  water >= 2000,
                  protein >= 100,
                  weight > 0
                ].filter(Boolean).length;

                // Status: full (3-5), partial (1-2), empty (0)
                const isFull = tasksCompleted >= 3;
                const isPartial = tasksCompleted > 0 && tasksCompleted < 3;
                const isEmpty = tasksCompleted === 0;

                // Check if previous day is also complete for streak connection
                const prevDay = idx > 0 ? daysInWeek[idx - 1] : null;
                const prevDateStr = prevDay ? format(prevDay, 'yyyy-MM-dd') : '';
                const prevTracking = prevDateStr ? tracking[prevDateStr] : null;
                const prevTasksCompleted = prevTracking ? [
                  (prevTracking.pushups?.total || 0) > 0,
                  Object.values(prevTracking.sports || {}).some(Boolean),
                  (prevTracking.water || 0) >= 2000,
                  (prevTracking.protein || 0) >= 100,
                  !!prevTracking.weight?.value
                ].filter(Boolean).length : 0;
                const prevIsFull = prevTasksCompleted >= 3;
                const showStreakConnection = idx > 0 && isFull && prevIsFull;

                let circleClass = 'w-12 h-12 rounded-full flex items-center justify-center font-bold relative';
                if (isFull) {
                  circleClass += ' bg-emerald-500 text-white shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]';
                } else if (isPartial) {
                  circleClass += ' ring-2 ring-amber-400 text-amber-200 bg-slate-700/40';
                } else {
                  circleClass += ' bg-red-500/60 text-white';
                }

                return (
                  <div key={`week-${dateStr}`} className="flex flex-col items-center gap-1 relative">
                    {/* Streak connection line */}
                    {showStreakConnection && (
                      <div className="absolute top-[calc(50%+0.5rem)] right-[calc(50%+1.5rem)] w-8 h-0.5 bg-emerald-400/50 z-0" />
                    )}

                    {/* Day label */}
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {format(day, 'EEE', { locale })}
                    </div>

                    {/* Circle */}
                    <div className={circleClass}>
                      {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Month Heatmap - Only show in month view */}
        {filter === 'month' && (
          <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              {t('group.trainingHeatmap')} ({format(now, 'MMMM yyyy', { locale })})
            </h2>
            <div className="grid grid-cols-7 gap-0.5 max-w-sm">
              {(language === 'de' ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pb-0.5"
                >
                  {day}
                </div>
              ))}
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`offset-month-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTracking = tracking[dateStr];
              const isCurrentDay = isToday(day);

              // Calculate progress percentage
              const pushups = dayTracking?.pushups?.total || 0;
              const sports = Object.values(dayTracking?.sports || {}).filter(Boolean).length;
              const water = dayTracking?.water || 0;
              const protein = dayTracking?.protein || 0;
              const weight = dayTracking?.weight?.value || 0;

              // Progress: 20% per category (pushups, sports, water, protein, weight)
              const progress = (
                (pushups > 0 ? 20 : 0) +
                (sports > 0 ? 20 : 0) +
                (water >= 2000 ? 20 : 0) +
                (protein >= 100 ? 20 : 0) +
                (weight > 0 ? 20 : 0)
              );

              return (
                <div
                  key={`month-${dateStr}`}
                  className="aspect-square flex items-center justify-center relative"
                >
                  {/* Progress Circle (50% size) */}
                  <svg className="w-1/2 h-1/2 -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className={`${
                        isSameMonth(day, monthStart)
                          ? 'stroke-gray-200 dark:stroke-gray-700'
                          : 'stroke-gray-100 dark:stroke-gray-800'
                      }`}
                      strokeWidth="4"
                    />
                    {/* Progress circle */}
                    {progress > 0 && (
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className={`${
                          isCurrentDay
                            ? 'stroke-winter-500'
                            : 'stroke-winter-400'
                        }`}
                        strokeWidth="4"
                        strokeDasharray={`${progress} 100`}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  {/* Day number */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                      isCurrentDay
                        ? 'text-winter-600 dark:text-winter-400'
                        : isSameMonth(day, monthStart)
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-300 dark:text-gray-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
          </div>

          {/* Right: Rankings */}
          <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('group.rankings')}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('common.loading')}
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('group.noMembers')}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedLeaderboardData.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = user?.nickname === entry.nickname;
              // Fallback falls userId fehlt: nutze index
              const key = entry.userId || `entry-${index}`;
              return (
                <div
                  key={key}
                  className={`p-4 rounded-xl transition-all cursor-pointer ${
                    isCurrentUser
                      ? 'bg-winter-100 dark:bg-winter-900 ring-2 ring-winter-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() =>
                    setSelectedUser(
                      selectedUser === entry.userId ? null : entry.userId
                    )
                  }
                >
                  <div className="flex items-center gap-4">
                    {/* Profile Picture - always show with default fallback */}
                    {(entry.shareProfilePicture || isCurrentUser) && entry.photoURL ? (
                      <img
                        src={entry.photoURL}
                        alt={entry.nickname}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover flex-shrink-0"
                        onError={(e) => {
                          // Replace with default avatar on error
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.nickname)}&background=random&size=96`;
                        }}
                      />
                    ) : (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(entry.nickname)}&background=random&size=96`}
                        alt={entry.nickname}
                        className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover flex-shrink-0"
                      />
                    )}

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {entry.nickname}
                        {isCurrentUser && (
                          <span className="text-xs bg-winter-500 text-white px-2 py-0.5 rounded">
                            {t('group.you')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{entry.streak} {t('group.daysStreak')} 🔥</span>
                        <span>•</span>
                        <span>💪 {entry.dailyPushups || 0} {t('group.today')}</span>
                      </div>
                    </div>

                    {/* Rank Badge on the right - always shown */}
                    <div
                      className={`w-10 h-10 rounded-full ${getRankColor(
                        rank
                      )} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                    >
                      #{rank}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedUser === entry.userId && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-2xl mb-1">💪</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {entry.totalPushups}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('group.pushups')}
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl mb-1">🏃</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {entry.sportSessions}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('group.sportSessions')}
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl mb-1">💧</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {(entry.avgWater / 1000).toFixed(1)}L
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('group.avgWater')}
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl mb-1">🥩</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {entry.avgProtein}g
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('group.avgProtein')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
          </div>
        </div>

        {/* Achievements - Full Width */}
        <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🏅 {t('group.achievements')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: '🔥',
                label: t('group.achievement7Days'),
                locked: userStats.streak < 7
              },
              {
                icon: '💪',
                label: t('group.achievement1000'),
                locked: userStats.totalPushups < 1000
              },
              {
                icon: '🏃',
                label: t('group.achievement20Workouts'),
                locked: userStats.sportSessions < 20
              },
              {
                icon: '⭐',
                label: t('group.achievementTop3'),
                locked: !isTop3
              },
            ].map((achievement) => (
              <div
                key={achievement.label}
                className={`p-4 rounded-xl text-center ${
                  achievement.locked
                    ? 'bg-gray-100 dark:bg-gray-700 opacity-50'
                    : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <div className="text-xs font-medium">{achievement.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
