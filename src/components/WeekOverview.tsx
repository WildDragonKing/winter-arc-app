import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { calculateStreak } from '../utils/calculations';

function WeekOverview() {
  const { t, language } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const setSelectedDate = useStore((state) => state.setSelectedDate);

  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const locale = language === 'de' ? de : enUS;

  // Calculate streak
  const streak = calculateStreak(Object.keys(tracking));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTracking = tracking[dateStr];
    const isToday = isSameDay(date, today);
    const isSelected = dateStr === activeDate;

    // Check what's completed
    const hasPushups = (dayTracking?.pushups?.total || 0) > 0;
    const hasSports = Object.values(dayTracking?.sports || {}).some(Boolean);
    const hasWater = (dayTracking?.water || 0) >= 2000; // Goal: 2L
    const hasProtein = (dayTracking?.protein || 0) >= 100; // Goal: 100g
    const hasWeight = !!dayTracking?.weight?.value; // Weight entered

    const tasksCompleted = [hasPushups, hasSports, hasWater, hasProtein, hasWeight].filter(Boolean).length;
    const isCompleted = tasksCompleted >= 3; // At least 3 tasks for streak
    const isPartial = tasksCompleted > 0 && tasksCompleted < 3; // Some tasks done but not enough

    return {
      date,
      dateStr,
      dayName: format(date, 'EEE', { locale }),
      dayNumber: format(date, 'd'),
      isToday,
      isCompleted,
      isPartial,
      isSelected,
      hasPushups,
      hasSports,
      hasWater,
      hasProtein,
      hasWeight,
      tasksCompleted,
    };
  });



  return (
    <div className="glass-dark touchable p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.weekOverview')}
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('dashboard.tapToEdit')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-4xl">🔥</div>
          <div>
            <div className="text-3xl font-bold text-winter-600 dark:text-winter-400">
              {streak}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('dashboard.streak')}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('dashboard.streakInfo')} (3/5 {t('dashboard.tasks')})
      </div>

      {/* Week Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          // Circle styling based on status
          let circleClasses = 'h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all cursor-pointer';

          if (day.isCompleted) {
            circleClasses += ' bg-emerald-500 text-white shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]';
          } else if (day.isPartial) {
            circleClasses += ' ring-2 ring-amber-400 text-amber-200 bg-slate-700/40';
          } else {
            circleClasses += ' bg-slate-700/40 text-slate-400';
          }

          if (day.isToday) {
            circleClasses += ' ring-2 ring-sky-400';
          }

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelectedDate(day.dateStr)}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {day.dayName}
              </span>
              <div className={circleClasses}>
                {day.dayNumber}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WeekOverview;
