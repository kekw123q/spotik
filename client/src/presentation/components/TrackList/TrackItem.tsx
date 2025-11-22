import { Track } from '../../../domain/entities/Track';
import { Play, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TrackItemProps {
    track: Track;
    onSelect: () => void;
    isActive?: boolean;
    isLiked?: boolean;
    onToggleLike?: (track: Track) => void;
}

export const TrackItem = ({ track, onSelect, isActive = false, isLiked = false, onToggleLike }: TrackItemProps) => {
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className={cn(
                'group flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer',
                isActive && 'bg-accent'
            )}
            onClick={onSelect}
        >
            <div className="relative flex-shrink-0">
                {track.coverUrl ? (
                    <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <Play className="h-4 w-4 text-muted-foreground" />
                    </div>
                )}
                <div className={cn(
                    "absolute inset-0 m-auto flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded",
                    isActive && "opacity-100 bg-black/0"
                )}>
                    <Play className={cn("h-4 w-4 text-white", isActive && "fill-primary text-primary")} />
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className={cn('font-medium truncate text-sm', isActive && 'text-primary')}>
                    {track.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                    {track.artist}
                </div>
            </div>

            {onToggleLike && (
                <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                        "h-8 w-8 transition-opacity focus:opacity-100",
                        // Ensure button is visible if liked OR if hovering over the row
                        isLiked ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(track);
                    }}
                >
                    <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                </Button>
            )}

            <div className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                {formatDuration(track.duration)}
            </div>
        </div>
    );
};