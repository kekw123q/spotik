import { Track } from '../../../domain/entities/Track';
import { TrackItem } from './TrackItem';
import { Skeleton } from '@/components/ui/skeleton';

interface TrackListProps {
    tracks: Track[];
    onTrackSelect: (track: Track) => void;
    currentTrackId?: string;
    isLoading?: boolean;
    onToggleLike?: (track: Track) => void;
    likedTrackIds?: Set<string>;
}

export const TrackList = ({
                              tracks,
                              onTrackSelect,
                              currentTrackId,
                              isLoading,
                              onToggleLike,
                              likedTrackIds
                          }: TrackListProps) => {

    if (isLoading) {
        return (
            <div className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-[200px]" />
                            <Skeleton className="h-2 w-[150px]" />
                        </div>
                        <Skeleton className="h-3 w-8" />
                    </div>
                ))}
            </div>
        );
    }

    if (tracks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground text-sm">
                Список треков пуст
            </div>
        );
    }

    return (
        <div className="space-y-1 pb-4">
            {tracks.map((track) => (
                <TrackItem
                    key={track.id}
                    track={track}
                    onSelect={() => onTrackSelect(track)}
                    isActive={track.id === currentTrackId}
                    // Check if track ID is in the global set of liked IDs
                    isLiked={likedTrackIds ? likedTrackIds.has(track.id) : false}
                    onToggleLike={onToggleLike}
                />
            ))}
        </div>
    );
};