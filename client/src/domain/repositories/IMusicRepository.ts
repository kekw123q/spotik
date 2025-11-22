import { Track } from '../entities/Track';
import { Playlist } from '../entities/Playlist';

export interface IMusicRepository {
    searchTracks(query: string): Promise<Track[]>;
    getTrack(id: string): Promise<Track | null>;

    // Playlists
    getAuthorPlaylists(): Promise<Playlist[]>;
    getUserPlaylists(): Promise<Playlist[]>;
    // Updated: accept cover file
    createPlaylist(name: string, description?: string, coverFile?: File): Promise<Playlist>;
    deletePlaylist(playlistId: string): Promise<void>;
    addTrackToPlaylist(playlistId: string, trackId: string): Promise<void>;
    removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;

    // Likes
    getLikedTracks(): Promise<Track[]>;
    toggleLike(trackId: string): Promise<boolean>;
    isLiked(trackId: string): Promise<boolean>;

    // Stream
    getTrackUrl(id: string): Promise<string>;

    // Persistence
    getLastPlayed(): Promise<{ trackId: string; position: number } | null>;
    saveLastPlayed(trackId: string, position: number): Promise<void>;
}