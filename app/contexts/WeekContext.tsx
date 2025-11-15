'use client';

import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  format,
  isAfter,
  isValid,
  parseISO,
  startOfISOWeek,
  startOfWeek,
} from 'date-fns';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { todayKey } from '../lib/date';
import { useStore } from '../store/useStore';

const ISO_WEEK_PATTERN = /^(\d{4})-(\d{2})$/;
const WEEK_OPTIONS = { weekStartsOn: 1 as const };

interface WeekContextValue {
  readonly selectedDate: string;
  readonly activeDate: Date;
  readonly activeWeekStart: Date;
  readonly activeWeekEnd: Date;
  readonly activeDayIndex: number;
  readonly weekOffset: number;
  readonly isCurrentWeek: boolean;
  setSelectedDate: (date: string) => void;
  setWeekOffset: (updater: number | ((previous: number) => number)) => void;
  goToToday: () => void;
}

const WeekContext = createContext<WeekContextValue | undefined>(undefined);

function parseDateKey(value: string | undefined, fallback: Date): Date {
  if (!value) {
    return fallback;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : fallback;
}

function parseWeekParam(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const match = ISO_WEEK_PATTERN.exec(value.trim());
  if (!match) return undefined;
  const yearStr = match[1];
  const weekStr = match[2];
  if (!yearStr || !weekStr) return undefined;
  const isoYear = Number.parseInt(yearStr, 10);
  const isoWeek = Number.parseInt(weekStr, 10);
  if (!Number.isFinite(isoYear) || !Number.isFinite(isoWeek) || isoWeek < 1 || isoWeek > 53) {
    return undefined;
  }
  const januaryFourth = new Date(Date.UTC(isoYear, 0, 4));
  const isoWeekStart = startOfISOWeek(januaryFourth);
  const target = addWeeks(isoWeekStart, isoWeek - 1);
  return new Date(target.getFullYear(), target.getMonth(), target.getDate());
}

function formatWeekParam(weekStart: Date): string {
  return format(weekStart, 'RRRR-II');
}

export function WeekProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const storeSelectedDate = useStore((state) => state.selectedDate);
  const setStoreSelectedDate = useStore((state) => state.setSelectedDate);

  const todayKeyValue = todayKey();
  const today = useMemo(() => parseISO(todayKeyValue), [todayKeyValue]);
  const currentWeekStart = useMemo(() => startOfWeek(today, WEEK_OPTIONS), [today]);

  const weekParam = searchParams?.get('week') ?? null;
  const hydratedWeekStart = useMemo(() => parseWeekParam(weekParam), [weekParam]);
  const storedDate = useMemo(() => parseDateKey(storeSelectedDate, today), [storeSelectedDate, today]);

  const [selectedDate, setSelectedDateState] = useState(() => {
    if (hydratedWeekStart) {
      const storedWeekStart = startOfWeek(storedDate, WEEK_OPTIONS);
      const dayIndex = Math.min(
        Math.max(differenceInCalendarDays(storedDate, storedWeekStart), 0),
        6
      );
      const hydratedDate = addDays(hydratedWeekStart, dayIndex);
      const hydratedWeekOffset = differenceInCalendarWeeks(
        startOfWeek(hydratedDate, WEEK_OPTIONS),
        currentWeekStart,
        WEEK_OPTIONS
      );
      const safeDate =
        hydratedWeekOffset === 0 && isAfter(hydratedDate, today) ? today : hydratedDate;
      return format(safeDate, 'yyyy-MM-dd');
    }
    return format(storedDate, 'yyyy-MM-dd');
  });

  const syncingStore = useRef(false);
  const syncingSearchParams = useRef(false);

  useEffect(() => {
    if (storeSelectedDate === selectedDate) {
      return;
    }
    if (syncingStore.current) {
      syncingStore.current = false;
      return;
    }
    syncingStore.current = true;
    setStoreSelectedDate(selectedDate);
  }, [selectedDate, setStoreSelectedDate, storeSelectedDate]);

  useEffect(() => {
    const currentWeekParam = formatWeekParam(startOfWeek(parseISO(selectedDate), WEEK_OPTIONS));
    if (weekParam === currentWeekParam) {
      return;
    }
    syncingSearchParams.current = true;
    const nextParams = new URLSearchParams(searchParams?.toString());
    nextParams.set('week', currentWeekParam);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }, [searchParams, selectedDate, router, pathname, weekParam]);

  useEffect(() => {
    if (!syncingSearchParams.current) {
      const paramWeekStart = parseWeekParam(weekParam);
      if (paramWeekStart) {
        const activeDate = parseISO(selectedDate);
        const activeWeekStart = startOfWeek(activeDate, WEEK_OPTIONS);
        const dayIndex = Math.min(
          Math.max(differenceInCalendarDays(activeDate, activeWeekStart), 0),
          6
        );
        const weekOffset = differenceInCalendarWeeks(paramWeekStart, currentWeekStart, WEEK_OPTIONS);
        const candidate = addDays(paramWeekStart, dayIndex);
        const safeCandidate =
          weekOffset === 0 && isAfter(candidate, today) ? today : candidate;
        const nextDateKey = format(safeCandidate, 'yyyy-MM-dd');
        if (nextDateKey !== selectedDate) {
          // Synchronize the local selected date with the week query parameter.
          // React hooks linter warns about state updates inside effects, but this
          // update intentionally mirrors external URL state changes.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSelectedDateState(() => nextDateKey);
        }
      }
    }
    syncingSearchParams.current = false;
  }, [currentWeekStart, selectedDate, today, weekParam]);

  const activeDate = useMemo(() => parseDateKey(selectedDate, today), [selectedDate, today]);
  const activeWeekStart = useMemo(
    () => startOfWeek(activeDate, WEEK_OPTIONS),
    [activeDate]
  );
  const activeWeekEnd = useMemo(() => addDays(activeWeekStart, 6), [activeWeekStart]);
  const activeDayIndex = useMemo(
    () => Math.min(Math.max(differenceInCalendarDays(activeDate, activeWeekStart), 0), 6),
    [activeDate, activeWeekStart]
  );
  const weekOffset = useMemo(
    () =>
      differenceInCalendarWeeks(activeWeekStart, currentWeekStart, WEEK_OPTIONS),
    [activeWeekStart, currentWeekStart]
  );

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
  }, []);

  const setWeekOffset = useCallback<WeekContextValue['setWeekOffset']>(
    (updater) => {
      const currentOffset = weekOffset;
      const nextOffset = Math.min(
        typeof updater === 'function' ? updater(currentOffset) : updater,
        0
      );
      if (nextOffset === currentOffset) {
        return;
      }
      const nextWeekStart = addWeeks(currentWeekStart, nextOffset);
      const candidate = addDays(nextWeekStart, activeDayIndex);
      const safeCandidate =
        nextOffset === 0 && isAfter(candidate, today) ? today : candidate;
      setSelectedDateState(format(safeCandidate, 'yyyy-MM-dd'));
    },
    [activeDayIndex, currentWeekStart, today, weekOffset]
  );

  const goToToday = useCallback(() => {
    setSelectedDateState(todayKeyValue);
  }, [todayKeyValue]);

  const value = useMemo<WeekContextValue>(
    () => ({
      selectedDate,
      activeDate,
      activeWeekStart,
      activeWeekEnd,
      activeDayIndex,
      weekOffset,
      isCurrentWeek: weekOffset >= 0,
      setSelectedDate,
      setWeekOffset,
      goToToday,
    }),
    [
      activeDate,
      activeDayIndex,
      activeWeekEnd,
      activeWeekStart,
      selectedDate,
      setSelectedDate,
      setWeekOffset,
      weekOffset,
      goToToday,
    ]
  );

  return <WeekContext.Provider value={value}>{children}</WeekContext.Provider>;
}

export function useWeekContext(): WeekContextValue {
  const context = useContext(WeekContext);
  if (!context) {
    throw new Error('useWeekContext must be used within a WeekProvider');
  }
  return context;
}
