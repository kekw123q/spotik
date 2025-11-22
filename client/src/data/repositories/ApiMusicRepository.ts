import { IMusicRepository } from '../../domain/repositories/IMusicRepository';
import { Track } from '../../domain/entities/Track';
import { Playlist } from '../../domain/entities/Playlist';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export class ApiMusicRepository implements IMusicRepository {
  async searchTracks(query: string): Promise<Track[]> {
    const response = await fetch(`${API_BASE_URL}/tracks/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search tracks');
    }
    return response.json();
  }

  async getAuthorPlaylists(): Promise<Playlist[]> {
    const response = await fetch(`${API_BASE_URL}/playlists/author`);
    if (!response.ok) {
      throw new Error('Failed to fetch author playlists');
    }
    return response.json();
  }

  async getUserPlaylists(): Promise<Playlist[]> {
    const response = await fetch(`${API_BASE_URL}/playlists/user`);
    if (!response.ok) {
      throw new Error('Failed to fetch user playlists');
    }
    return response.json();
  }

  async getTrackUrl(id: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/tracks/${id}/stream`);
    if (!response.ok) {
      throw new Error('Failed to get track URL');
    }
    const data = await response.json();
    return data.url;
  }
}
