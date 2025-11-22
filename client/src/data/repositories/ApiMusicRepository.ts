import { IMusicRepository } from '../../domain/repositories/IMusicRepository';
import { Track } from '../../domain/entities/Track';
import { Playlist } from '../../domain/entities/Playlist';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export class ApiMusicRepository implements IMusicRepository {
    private async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }

    async searchTracks(query: string): Promise<Track[]> {
        return this.fetchJson(`${API_BASE_URL}/tracks/search?q=${encodeURIComponent(query)}`);
    }

    async getTrack(id: string): Promise<Track | null> {
        return this.fetchJson(`${API_BASE_URL}/tracks/${id}`);
    }

    async getAuthorPlaylists(): Promise<Playlist[]> {
        return this.fetchJson(`${API_BASE_URL}/playlists/author`);
    }

    async getUserPlaylists(): Promise<Playlist[]> {
        return this.fetchJson(`${API_BASE_URL}/playlists/user`);
    }

    async createPlaylist(name: string, description?: string, coverFile?: File): Promise<Playlist> {
        // If there is a file, we usually need FormData.
        // This implementation assumes the backend handles FormData for playlist creation.

        if (coverFile) {
            const formData = new FormData();
            formData.append('name', name);
            if (description) formData.append('description', description);
            formData.append('cover', coverFile);

            const response = await fetch(`${API_BASE_URL}/playlists`, {
                method: 'POST',
                body: formData,
                // Do not set Content-Type for FormData, browser sets it with boundary
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return response.json();
        } else {
            return this.fetchJson(`${API_BASE_URL}/playlists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            });
        }
    }

    async deletePlaylist(playlistId: string): Promise<void> {
        await fetch(`${API_BASE_URL}/playlists/${playlistId}`, { method: 'DELETE' });
    }

    async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
        await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackId }),
        });
    }

    async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
        await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks/${trackId}`, {
            method: 'DELETE',
        });
    }

    async getLikedTracks(): Promise<Track[]> {
        return this.fetchJson(`${API_BASE_URL}/me/likes`);
    }

    async toggleLike(trackId: string): Promise<boolean> {
        const response = await this.fetchJson<{ liked: boolean }>(`${API_BASE_URL}/tracks/${trackId}/like`, {
            method: 'POST',
        });
        return response.liked;
    }

    async isLiked(trackId: string): Promise<boolean> {
        const response = await this.fetchJson<{ liked: boolean }>(`${API_BASE_URL}/tracks/${trackId}/is-liked`);
        return response.liked;
    }

    async getTrackUrl(id: string): Promise<string> {
        const data = await this.fetchJson<{ url: string }>(`${API_BASE_URL}/tracks/${id}/stream`);
        return data.url;
    }

    async getLastPlayed(): Promise<{ trackId: string; position: number } | null> {
        try {
            return await this.fetchJson(`${API_BASE_URL}/me/player/state`);
        } catch {
            return null;
        }
    }

    async saveLastPlayed(trackId: string, position: number): Promise<void> {
        await fetch(`${API_BASE_URL}/me/player/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackId, position }),
        });
    }
}