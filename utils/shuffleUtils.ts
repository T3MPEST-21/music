import { Track } from "@/stores/libraryStore";

/**
 * Standard Fisher-Yates Shuffle algorithm
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Intelligent Artist De-clustering
 * 
 * Ensures that the same artist doesn't appear more than twice in any block of 3 songs.
 * This is a BEST-EFFORT algorithm. If only one artist exists in the queue, 
 * it gracefully fallbacks to a standard shuffle.
 */
export function deClusterArtists(tracks: Track[]): Track[] {
    if (tracks.length < 3) return tracks;

    const result = [...tracks];
    
    for (let i = 2; i < result.length - 1; i++) {
        const artistPrev1 = result[i - 1].artist;
        const artistPrev2 = result[i - 2].artist;
        const currentArtist = result[i].artist;

        // Condition: Same artist 3 times in a row
        if (currentArtist === artistPrev1 && currentArtist === artistPrev2) {
            // Find the next track by a DIFFERENT artist to swap with
            let swapIndex = -1;
            for (let j = i + 1; j < result.length; j++) {
                if (result[j].artist !== currentArtist) {
                    swapIndex = j;
                    break;
                }
            }

            // If a different artist was found, swap them
            if (swapIndex !== -1) {
                [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
            } else {
                // Apollo Fallback: No other artists left in the remainder of the queue.
                // We stop here because the rest of the queue is also the same artist.
                break; 
            }
        }
    }

    return result;
}

/**
 * The Master Intelligent Shuffle
 */
export function intelligentShuffle(tracks: Track[], activeTrackId?: string): Track[] {
    if (tracks.length === 0) return [];

    // Separate the active track if provided (it should stay at the top or current position)
    let remainder = [...tracks];
    let anchor: Track | null = null;

    if (activeTrackId) {
        const index = remainder.findIndex(t => t.id === activeTrackId);
        if (index !== -1) {
            [anchor] = remainder.splice(index, 1);
        }
    }

    // 1. Shuffle
    let shuffled = fisherYatesShuffle(remainder);

    // 2. De-cluster
    shuffled = deClusterArtists(shuffled);

    // 3. Re-combine
    return anchor ? [anchor, ...shuffled] : shuffled;
}
