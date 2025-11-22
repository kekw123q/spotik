import { Track } from '../entities/Track';
import { Playlist } from '../entities/Playlist';

export interface IMusicRepository {
  searchTracks(query: string): Promise<Track[]>;
  getAuthorPlaylists(): Promise<Playlist[]>;
  getUserPlaylists(): Promise<Playlist[]>;
  getTrackUrl(id: string): Promise<string>;
}
