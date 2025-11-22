import { Track } from '../../../domain/entities/Track';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TrackItemProps {
  track: Track;
  onSelect: () => void;
  isActive?: boolean;
}

export const TrackItem = ({ track, onSelect, isActive = false }: TrackItemProps) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer',
        isActive && 'bg-accent'
      )}
      onClick={onSelect}
    >
      <div className="relative flex-shrink-0">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-12 h-12 rounded object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
            <Play className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="absolute inset-0 m-auto w-8 h-8 opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <Play className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn('font-medium truncate', isActive && 'text-primary')}>
          {track.title}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {track.artist}
          {track.album && ` • ${track.album}`}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {formatDuration(track.duration)}
      </div>
    </div>
  );
};
