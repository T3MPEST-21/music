import { Alert, Platform } from "react-native";
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
import { useToastStore } from "./toastStore";
import * as FileSystem from 'expo-file-system';

/**
 * Apollo Rule: Android requires file:// prefix for local filesystem paths.
 * We must ensure all library URIs are properly sanitized before they hit the bridge.
 */
const formatUrl = (url: string) => {
    if (Platform.OS === 'android' && !url.startsWith('http') && !url.startsWith('content://') && !url.startsWith('file://')) {
        return `file://${url}`;
    }
    return url;
};

/**
 * Android Resiliency: Pre-flight check to prevent android-io crash loops.
 */
const checkPathHealth = async (url: string): Promise<boolean> => {
    try {
        if (url.startsWith('http')) return true;
        const info = await FileSystem.getInfoAsync(url);
        return info.exists;
    } catch (e) {
        return false;
    }
};

interface PlayerState {
    isInitialized: boolean;
    activeTrack: Track | null;
    isPlaying: boolean; // UI reflection — source of truth is TrackPlayer
    queue: Track[];
    originalQueue: Track[]; // Snapshot for "Undo" shuffle
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
    shuffleAndPlay: (tracks: Track[], contextId?: string) => Promise<void>;
    toggleShuffle: () => Promise<void>;
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
let currentSyncId = 0;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            isInitialized: false,
            activeTrack: null,
            isPlaying: false,
            queue: [],
            originalQueue: [],
            repeatMode: RepeatMode.Off,
            isShuffleOn: false,
            sleepTimerEndsAt: null,
            currentContextId: null,

