import { useMemo, useState } from 'react';
import { Track } from '@/stores/libraryStore';
import { useMoodStore } from '@/stores/moodStore';

export type SortMode = 'title' | 'artist' | 'default';

interface UseLibrarySearchProps {
    tracks: Track[];
}

export const useLibrarySearch = ({ tracks }: UseLibrarySearchProps) => {
    const { getMoodTrackIds } = useMoodStore();
    
    const [sortMode, setSortMode] = useState<SortMode>('default');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMoodId, setActiveMoodId] = useState<string | 'all'>('all');

    const filteredAndSortedTracks = useMemo(() => {
        let result = [...tracks];

        // 1. Filter by mood
        if (activeMoodId !== 'all') {
            const moodTracks = new Set(getMoodTrackIds(activeMoodId));
            result = result.filter(t => moodTracks.has(t.id));
        }

        // 2. Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.artist.toLowerCase().includes(query)
            );
        }

        // 3. Sort
        if (sortMode === 'title') {
            result.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortMode === 'artist') {
            result.sort((a, b) => a.artist.localeCompare(b.artist));
        }
        // 'default' is usually MediaLibrary order (date added)

        return result;
    }, [tracks, sortMode, searchQuery, activeMoodId, getMoodTrackIds]);

    const activeContextId = `songs-${activeMoodId}-${sortMode}`;

    return {
        // State
        sortMode,
        setSortMode,
        searchQuery,
        setSearchQuery,
        activeMoodId,
        setActiveMoodId,
        
        // Derived
        filteredAndSortedTracks,
        activeContextId
    };
};
