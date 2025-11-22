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
                'group flex items-center gap-4 px-6 py-3 hover:bg-accent/50 transition-colors cursor-pointer w-full', // Increased padding
                isActive && 'bg-accent'
            )}
            onClick={onSelect}
        >
            <div className="relative flex-shrink-0">
                {track.coverUrl ? (
                    <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-12 h-12 rounded-md object-cover" // Increased size
                    />
                ) : (
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                        <Play className="h-5 w-5 text-muted-foreground" />
                    </div>
                )}
                <div className={cn(
                    "absolute inset-0 m-auto flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md",
                    isActive && "opacity-100 bg-black/0"
                )}>
                    <Play className={cn("h-5 w-5 text-white", isActive && "fill-primary text-primary")} />
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className={cn('font-medium truncate text-base', isActive && 'text-primary')}>
                    {track.title}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                    {track.artist}
                </div>
            </div>

            {onToggleLike && (
                <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                        "h-9 w-9 transition-opacity focus:opacity-100",
                        isLiked ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(track);
                    }}
                >
                    <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
                </Button>
            )}

            <div className="text-sm text-muted-foreground w-12 text-right tabular-nums">
                {formatDuration(track.duration)}
            </div>
        </div>
    );
};