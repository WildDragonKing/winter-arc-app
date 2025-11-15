'use client';

import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { getTileClasses, designTokens } from '../theme/tokens';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';
import { formatMl, getPercent, resolveWaterGoal } from '../utils/progress';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from './ui/AppModal';
import EditIcon from './ui/EditIcon';

const sanitizeMlValue = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.round(numeric);
};

const parseWaterInput = (value: string): number | null => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(',', '.');
  const numeric = Number.parseFloat(normalized.replace(/[^0-9.]/g, ''));

  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  if (normalized.includes('l') || (normalized.includes('.') && numeric <= 25)) {
    return Math.round(numeric * 1000);
  }

  return Math.round(numeric);
};

function HydrationTile() {
  const { t, language } = useTranslation();
  const [showManualModal, setShowManualModal] = useState(false);
  const [exactValue, setExactValue] = useState('');
  const manualInputRef = useRef<HTMLInputElement>(null);

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];
  const combinedTracking = useCombinedDailyTracking(activeDate);
  const manualWater = sanitizeMlValue(activeTracking?.water);
  const totalWater = sanitizeMlValue(combinedTracking?.water ?? manualWater);

  // Check if there are smart contributions (from notes)
  // Inline calculation to avoid React Compiler memoization warning
  const smartWater = (combinedTracking?.water ?? 0) - manualWater;
  const hasSmartContributions = smartWater > 0;

  const waterGoal = Math.max(resolveWaterGoal(user), 0);
  const percent = getPercent(totalWater, waterGoal);
  const localeCode = language === 'de' ? 'de-DE' : 'en-US';
  const liters = `${formatMl(totalWater, { locale: localeCode, maximumFractionDigits: 2 })}L`;
  const goalLiters = `${formatMl(waterGoal, { locale: localeCode, maximumFractionDigits: 2 })}L`;
  const isTracked = totalWater >= 1000; // mindestens 1L


  const setExactWater = () => {
    const amount = parseWaterInput(exactValue);
    if (amount === null) {
      return;
    }

    updateDayTracking(activeDate, {
      water: amount,
    });
    setExactValue('');
    setShowManualModal(false);
  };

  return (
    <>
      <div className={`relative ${getTileClasses(isTracked)} ${designTokens.padding.compact} text-white`}>
        {/* Edit Icon */}
        <EditIcon
          onClick={() => {
            setExactValue(manualWater ? manualWater.toString() : '');
            setShowManualModal(true);
          }}
          ariaLabel={t('tracking.edit')}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-2 pr-12">
          <div className="flex items-center gap-2">
            <div className="text-xl">💧</div>
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('tracking.hydration')}
            </h3>
          </div>
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {liters}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 text-center">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {percent}% / {goalLiters}
          </div>
        </div>

        {/* Hints */}
        {hasSmartContributions && (
          <div className="text-[10px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <span>🔗</span>
              <span>{t('hydration.hintSmartContributions')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Modal */}
      <AppModal
        open={showManualModal}
        onClose={() => {
          setShowManualModal(false);
          setExactValue('');
        }}
        title={t('tracking.hydration')}
        subtitle={t('tracking.setExactAmount')}
        icon={<span className="text-2xl">💧</span>}
        size="sm"
        initialFocusRef={manualInputRef}
        footer={
          <>
            <ModalSecondaryButton
              onClick={() => {
                setShowManualModal(false);
                setExactValue('');
              }}
            >
              {t('tracking.cancel')}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={setExactWater} disabled={!exactValue}>
              {t('tracking.save')}
            </ModalPrimaryButton>
          </>
        }
      >
        <input
          ref={manualInputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={exactValue}
          onChange={(e) => {
            setExactValue(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Enter' && setExactWater()}
          placeholder="ml / L"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </AppModal>
    </>
  );
}

export default HydrationTile;

