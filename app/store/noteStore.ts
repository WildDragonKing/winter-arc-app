import Dexie, { Table } from 'dexie';
import { deleteSmartNote as deleteRemoteSmartNote, fetchAllSmartNotes, upsertSmartNote } from '../services/smartNoteService';
import { SmartNote, WorkoutEvent } from '../types/events';

const FALLBACK_KEY = 'smart_notes_fallback';

class SmartNoteDexie extends Dexie {
  smart_notes!: Table<SmartNote>;

  constructor() {
    super('winter_arc_smart_notes');
    this.version(1).stores({
      smart_notes: 'id, ts',
    });
  }
}

function isDexieAvailable() {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

const db = isDexieAvailable()
  ? new SmartNoteDexie()
  : null;

type NotesListener = () => void;

const listeners = new Set<NotesListener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function readFallback(): SmartNote[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SmartNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallback(notes: SmartNote[]) {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(notes));
  } catch (error) {
    console.warn('Failed to persist smart notes fallback', error);
  }
}

async function putNote(note: SmartNote): Promise<void> {
  if (db) {
    await db.smart_notes.put(note);
    return;
  }
  const notes = readFallback();
  const existingIndex = notes.findIndex((n) => n.id === note.id);
  if (existingIndex >= 0) {
    notes.splice(existingIndex, 1, note);
  } else {
    notes.unshift(note);
  }
  notes.sort((a, b) => b.ts - a.ts);
  writeFallback(notes);
}

async function getNote(id: string): Promise<SmartNote | undefined> {
  if (db) {
    return db.smart_notes.get(id);
  }
  return readFallback().find((note) => note.id === id);
}

async function deleteNote(id: string): Promise<void> {
  if (db) {
    await db.smart_notes.delete(id);
    return;
  }
  const notes = readFallback().filter((note) => note.id !== id);
  writeFallback(notes);
}

async function fetchNotes(limit: number, cursor?: number): Promise<SmartNote[]> {
  if (db) {
    if (cursor) {
      return db.smart_notes
        .where('ts')
        .below(cursor)
        .reverse()
        .limit(limit)
        .toArray();
    }
    return db.smart_notes.orderBy('ts').reverse().limit(limit).toArray();
  }
  const notes = readFallback();
  const filtered = cursor ? notes.filter((note) => note.ts < cursor) : notes;
  return filtered.slice(0, limit);
}

// Helper to get current user ID from NextAuth session (client-side only)
async function getCurrentUserId(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Use NextAuth session endpoint to get current user
    const response = await fetch('/api/auth/session');
    if (!response.ok) {
      return null;
    }
    const session = await response.json();
    return session?.user?.id || null;
  } catch (error) {
    console.warn('Unable to fetch session, skipping remote persistence.', error);
    return null;
  }
}

function hasPendingAttachmentUpload(note: SmartNote): boolean {
  return (note.attachments ?? []).some((attachment) => attachment.url.startsWith('data:') || !attachment.storagePath);
}

async function persistRemote(note: SmartNote): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.warn('Skipping remote smart note persistence (no authenticated user).');
    return;
  }

  try {
    const saved = await upsertSmartNote(userId, note);
    if (hasPendingAttachmentUpload(note)) {
      await putNote(saved);
      emit();
    }
  } catch (error) {
    console.warn('Failed to persist smart note remotely', error);
  }
}

async function removeRemote(note: SmartNote | undefined): Promise<void> {
  if (!note) return;

  const userId = await getCurrentUserId();
  if (!userId) {
    console.warn('Skipping remote smart note removal (no authenticated user).');
    return;
  }

  try {
    await deleteRemoteSmartNote(userId, note);
  } catch (error) {
    console.warn('Failed to delete smart note remotely', error);
  }
}

function filterToday(notes: SmartNote[]): SmartNote[] {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTime = startOfDay.getTime();
  return notes.filter((note) => note.ts >= startTime);
}

function sumEvents(notes: SmartNote[]) {
  const aggregates = {
    waterMl: 0,
    proteinG: 0,
    pushups: 0,
    workoutsBySport: {} as Record<WorkoutEvent['sport'], number>,
    isRestDay: false,
    lastWeightKg: undefined as number | undefined,
    lastBfpPercent: undefined as number | undefined,
  };

  for (const note of notes) {
    if (note.pending) continue;
    for (const event of note.events) {
      if (event.confidence < 0.5) continue;
      switch (event.kind) {
        case 'drink':
          aggregates.waterMl += event.volumeMl;
          break;
        case 'protein':
          aggregates.proteinG += event.grams;
          break;
        case 'pushups':
          aggregates.pushups += event.count;
          break;
        case 'workout': {
          const current = aggregates.workoutsBySport[event.sport] ?? 0;
          aggregates.workoutsBySport[event.sport] = current + 1;
          break;
        }
        case 'rest':
          aggregates.isRestDay = true;
          break;
        case 'weight':
          aggregates.lastWeightKg = event.kg;
          break;
        case 'bfp':
          aggregates.lastBfpPercent = event.percent;
          break;
        case 'food':
          if (typeof event.proteinG === 'number') {
            aggregates.proteinG += event.proteinG;
          }
          break;
        default:
          break;
      }
    }
  }

  return aggregates;
}

async function getAllNotes(): Promise<SmartNote[]> {
  if (db) {
    return db.smart_notes.orderBy('ts').reverse().toArray();
  }
  return readFallback();
}

export const noteStore = {
  async add(note: SmartNote) {
    await putNote(note);
    emit();
    void persistRemote(note);
  },
  async update(id: string, patch: Partial<SmartNote>) {
    const existing = await getNote(id);
    if (!existing) return;
    const updated: SmartNote = {
      ...existing,
      ...patch,
    };
    await putNote(updated);
    emit();
    void persistRemote(updated);
  },
  async remove(id: string) {
    const existing = await getNote(id);
    await deleteNote(id);
    emit();
    void removeRemote(existing);
  },
  async list({ cursor, limit = 20 }: { cursor?: number; limit?: number }) {
    const results = await fetchNotes(limit + 1, cursor);
    const notes = results.slice(0, limit);
    const hasMore = results.length > limit;
    const nextCursor = hasMore ? notes[notes.length - 1]?.ts : undefined;
    return { notes, nextCursor, hasMore };
  },
  async getRecent(limit = 5) {
    if (db) {
      return db.smart_notes.orderBy('ts').reverse().limit(limit).toArray();
    }
    return readFallback().slice(0, limit);
  },
  async get(id: string) {
    return getNote(id);
  },
  async all() {
    return getAllNotes();
  },
  async todayAggregates() {
    const notes = filterToday(await getAllNotes());
    return sumEvents(notes);
  },
  async syncFromRemote() {
    const userId = await getCurrentUserId();
    if (!userId) {
      return;
    }

    try {
      const remoteNotes = await fetchAllSmartNotes(userId);
      const remoteIds = new Set(remoteNotes.map((note) => note.id));

      for (const note of remoteNotes) {
        await putNote(note);
      }

      const localNotes = await getAllNotes();
      await Promise.all(
        localNotes
          .filter((note) => !remoteIds.has(note.id) && !note.pending)
          .map(async (note) => {
            await deleteNote(note.id);
          })
      );

      emit();
    } catch (error) {
      console.warn('Failed to sync smart notes from Firestore', error);
    }
  },
  subscribe(listener: NotesListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export type NoteStore = typeof noteStore;


