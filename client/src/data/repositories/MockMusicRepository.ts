import { IMusicRepository } from '../../domain/repositories/IMusicRepository';
import { Track } from '../../domain/entities/Track';
import { Playlist } from '../../domain/entities/Playlist';

// ... (Existing Mock Data Constants: MOCK_TRACKS, MOCK_AUTHOR_PLAYLISTS - keep them as they were)
// Initial Mock Data
const MOCK_TRACKS: Track[] = [
    {
        id: '1',
        title: 'Midnight Dreams',
        artist: 'Luna Eclipse',
        album: 'Nocturnal Vibes',
        duration: 245,
        coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
        id: '2',
        title: 'Ocean Waves',
        artist: 'Coastal Harmony',
        album: 'Seascape',
        duration: 198,
        coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
        id: '3',
        title: 'Urban Nights',
        artist: 'City Lights',
        album: 'Metropolitan',
        duration: 212,
        coverUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
    {
        id: '4',
        title: 'Mountain Echo',
        artist: 'Alpine Sound',
        album: 'Heights',
        duration: 189,
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    },
    {
        id: '5',
        title: 'Electric Pulse',
        artist: 'Synth Masters',
        album: 'Digital Era',
        duration: 267,
        coverUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300&h=300&fit=crop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    },
];

const MOCK_AUTHOR_PLAYLISTS: Playlist[] = [
    {
        id: 'ap1',
        name: 'Chill Vibes',
        description: 'Relax and unwind with these smooth tracks',
        coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop',
        tracks: [MOCK_TRACKS[0], MOCK_TRACKS[1], MOCK_TRACKS[3]],
        isUserPlaylist: false,
    },
    {
        id: 'ap2',
        name: 'Electronic Fusion',
        description: 'The best of electronic music',
        coverUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300&h=300&fit=crop',
        tracks: [MOCK_TRACKS[2], MOCK_TRACKS[4]],
        isUserPlaylist: false,
    },
];

const LS_LIKES_KEY = 'mock_likes';
const LS_PLAYLISTS_KEY = 'mock_user_playlists';
const LS_LAST_PLAYED_KEY = 'mock_last_played';

export class MockMusicRepository implements IMusicRepository {
    private simulateDelay(ms: number = 150): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private getLikes(): Set<string> {
        const stored = localStorage.getItem(LS_LIKES_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    }

    private saveLikes(likes: Set<string>) {
        localStorage.setItem(LS_LIKES_KEY, JSON.stringify(Array.from(likes)));
    }

    private getUserPlaylistsData(): Playlist[] {
        const stored = localStorage.getItem(LS_PLAYLISTS_KEY);
        if (stored) return JSON.parse(stored);
        return [];
    }

    private saveUserPlaylistsData(playlists: Playlist[]) {
        localStorage.setItem(LS_PLAYLISTS_KEY, JSON.stringify(playlists));
    }

    // Helper to convert file to base64 for mock storage
    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }

    async searchTracks(query: string): Promise<Track[]> {
        await this.simulateDelay();
        if (!query.trim()) return MOCK_TRACKS;
        const lower = query.toLowerCase();
        return MOCK_TRACKS.filter(t =>
            t.title.toLowerCase().includes(lower) ||
            t.artist.toLowerCase().includes(lower)
        );
    }

    async getTrack(id: string): Promise<Track | null> {
        await this.simulateDelay(50);
        return MOCK_TRACKS.find(t => t.id === id) || null;
    }

    async getAuthorPlaylists(): Promise<Playlist[]> {
        await this.simulateDelay();
        return MOCK_AUTHOR_PLAYLISTS;
    }

    async getUserPlaylists(): Promise<Playlist[]> {
        await this.simulateDelay();
        const playlists = this.getUserPlaylistsData();
        const likes = this.getLikes();
        const likedTracks = MOCK_TRACKS.filter(t => likes.has(t.id));

        const likedPlaylist: Playlist = {
            id: 'liked-songs',
            name: 'Мне нравится',
            description: 'Ваши любимые треки',
            isUserPlaylist: true,
            tracks: likedTracks,
            coverUrl: undefined
        };

        return [likedPlaylist, ...playlists];
    }

    async createPlaylist(name: string, description?: string, coverFile?: File): Promise<Playlist> {
        await this.simulateDelay();
        const playlists = this.getUserPlaylistsData();

        let coverUrl: string | undefined = undefined;
        if (coverFile) {
            // Simulating upload by storing base64 in LS (Not recommended for prod, fine for mocks)
            try {
                coverUrl = await this.fileToBase64(coverFile);
            } catch (e) {
                console.error("Mock upload failed", e);
            }
        }

        const newPlaylist: Playlist = {
            id: `up_${Date.now()}`,
            name,
            description,
            isUserPlaylist: true,
            tracks: [],
            coverUrl: coverUrl
        };
        playlists.push(newPlaylist);
        this.saveUserPlaylistsData(playlists);
        return newPlaylist;
    }

    async deletePlaylist(playlistId: string): Promise<void> {
        await this.simulateDelay();
        if (playlistId === 'liked-songs') throw new Error("Cannot delete Liked Songs");
        let playlists = this.getUserPlaylistsData();
        playlists = playlists.filter(p => p.id !== playlistId);
        this.saveUserPlaylistsData(playlists);
    }

    async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
        await this.simulateDelay();
        const playlists = this.getUserPlaylistsData();
        const playlist = playlists.find(p => p.id === playlistId);
        const track = MOCK_TRACKS.find(t => t.id === trackId);

        if (playlist && track) {
            if (!playlist.tracks.find(t => t.id === trackId)) {
                playlist.tracks.push(track);
                this.saveUserPlaylistsData(playlists);
            }
        }
    }

    async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
        await this.simulateDelay();
        const playlists = this.getUserPlaylistsData();
        const playlist = playlists.find(p => p.id === playlistId);

        if (playlist) {
            playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
            this.saveUserPlaylistsData(playlists);
        }
    }

    async getLikedTracks(): Promise<Track[]> {
        await this.simulateDelay();
        const likes = this.getLikes();
        return MOCK_TRACKS.filter(t => likes.has(t.id));
    }

    async toggleLike(trackId: string): Promise<boolean> {
        await this.simulateDelay(50);
        const likes = this.getLikes();
        const isLiked = likes.has(trackId);
        if (isLiked) {
            likes.delete(trackId);
        } else {
            likes.add(trackId);
        }
        this.saveLikes(likes);
        return !isLiked;
    }

    async isLiked(trackId: string): Promise<boolean> {
        const likes = this.getLikes();
        return likes.has(trackId);
    }

    async getTrackUrl(id: string): Promise<string> {
        await this.simulateDelay(50);
        const track = MOCK_TRACKS.find(t => t.id === id);
        if (!track) throw new Error('Track not found');
        return track.audioUrl;
    }

    async getLastPlayed(): Promise<{ trackId: string; position: number } | null> {
        const data = localStorage.getItem(LS_LAST_PLAYED_KEY);
        if (!data) return null;
        return JSON.parse(data);
    }

    async saveLastPlayed(trackId: string, position: number): Promise<void> {
        if (trackId === '-1') {
            localStorage.removeItem(LS_LAST_PLAYED_KEY);
        } else {
            localStorage.setItem(LS_LAST_PLAYED_KEY, JSON.stringify({ trackId, position }));
        }
    }
}