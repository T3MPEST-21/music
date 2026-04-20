import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Capability,
    Event,
    RepeatMode,
    State
} from "react-native-track-player";
import { create } from "zustand";
import { Track } from "./libraryStore";
import { useToastStore } from "./toastStore";
import { useThemeStore } from "./themeStore";

interface PlayerState {
    activeTrack: Track | null;
    isPlaying: boolean;
    queue: Track[];
    repeatMode: RepeatMode;
    isShuffleOn: boolean;
    sleepTimerEndsAt: number | null;
    activeContextId: string | null;
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

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            activeTrack: null,
            isPlaying: false,
            queue: [],
            repeatMode: RepeatMode.Off,
            isShuffleOn: false,
            sleepTimerEndsAt: null,
            consecutiveErrors: 0,
            activeContextId: null,

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
                        
                        // Reset consecutive error count as soon as we prove sound can play
                        if (state === State.Playing) {
                            set({ consecutiveErrors: 0 });
                        }
                    });

                    // Graceful fallback for missing/corrupted tracks
                    TrackPlayer.addEventListener(Event.PlaybackError, async () => {
                        const { consecutiveErrors, next, stop } = get();
                        const { showToast } = useToastStore.getState();
                        
                        // Get track info for better toast message
                        const index = await TrackPlayer.getActiveTrackIndex();
                        const track = index !== undefined ? await TrackPlayer.getTrack(index) : null;
                        const trackName = track?.title || 'Unknown Track';

                        const newErrorCount = consecutiveErrors + 1;
                        set({ consecutiveErrors: newErrorCount });

                        if (newErrorCount < 5) {
                            showToast(`File Issue: Skipping "${trackName}"...`, 'info');
                            await next();
                        } else {
                            showToast(`Too many invalid files. Stopping playback.`, 'error');
                            await stop(); // This also resets activeTrack and isPlaying in our store
                            set({ consecutiveErrors: 0 }); 
                        }
                    });

                    TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async () => {
                        const index = await TrackPlayer.getActiveTrackIndex();
                        if (index !== undefined && index !== null) {
                            const track = await TrackPlayer.getTrack(index);
                            if (track) set({ activeTrack: track as any });
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
                const currentContextId = contextId || null;

                // Safety: ensure setup has been called
                try {
                    const state = await TrackPlayer.getPlaybackState();
                    if (state.state === State.None) {
                        await get().setupPlayer();
                    }
                } catch (e) {
                    await get().setupPlayer();
                }

                // FAST PATH: Same context, track already in queue
                if (currentContextId && currentContextId === get().activeContextId) {
                    const index = get().queue.findIndex(t => t.id === track.id);
                    if (index !== -1) {
                        await TrackPlayer.skip(index);
                        await TrackPlayer.play();
                        set({ activeTrack: track, isPlaying: true });
                        return;
                    }
                }

                // SLOW PATH: New context or context not provided
                // Convert to TrackPlayer Object
                const trackPlayerQueue = currentQueue.map(t => ({
                    id: t.id,
                    url: t.url,
                    title: t.title,
                    artist: t.artist,
                    duration: t.duration || 0,
                    artwork: t.artwork
                }));

                await TrackPlayer.reset();
                await TrackPlayer.add(trackPlayerQueue);

                // Find index of the clicked track
                const index = trackPlayerQueue.findIndex(t => t.id === track.id);
                if (index !== -1) {
                    await TrackPlayer.skip(index);
                }

                await TrackPlayer.play();
                set({ 
                    activeTrack: track, 
                    isPlaying: true, 
                    queue: currentQueue,
                    activeContextId: currentContextId
                });
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
                activeContextId: state.activeContextId,
                // consecutiveErrors is volatile, never persist it
            }),
            // Never persist isPlaying; always start paused after restart
        }
    )
);
