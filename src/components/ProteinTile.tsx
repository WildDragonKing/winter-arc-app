import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { calculateProteinGoal } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';

function ProteinTile() {
  const { t } = useTranslation();
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];
  const currentProtein = activeTracking?.protein || 0;

  const proteinGoal = user?.weight ? calculateProteinGoal(user.weight) : 150;

  const addProtein = () => {
    const amount = parseInt(inputValue);
    if (!isNaN(amount) && amount > 0) {
      updateDayTracking(activeDate, {
        protein: currentProtein + amount,
      });
      setInputValue('');
      setShowInput(false);
    }
  };

  const progress = Math.min((currentProtein / proteinGoal) * 100, 100);

  return (
    <div className="glass-dark touchable p-3 text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xl">🥩</div>
          <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t('tracking.protein')}
          </h3>
        </div>
        <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
          {currentProtein}g
        </div>
      </div>

      <div className="mb-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-right text-gray-500 dark:text-gray-400">
          {Math.round(progress)}% / {proteinGoal}g
        </div>
      </div>

      {showInput ? (
        <div className="flex gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addProtein()}
            placeholder='g'
            className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            autoFocus
          />
          <button
            onClick={addProtein}
            className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-xs"
          >
            +
          </button>
          <button
            onClick={() => {
              setShowInput(false);
              setInputValue('');
            }}
            className="px-2 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xs"
          >
            x
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="w-full px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-medium text-xs"
        >
          {t('tracking.addProtein')}
        </button>
      )}
    </div>
  );
}

export default ProteinTile;
