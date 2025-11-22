import { Playlist } from '../../../domain/entities/Playlist';
import { Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaylistCardProps {
    playlist: Playlist;
    onSelect: () => void;
}

export const PlaylistCard = ({ playlist, onSelect }: PlaylistCardProps) => {
    return (
        <Card
            className="cursor-pointer hover:bg-accent/80 transition-all group border-border bg-card overflow-hidden"
            onClick={onSelect}
        >
            <CardHeader className="p-0">
                <div className="aspect-square w-full relative overflow-hidden">
                    {playlist.coverUrl ? (
                        <img
                            src={playlist.coverUrl}
                            alt={playlist.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                            <Music className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <CardTitle className="text-base font-semibold line-clamp-1 mb-1">{playlist.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-1">
                    {playlist.description || `${playlist.tracks.length} tracks`}
                </p>
            </CardContent>
        </Card>
    );
};