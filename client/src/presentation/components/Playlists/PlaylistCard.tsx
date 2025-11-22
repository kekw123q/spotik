import { Playlist } from '../../../domain/entities/Playlist';
import { Music } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaylistCardProps {
  playlist: Playlist;
  onSelect: () => void;
}

export const PlaylistCard = ({ playlist, onSelect }: PlaylistCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:bg-accent transition-colors"
      onClick={onSelect}
    >
      <CardHeader className="p-4 pb-3">
        {playlist.coverUrl ? (
          <img
            src={playlist.coverUrl}
            alt={playlist.name}
            className="w-full aspect-square object-cover rounded-md mb-3"
          />
        ) : (
          <div className="w-full aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
            <Music className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <CardTitle className="text-base">{playlist.name}</CardTitle>
        {playlist.description && (
          <CardDescription className="text-sm line-clamp-2">
            {playlist.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-muted-foreground">
          {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
        </div>
      </CardContent>
    </Card>
  );
};
