import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Capability,
    Event,
    RepeatMode,
    State
} from "react-native-track-player";
import { create } from "zustand";
import { Track } from "./libraryStore";
import { useThemeStore } from "./themeStore";

interface PlayerState {
    activeTrack: Track | null;
    isPlaying: boolean; // UI reflection — source of truth is TrackPlayer
    queue: Track[];
    repeatMode: RepeatMode;
    isShuffleOn: boolean;
    sleepTimerEndsAt: number | null;
    currentContextId: string | null;
    // Actions
    play: (track: Track, contextQueue?: Track[], contextId?: string) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    next: () => Promise<void>;
    previous: () => Promise<void>;
    setQueue: (tracks: Track[]) => Promise<void>;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    setupPlayer: () => Promise<void>;
    stop: () => Promise<void>;
    setSleepTimer: (minutes: number | null) => void;
    removeFromQueue: (trackId: string) => Promise<void>;
}

import { storage, StorageKeys } from '@/utils/storage';
import { createJSONStorage, persist } from 'zustand/middleware';

// Adapter for MMKV
const mmkvStorage = {
    getItem: (name: string) => storage.getString(name) || null,
    setItem: (name: string, value: string) => storage.set(name, value),
    removeItem: (name: string) => storage.remove(name),
};

let sleepTimeout: any = null;
let consecutiveErrors = 0;

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            activeTrack: null,
            isPlaying: false,
            queue: [],
            repeatMode: RepeatMode.Off,
            isShuffleOn: false,
            sleepTimerEndsAt: null,
            currentContextId: null,

            setupPlayer: async () => {
                // Initialize the player
                try {
                    await TrackPlayer.setupPlayer();
                    
                    // Sync initial repeat mode from persisted store
                    const initialRepeatMode = get().repeatMode;
                    await TrackPlayer.setRepeatMode(initialRepeatMode);
                    await TrackPlayer.updateOptions({
                        android: {
                            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
                        },
                        capabilities: [
                            Capability.Play,
                            Capability.Pause,
                            Capability.SkipToNext,
                            Capability.SkipToPrevious,
                            Capability.SeekTo,
                            Capability.Stop,
                        ],
                        compactCapabilities: [
                            Capability.Play,
                            Capability.Pause,
                            Capability.SkipToNext,
                            Capability.SkipToPrevious,
                            Capability.Stop,
                        ],
                    });

                    // Add central listeners
                    TrackPlayer.addEventListener(Event.PlaybackState, ({ state }) => {
                        set({ isPlaying: state === State.Playing });
                    });

                    TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async () => {
                        consecutiveErrors = 0; // Reset on successful track change
                        const index = await TrackPlayer.getActiveTrackIndex();
                        if (index !== undefined && index !== null) {
                            const track = await TrackPlayer.getTrack(index);
                            if (track) set({ activeTrack: track as any });
                        }
                    });

                    TrackPlayer.addEventListener(Event.PlaybackError, async (error) => {
                        console.error("[TrackPlayer] Playback Error:", error);
                        consecutiveErrors++;

                        if (consecutiveErrors < 5) {
                            // Instant graceful skip
                            await TrackPlayer.skipToNext();
                            await TrackPlayer.play();
                        } else {
                            // Catastrophic failure guard
                            console.warn("[TrackPlayer] Too many consecutive errors. Stopping.");
                            await TrackPlayer.reset();
                            set({ isPlaying: false, activeTrack: null });
                            consecutiveErrors = 0;
                            Alert.alert("Playback Error", "Failed to play multiple tracks. Please check your files.");
                        }
                    });

                    // Proactive Loop Fail-safe
                    TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
                        const { repeatMode, queue } = get();
                        if (repeatMode === RepeatMode.Queue && queue.length > 0) {
                            await TrackPlayer.skip(0);
                            await TrackPlayer.play();
                        }
                    });

                    // Restore queue to TrackPlayer if exists (from persistence)
                    const { queue, activeTrack } = get();
                    if (queue.length > 0) {
                        const trackPlayerQueue = queue.map(t => ({
                            id: t.id,
                            url: t.url,
                            title: t.title,
                            artist: t.artist,
                            duration: t.duration || 0,
                            artwork: t.artwork
                        }));
                        await TrackPlayer.add(trackPlayerQueue);

                        if (activeTrack) {
                            const index = trackPlayerQueue.findIndex(t => t.id === activeTrack.id);
                            if (index !== -1) {
                                await TrackPlayer.skip(index);
                            }
                        }
                    }

                    // Check for existing sleep timer
                    const { sleepTimerEndsAt, setSleepTimer } = get();
                    if (sleepTimerEndsAt) {
                        const now = Date.now();
                        const diff = sleepTimerEndsAt - now;
                        if (diff > 0) {
                            setSleepTimer(diff / 60000);
                        } else {
                            set({ sleepTimerEndsAt: null });
                        }
                    }

                } catch (e) {
                    // Player already setup or failed
                }
            },

            play: async (track: Track, contextQueue, contextId) => {
                const currentQueue = contextQueue || [track];

                // Safety: ensure setup has been called before any bridge commands
                try {
                    const status = await TrackPlayer.getPlaybackState();
                    if (status.state === State.None) {
                        await get().setupPlayer();
                    }
                } catch (e) {
                    await get().setupPlayer();
                }

                const prevContextId = get().currentContextId;

                // Apollo Smart Skip: same context → just seek, no bridge reset
                if (contextId && prevContextId === contextId) {
                    const index = currentQueue.findIndex(t => t.id === track.id);
                    if (index !== -1) {
                        consecutiveErrors = 0; // Manual play resets error counter
                        await TrackPlayer.skip(index);
                        await TrackPlayer.play();
                        set({ activeTrack: track, isPlaying: true });
                        return;
                    }
                }

                // Stage 1: Build the priority window synchronously (no bridge calls yet)
                // Find target index once, reuse it — avoid double scan on large libraries
                const targetIndex = currentQueue.findIndex(t => t.id === track.id);
                const startIndex = Math.max(0, targetIndex);
                const priorityWindow = currentQueue.slice(startIndex, startIndex + 21);

                const toTrackPlayer = (t: Track) => ({
                    id: t.id,
                    url: t.url,
                    title: t.title,
                    artist: t.artist,
                    duration: t.duration || 0,
                    artwork: t.artwork,
                });

                // Update Zustand state immediately (UI reflects new track at once)
                set({
                    activeTrack: track,
                    isPlaying: true,
                    queue: currentQueue,
                    currentContextId: contextId || null,
                });

                // Stage 2: Fire bridge calls — reset + add priority window + play
                // These are the only await calls on the hot path
                consecutiveErrors = 0; // Reset on cold start play
                await TrackPlayer.reset();
                await TrackPlayer.add(priorityWindow.map(toTrackPlayer));
                await TrackPlayer.play();

                // Stage 3: Background chunking (fire-and-forget)
                const remainingAfter = currentQueue.slice(startIndex + 21);
                const remainingBefore = currentQueue.slice(0, startIndex);
                const capturedContextId = contextId;

                const backgroundSync = async () => {
                    const CHUNK_SIZE = 50;

                    for (let i = 0; i < remainingAfter.length; i += CHUNK_SIZE) {
                        if (get().currentContextId !== capturedContextId) return;
                        await TrackPlayer.add(
                            remainingAfter.slice(i, i + CHUNK_SIZE).map(toTrackPlayer)
                        );
                    }

                    for (let i = 0; i < remainingBefore.length; i += CHUNK_SIZE) {
                        if (get().currentContextId !== capturedContextId) return;
                        await TrackPlayer.add(
                            remainingBefore.slice(i, i + CHUNK_SIZE).map(toTrackPlayer),
                            i
                        );
                    }
                };

                backgroundSync();
            },

            pause: async () => {
                await TrackPlayer.pause();
                set({ isPlaying: false });
            },

            resume: async () => {
                await TrackPlayer.play();
                set({ isPlaying: true });
            },

            next: async () => {
                await TrackPlayer.skipToNext();
            },

            previous: async () => {
                await TrackPlayer.skipToPrevious();
            },

            setQueue: async (tracks) => {
                set({ queue: tracks });
                // Logic to update TrackPlayer queue in background...
            },

            toggleShuffle: () => {
                // Complex shuffle logic to be implemented
                set(state => ({ isShuffleOn: !state.isShuffleOn }));
            },

            toggleRepeat: () => {
                const nextMode = {
                    [RepeatMode.Off]: RepeatMode.Queue,
                    [RepeatMode.Queue]: RepeatMode.Track,
                    [RepeatMode.Track]: RepeatMode.Off,
                }[get().repeatMode] || RepeatMode.Off;

                TrackPlayer.setRepeatMode(nextMode);
                set({ repeatMode: nextMode });
            },

            stop: async () => {
                await TrackPlayer.reset();
                set({ activeTrack: null, isPlaying: false, queue: [] });
            },

            setSleepTimer: (minutes) => {
                if (sleepTimeout) {
                    clearTimeout(sleepTimeout);
                    sleepTimeout = null;
                }

                if (minutes === null) {
                    set({ sleepTimerEndsAt: null });
                    return;
                }

                const endsAt = Date.now() + minutes * 60 * 1000;
                set({ sleepTimerEndsAt: endsAt });

                sleepTimeout = setTimeout(async () => {
                    await TrackPlayer.pause();
                    set({ isPlaying: false, sleepTimerEndsAt: null });
                    sleepTimeout = null;
                }, minutes * 60 * 1000);
            },

            removeFromQueue: async (trackId: string) => {
                const { queue } = get();
                const index = queue.findIndex(t => t.id === trackId);
                if (index !== -1) {
                    const newQueue = [...queue];
                    newQueue.splice(index, 1);
                    set({ queue: newQueue });
                    
                    // Also remove from native player
                    await TrackPlayer.remove(index);
                }
            }
        }),
        {
            name: StorageKeys.PLAYER_STATE,
            storage: createJSONStorage(() => mmkvStorage),
            partialize: (state) => ({
                activeTrack: state.activeTrack,
                queue: state.queue,
                repeatMode: state.repeatMode,
                isShuffleOn: state.isShuffleOn,
                sleepTimerEndsAt: state.sleepTimerEndsAt,
                currentContextId: state.currentContextId,
            }),
            // Never persist isPlaying; always start paused after restart
        }
    )
);