            setupPlayer: async () => {
                if (get().isInitialized) return;
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
                        const index = await TrackPlayer.getActiveTrackIndex();
                        const track = index !== undefined ? await TrackPlayer.getTrack(index) : null;
                        const currentTrackId = (track as any)?.id;

                        // Reset on next change to break the loop
                        consecutiveErrors++;

                        if (consecutiveErrors < 5) {
                            console.log(`[TrackPlayer] Error fallback: skipping to next (${consecutiveErrors}/5)`);
                            await TrackPlayer.skipToNext();
                            await TrackPlayer.play();
                        } else {
                            console.warn("[TrackPlayer] Too many consecutive errors. Critical Stop.");
                            await TrackPlayer.reset();
                            set({ isPlaying: false, activeTrack: null });
                            consecutiveErrors = 0;
                            Alert.alert("Playback Error", "Failed to play multiple tracks. This often happens if files were moved or deleted.");
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
                    const { queue, originalQueue, activeTrack } = get();
                    const restoreQueue = queue.length > 0 ? queue : originalQueue;
                    
                    if (restoreQueue.length > 0) {
                        const trackPlayerQueue = restoreQueue.map(t => ({
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

                    set({ isInitialized: true });
                } catch (e) {
                    console.error("[PlayerStore] Setup failed:", e);
                }
            },

            play: async (track: Track, contextQueue, contextId) => {
                const capturedSyncId = ++currentSyncId;
                const currentQueue = contextQueue || [track];

                // 1. Ensure Player is Ready (Apollo Guard)
                if (!get().isInitialized) {
                    await get().setupPlayer();
                }

                const status = await TrackPlayer.getPlaybackState();

                // Pre-flight Path Check (Android Resiliency)
                const formattedUrl = formatUrl(track.url);
                const isHealthy = await checkPathHealth(formattedUrl);
                
                if (!isHealthy) {
                    console.warn(`[PlayerStore] Path health check failed for: ${track.title}`);
                    useToastStore.getState().showToast(`File not found: ${track.title}`, 'error');
                    
                    // Exclude from session
                    const filteredQueue = currentQueue.filter(t => t.id !== track.id);
                    set({ queue: filteredQueue });

                    // Auto-advance to next valid track
                    const nextIndex = currentQueue.findIndex(t => t.id === track.id) + 1;
                    if (nextIndex < currentQueue.length) {
                        // Apollo Rule: Limit recursion to prevent infinite loops on broken libraries
                        if (consecutiveErrors > 10) {
                            Alert.alert("Library Sync Failed", "Too many missing files. Please refresh your library.");
                            return;
                        }
                        consecutiveErrors++;
                        return get().play(currentQueue[nextIndex], filteredQueue, contextId);
                    }
                    return;
                }

                const prevContextId = get().currentContextId;

                // 2. Smart Skip (Same Context Logic)
                if (contextId && prevContextId === contextId) {
                    try {
                        const nativeQueue = await TrackPlayer.getQueue();
                        const nativeIndex = nativeQueue.findIndex(t => (t as any).id === track.id);
                        
                        if (nativeIndex !== -1) {
                            consecutiveErrors = 0; 
                            await TrackPlayer.skip(nativeIndex);
                            await TrackPlayer.play();
                            set({ activeTrack: track, isPlaying: true });
                            return;
                        }
                    } catch (e) {
                        // Fallback to cold start
                    }
                }

                // 3. Sequential Sync Engine (The "Silent Fix")
                // -----------------------------------------------------
                const targetIndex = currentQueue.findIndex(t => t.id === track.id);
                const startIndex = Math.max(0, targetIndex);
                const priorityWindow = currentQueue.slice(startIndex, startIndex + 21);

                const toTrackPlayer = (t: Track) => ({
                    id: t.id,
                    url: formatUrl(t.url),
                    title: t.title,
                    artist: t.artist,
                    duration: t.duration || 0,
                    artwork: t.artwork,
                });

                // Update UI state
                set({
                    activeTrack: track,
                    isPlaying: true,
                    queue: currentQueue,
                    currentContextId: contextId || null,
                });

                // Check if we can do a Seamless Sync (Same context or shuffle toggle)
                if (status.state === State.Playing && contextId && prevContextId && contextId.startsWith(prevContextId.split('_')[0])) {
                     // If we are already playing and just synced (e.g. shuffle toggle), 
                     // we don't reset. We let the background sync handle it.
                     // But we must ensure the active track index matches.
                     const nativeQueue = await TrackPlayer.getQueue();
                     const nativeIndex = nativeQueue.findIndex(t => (t as any).id === track.id);
                     if (nativeIndex !== -1) {
                         // Already correct, just align the rest of the queue
                         backgroundSync(true); // forceReplace = true
                         return;
                     }
                }

                try {
                    consecutiveErrors = 0;
                    // AVOID RACE: Strict sequential bridge commands
                    await TrackPlayer.reset();
                    await TrackPlayer.add(priorityWindow.map(toTrackPlayer));
                    await TrackPlayer.play();
                } catch (err) {
                    console.error("[PlayerStore] Play failed:", err);
                }

                // Stage 3: Background chunking (fire-and-forget)
                const remainingAfter = currentQueue.slice(startIndex + 21);
                const remainingBefore = currentQueue.slice(0, startIndex);
                const capturedContextId = contextId;

                 const backgroundSync = async (forceReplace = false) => {
                    const CHUNK_SIZE = 30;
                    try {
                        // Yield the bridge for a moment after initial play
                        await sleep(1500);

                        if (forceReplace) {
                            // Apollo Air-Lock: If we are syncing a new queue order onto a running track,
                            // we must remove all other tracks from the native player first.
                            const nativeQueue = await TrackPlayer.getQueue();
                            const activeIndex = await TrackPlayer.getActiveTrackIndex();
                            
                            if (activeIndex !== undefined) {
                                const indicesToRemove = nativeQueue
                                    .map((_, i) => i)
                                    .filter(i => i !== activeIndex);
                                
                                if (indicesToRemove.length > 0) {
                                    await TrackPlayer.remove(indicesToRemove);
                                }
                            }
                        }

                        for (let i = 0; i < remainingAfter.length; i += CHUNK_SIZE) {
                            // cancellation check
                            if (currentSyncId !== capturedSyncId || get().currentContextId !== capturedContextId) return;
                            
                            await TrackPlayer.add(
                                remainingAfter.slice(i, i + CHUNK_SIZE).map(toTrackPlayer)
                            );
                            // yield the bridge
                            await sleep(500);
                        }

                        for (let i = 0; i < remainingBefore.length; i += CHUNK_SIZE) {
                            if (currentSyncId !== capturedSyncId || get().currentContextId !== capturedContextId) return;
                            
                            await TrackPlayer.add(
                                remainingBefore.slice(i, i + CHUNK_SIZE).map(toTrackPlayer),
                                i
                            );
                            await sleep(500);
                        }
                    } catch (e) {
                        console.error("[PlayerStore] backgroundSync failed:", e);
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
            },

            shuffleAndPlay: async (tracks, contextId) => {
                if (tracks.length === 0) return;
                
                // 1. Enable shuffle mode state and snapshot original order
                set({ isShuffleOn: true, originalQueue: [...tracks] });

                // 2. Intelligent Shuffle
                const { intelligentShuffle } = require("@/utils/shuffleUtils");
                const shuffled = intelligentShuffle(tracks);
                
                // 3. Play the first track and set context
                await get().play(shuffled[0], shuffled, contextId);
            },

            toggleShuffle: async () => {
                const { isShuffleOn, queue, originalQueue, activeTrack, currentContextId } = get();
                const { intelligentShuffle } = require("@/utils/shuffleUtils");
                const nextShuffleState = !isShuffleOn;
                
                // Keep the base context, but tag it for shuffle
                const baseContext = currentContextId?.split('_')[0] || 'default';
                const nextContextId = nextShuffleState ? `${baseContext}_shuffled` : baseContext;

                if (nextShuffleState) {
                    // SEAMLESS SHUFFLE ON
                    const shuffled = intelligentShuffle(queue, activeTrack?.id);
                    set({ 
                        isShuffleOn: true, 
                        originalQueue: [...queue], 
                        queue: shuffled 
                    });
                    
                    if (activeTrack) {
                        await get().play(activeTrack, shuffled, nextContextId);
                    }
                } else {
                    // SEAMLESS SHUFFLE OFF (RESTORE)
                    const restored = originalQueue.length > 0 ? [...originalQueue] : [...queue];
                    set({ 
                        isShuffleOn: false, 
                        originalQueue: [], 
                        queue: restored 
                    });

                    if (activeTrack) {
                        await get().play(activeTrack, restored, nextContextId);
                    }
                }
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
                originalQueue: state.originalQueue,
                repeatMode: state.repeatMode,
                isShuffleOn: state.isShuffleOn,
                sleepTimerEndsAt: state.sleepTimerEndsAt,
                currentContextId: state.currentContextId,
            }),
            // Never persist isPlaying; always start paused after restart
        }
    )
);
