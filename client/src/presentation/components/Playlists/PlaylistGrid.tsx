import { Playlist } from '../../../domain/entities/Playlist';
import { PlaylistCard } from './PlaylistCard';

interface PlaylistGridProps {
  playlists: Playlist[];
  onPlaylistSelect: (playlist: Playlist) => void;
}

export const PlaylistGrid = ({ playlists, onPlaylistSelect }: PlaylistGridProps) => {
  if (playlists.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No playlists available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {playlists.map((playlist) => (
        <PlaylistCard
          key={playlist.id}
          playlist={playlist}
          onSelect={() => onPlaylistSelect(playlist)}
        />
      ))}
    </div>
  );
};
