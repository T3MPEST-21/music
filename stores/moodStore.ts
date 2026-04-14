import { create } from 'zustand';
import { storage } from '@/utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Mood {
    id: string;
    name: string;
    icon: string;   // valid Ionicons name
    color: string;  // hex
    isDefault?: boolean; // default moods cannot be deleted
}

// ─── Default Moods ────────────────────────────────────────────────────────────

const DEFAULT_MOODS: Mood[] = [
    { id: 'mood_energetic', name: 'Energetic', icon: 'flash',          color: '#f39c12', isDefault: true },
    { id: 'mood_calm',      name: 'Calm',      icon: 'leaf',           color: '#1abc9c', isDefault: true },
    { id: 'mood_focus',     name: 'Focus',     icon: 'telescope',      color: '#3498db', isDefault: true },
    { id: 'mood_workout',   name: 'Workout',   icon: 'barbell',        color: '#e74c3c', isDefault: true },
    { id: 'mood_sad',       name: 'Melancholic',icon: 'rainy',         color: '#8e44ad', isDefault: true },
    { id: 'mood_sleepy',    name: 'Sleepy',    icon: 'moon',           color: '#2c3e50', isDefault: true },
    { id: 'mood_party',     name: 'Party',     icon: 'musical-notes',  color: '#e91e63', isDefault: true },
];

// ─── Persistence ──────────────────────────────────────────────────────────────

const MOODS_KEY = 'moods_v1';
const MOOD_MAP_KEY = 'mood_map_v1';

function loadMoods(): Mood[] {
    try {
        const json = storage.getString(MOODS_KEY);
        if (json) return JSON.parse(json);
    } catch {}
    return DEFAULT_MOODS;
}

function loadTrackMoodMap(): Record<string, string[]> {
    try {
        const json = storage.getString(MOOD_MAP_KEY);
        if (json) return JSON.parse(json);
    } catch {}
    return {};
}

function persistMoods(moods: Mood[]) {
    storage.set(MOODS_KEY, JSON.stringify(moods));
}

function persistTrackMoodMap(map: Record<string, string[]>) {
    storage.set(MOOD_MAP_KEY, JSON.stringify(map));
}

function generateId(): string {
    return `mood_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface MoodState {
    moods: Mood[];
    // trackMoodMap[trackId] = [moodId, moodId, ...]
    trackMoodMap: Record<string, string[]>;

    addMood: (mood: Omit<Mood, 'id'>) => Mood;
    deleteMood: (moodId: string) => void;
    tagTrack: (trackId: string, moodId: string) => void;
    untagTrack: (trackId: string, moodId: string) => void;
    setTrackMoods: (trackId: string, moodIds: string[]) => void;
    setBulkTrackMoods: (trackIds: string[], moodIds: string[]) => void;
    getTrackMoods: (trackId: string) => Mood[];
    getMoodTrackIds: (moodId: string) => string[];
    getTaggedTrackCount: (moodId: string) => number;
}

export const useMoodStore = create<MoodState>((set, get) => ({
    moods: loadMoods(),
    trackMoodMap: loadTrackMoodMap(),

    addMood: (mood) => {
        const newMood: Mood = { ...mood, id: generateId() };
        set(state => {
            const updated = [...state.moods, newMood];
            persistMoods(updated);
            return { moods: updated };
        });
        return newMood;
    },

    deleteMood: (moodId) => {
        set(state => {
            // Remove mood from moods list
            const updatedMoods = state.moods.filter(m => m.id !== moodId);

            // Remove this moodId from every track's tag list
            const updatedMap: Record<string, string[]> = {};
            for (const [trackId, moodIds] of Object.entries(state.trackMoodMap)) {
                const filtered = moodIds.filter(id => id !== moodId);
                if (filtered.length > 0) {
                    updatedMap[trackId] = filtered;
                }
            }

            persistMoods(updatedMoods);
            persistTrackMoodMap(updatedMap);
            return { moods: updatedMoods, trackMoodMap: updatedMap };
        });
    },

    tagTrack: (trackId, moodId) => {
        set(state => {
            const current = state.trackMoodMap[trackId] || [];
            if (current.includes(moodId)) return state; // already tagged
            const updated = { ...state.trackMoodMap, [trackId]: [...current, moodId] };
            persistTrackMoodMap(updated);
            return { trackMoodMap: updated };
        });
    },

    untagTrack: (trackId, moodId) => {
        set(state => {
            const current = state.trackMoodMap[trackId] || [];
            const next = current.filter(id => id !== moodId);
            const updated = { ...state.trackMoodMap };
            if (next.length === 0) {
                delete updated[trackId];
            } else {
                updated[trackId] = next;
            }
            persistTrackMoodMap(updated);
            return { trackMoodMap: updated };
        });
    },

    setTrackMoods: (trackId, moodIds) => {
        set(state => {
            const updated = { ...state.trackMoodMap };
            if (moodIds.length === 0) {
                delete updated[trackId];
            } else {
                updated[trackId] = moodIds;
            }
            persistTrackMoodMap(updated);
            return { trackMoodMap: updated };
        });
    },

    setBulkTrackMoods: (trackIds, moodIds) => {
        set(state => {
            const updated = { ...state.trackMoodMap };
            trackIds.forEach(id => {
                if (moodIds.length === 0) {
                    delete updated[id];
                } else {
                    updated[id] = moodIds;
                }
            });
            persistTrackMoodMap(updated);
            return { trackMoodMap: updated };
        });
    },

    getTrackMoods: (trackId) => {
        const { moods, trackMoodMap } = get();
        const moodIds = trackMoodMap[trackId] || [];
        return moodIds.map(id => moods.find(m => m.id === id)).filter(Boolean) as Mood[];
    },

    getMoodTrackIds: (moodId) => {
        const { trackMoodMap } = get();
        return Object.entries(trackMoodMap)
            .filter(([, moodIds]) => moodIds.includes(moodId))
            .map(([trackId]) => trackId);
    },

    getTaggedTrackCount: (moodId) => {
        return get().getMoodTrackIds(moodId).length;
    },
}));
