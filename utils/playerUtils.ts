import { Track } from '@/stores/libraryStore';

/**
 * Smart Shuffle Algorithm (Fisher-Yates + Anti-Clumping)
 * 
 * 1. Performs a standard fair shuffle.
 * 2. If there are multiple artists, iterates to prevent back-to-back artist clumping.
 * 3. Ensures the 'startingTrackId' remains at index 0 for seamless transition.
 */
export const smartShuffle = (tracks: Track[], startingTrackId?: string): Track[] => {
    if (tracks.length <= 1) return [...tracks];

    // Work on a copy
    let shuffled = [...tracks];

    // Standard Fisher-Yates
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Artist Anti-Clumping
    const uniqueArtists = new Set(shuffled.filter(t => !!t.artist).map(t => t.artist)).size;
    
    // Only attempt anti-clumping if it's statistically possible
    if (uniqueArtists > 1 && shuffled.length > 3) {
        for (let i = 0; i < shuffled.length - 1; i++) {
            // Check if next song is by the same artist
            if (shuffled[i].artist && shuffled[i].artist === shuffled[i + 1].artist) {
                // Look ahead for a different artist to swap with
                for (let j = i + 2; j < shuffled.length; j++) {
                    if (shuffled[j].artist !== shuffled[i].artist) {
                        // Perform swap
                        [shuffled[i + 1], shuffled[j]] = [shuffled[j], shuffled[i + 1]];
                        break;
                    }
                }
            }
        }
    }

    // Continuity: If we are already playing a track, it must stay at the top
    if (startingTrackId) {
        const currentIndex = shuffled.findIndex(t => t.id === startingTrackId);
        if (currentIndex !== -1) {
            const [current] = shuffled.splice(currentIndex, 1);
            shuffled.unshift(current);
        }
    }

    return shuffled;
};

/**
 * Basic random shuffle
 */
export const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};
