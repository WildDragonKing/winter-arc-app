import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { calculateWaterGoal } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';

function WaterTile() {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const isToday = activeDate === todayKey;
  const activeTracking = tracking[activeDate];
  const currentWater = activeTracking?.water || 0;

  const displayDayLabel = isToday
    ? t('tracking.today')
    : format(new Date(activeDate), 'dd.MM.');

  const waterGoal = user?.weight ? calculateWaterGoal(user.weight) : 3000;

  const addWater = (amount: number) => {
    updateDayTracking(activeDate, {
      water: currentWater + amount,
    });
  };

  const progress = Math.min((currentWater / waterGoal) * 100, 100);
  const liters = (currentWater / 1000).toFixed(2);
  const goalLiters = (waterGoal / 1000).toFixed(2);

  return (
    <div className="glass-dark touchable p-3 text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xl">💧</div>
          <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t('tracking.water')}
          </h3>
        </div>
        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
          {liters}L
        </div>
      </div>

      <div className="mb-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-right text-gray-500 dark:text-gray-400">
          {Math.round(progress)}% / {goalLiters}L
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[250, 500, 1000].map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => addWater(amount)}
            className="px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-xs"
          >
            +{amount}
          </button>
        ))}
      </div>
    </div>
  );
}

export default WaterTile;
