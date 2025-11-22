import { Track } from '../../../domain/entities/Track';
import { TrackItem } from './TrackItem';

interface TrackListProps {
  tracks: Track[];
  onTrackSelect: (track: Track) => void;
  currentTrackId?: string;
}

export const TrackList = ({ tracks, onTrackSelect, currentTrackId }: TrackListProps) => {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No tracks found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tracks.map((track) => (
        <TrackItem
          key={track.id}
          track={track}
          onSelect={() => onTrackSelect(track)}
          isActive={track.id === currentTrackId}
        />
      ))}
    </div>
  );
};
