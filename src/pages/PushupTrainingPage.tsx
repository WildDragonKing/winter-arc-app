import { useState, useEffect } from 'react';
import { generateDailyMotivation } from '../services/aiService';
import { saveDailyTracking } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import {
  generateProgressivePlan,
  getLastPushupTotal,
  countPushupDays,
  calculateTotalReps,
  evaluateWorkout,
} from '../utils/pushupAlgorithm';

function PushupTrainingPage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const [currentSet, setCurrentSet] = useState(0);
  const [reps, setReps] = useState<number[]>([]);
  const [currentReps, setCurrentReps] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;

  // Generate training plan
  const lastTotal = getLastPushupTotal(tracking);
  const daysCompleted = countPushupDays(tracking);
  const initialTotal = lastTotal > 0 ? lastTotal : Math.round((user?.maxPushups || 20) * 2.5);
  const plan = generateProgressivePlan(initialTotal, daysCompleted);
  const plannedTotal = calculateTotalReps(plan);

  const restTime = 90; // 90 seconds rest

  // Disable body scroll on mount, restore on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Rest timer
  useEffect(() => {
    if (restTimeLeft > 0) {
      const timer = setTimeout(() => setRestTimeLeft(restTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [restTimeLeft]);

  const handleTap = () => {
    if (restTimeLeft > 0) return;
    setCurrentReps(currentReps + 1);
    // Vibrate on tap if supported
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleCompleteSet = async () => {
    const newReps = [...reps, currentReps];
    setReps(newReps);
    setCurrentReps(0);

    if (newReps.length < 5) {
      // Next set - start rest
      setCurrentSet(currentSet + 1);
      setRestTimeLeft(restTime);
    } else {
      // Training complete
      setIsComplete(true);
      const total = calculateTotalReps(newReps);

      const prevPushups = tracking[activeDate]?.pushups || {};
      const planState = user?.pushupState || { baseReps: 10, sets: 5, restTime: 90 };
      const { status } = evaluateWorkout(planState, newReps);
      const newTracking = {
        ...tracking[activeDate],
        pushups: {
          ...prevPushups,
          total,
          workout: {
            reps: newReps,
            status,
            timestamp: new Date(),
          },
        },
      };
      updateDayTracking(activeDate, newTracking);
      if (user?.id) {
        saveDailyTracking(user.id, activeDate, newTracking);
      }

      // Log AI prompt
      if (user) {
        try {
          await generateDailyMotivation(tracking, user.nickname, user.birthday, 'PushupTraining Abschluss');
        } catch (e) {
          console.warn('AI Prompt Log error:', e);
        }
      }
    }
  };

  const adjustRestTime = (seconds: number) => {
    setRestTimeLeft(Math.max(0, restTimeLeft + seconds));
  };

  const handleFinish = () => {
    navigate('/');
  };

  // Completion screen
  if (isComplete) {
    const totalReps = calculateTotalReps(reps);
    const plannedReps = plannedTotal;
    const performance = ((totalReps / plannedReps) * 100).toFixed(0);
    const planState = user?.pushupState || { baseReps: 10, sets: 5, restTime: 90 };
    const { status } = evaluateWorkout(planState, reps);

    let statusText = '';
    let statusColor = '';
    if (status === 'pass') {
      statusText = 'Pass 🔥';
      statusColor = 'text-green-500';
    } else if (status === 'hold') {
      statusText = 'Hold 💪';
      statusColor = 'text-amber-500';
    } else {
      statusText = 'Fail 🔄';
      statusColor = 'text-red-500';
    }

    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-8">
            <div className="text-7xl font-bold text-emerald-400 mb-4">
              {totalReps}
            </div>
            <div className="text-xl text-gray-300 mb-2">
              Liegestütze insgesamt
            </div>
            <div className={`text-3xl font-bold mb-4 ${statusColor}`}>
              {statusText}
            </div>
            <div className="text-lg text-gray-400">
              {performance}% des Plans ({plannedReps})
            </div>
          </div>

          {/* Set breakdown */}
          <div className="w-full max-w-md space-y-2 mb-8">
            {reps.map((rep, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <span className="text-gray-300">Satz {index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{rep}</span>
                  <span className="text-sm text-gray-500">/ {plan[index]}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleFinish}
            className="w-full max-w-md py-4 bg-emerald-500 text-white rounded-xl font-bold text-lg hover:bg-emerald-600 transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    );
  }

  // Training screen
  return (
    <div
      className="fixed inset-0 bg-gray-900 text-white flex flex-col overflow-hidden"
      style={{ touchAction: 'none' }}
      onTouchMove={(e) => e.preventDefault()}
    >
      {/* Header: Set chips */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-center gap-2 mb-2">
          {plan.map((targetReps, idx) => {
            const isActive = idx === currentSet;
            const isDone = idx < currentSet;
            return (
              <div
                key={idx}
                className={`px-4 py-2 rounded-full text-lg font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-sky-500 text-white ring-2 ring-sky-400'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {targetReps}
                {isDone && reps[idx] !== undefined && (
                  <span className="ml-1 text-xs">({reps[idx]})</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center text-sm text-gray-400">
          Satz {currentSet + 1} / 5
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {restTimeLeft > 0 ? (
          // Rest timer
          <div className="text-center">
            <div className="text-9xl font-bold text-sky-400 mb-6">
              {restTimeLeft}s
            </div>
            <div className="text-xl text-gray-300 mb-8">
              Pause läuft...
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => adjustRestTime(-5)}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                -5s
              </button>
              <button
                onClick={() => setRestTimeLeft(0)}
                className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => adjustRestTime(5)}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                +5s
              </button>
            </div>
          </div>
        ) : (
          // Counter
          <div className="w-full flex flex-col items-center">
            <div className="text-sm text-gray-400 mb-4">
              Ziel: {plan[currentSet]} Whd
            </div>
            <button
              onClick={handleTap}
              onTouchStart={handleTap}
              className="w-full h-44 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl flex items-center justify-center text-white active:scale-95 transition-transform shadow-2xl mb-6"
              style={{ touchAction: 'none', userSelect: 'none' }}
            >
              <div className="text-8xl font-bold">{currentReps}</div>
            </button>
            <button
              onClick={handleCompleteSet}
              disabled={currentReps === 0}
              className="w-full py-4 bg-sky-500 text-white rounded-xl font-bold text-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Satz abschließen
            </button>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 text-gray-400 hover:text-gray-200 text-sm"
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PushupTrainingPage;
