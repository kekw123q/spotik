import { Playlist } from '../../../domain/entities/Playlist';
import { PlaylistCard } from './PlaylistCard';
import { Skeleton } from '@/components/ui/skeleton';

interface PlaylistGridProps {
    playlists: Playlist[];
    onPlaylistSelect: (playlist: Playlist) => void;
    isLoading?: boolean;
}

export const PlaylistGrid = ({ playlists, onPlaylistSelect, isLoading }: PlaylistGridProps) => {
    if (isLoading) {
        return (
            <>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </>
        );
    }

    return (
        <>
            {playlists.map((playlist) => (
                <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onSelect={() => onPlaylistSelect(playlist)}
                />
            ))}
        </>
    );
};