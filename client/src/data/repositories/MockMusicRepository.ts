import { IMusicRepository } from '../../domain/repositories/IMusicRepository';
import { Track } from '../../domain/entities/Track';
import { Playlist } from '../../domain/entities/Playlist';

const mockTracks: Track[] = [
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

const mockAuthorPlaylists: Playlist[] = [
  {
    id: 'ap1',
    name: 'Chill Vibes',
    description: 'Relax and unwind with these smooth tracks',
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop',
    tracks: [mockTracks[0], mockTracks[1], mockTracks[3]],
    isUserPlaylist: false,
  },
  {
    id: 'ap2',
    name: 'Electronic Fusion',
    description: 'The best of electronic music',
    coverUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300&h=300&fit=crop',
    tracks: [mockTracks[2], mockTracks[4]],
    isUserPlaylist: false,
  },
];

const mockUserPlaylists: Playlist[] = [
  {
    id: 'up1',
    name: 'My Favorites',
    description: 'Personal collection of favorite tracks',
    coverUrl: 'https://images.unsplash.com/photo-1484876065684-b683cf17d276?w=300&h=300&fit=crop',
    tracks: [mockTracks[0], mockTracks[2], mockTracks[4]],
    isUserPlaylist: true,
  },
];

export class MockMusicRepository implements IMusicRepository {
  private simulateDelay(ms: number = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async searchTracks(query: string): Promise<Track[]> {
    await this.simulateDelay(800);
    
    if (!query.trim()) {
      return mockTracks;
    }

    const lowerQuery = query.toLowerCase();
    return mockTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(lowerQuery) ||
        track.artist.toLowerCase().includes(lowerQuery) ||
        track.album?.toLowerCase().includes(lowerQuery)
    );
  }

  async getAuthorPlaylists(): Promise<Playlist[]> {
    await this.simulateDelay(600);
    return mockAuthorPlaylists;
  }

  async getUserPlaylists(): Promise<Playlist[]> {
    await this.simulateDelay(400);
    return mockUserPlaylists;
  }

  async getTrackUrl(id: string): Promise<string> {
    await this.simulateDelay(200);
    const track = mockTracks.find((t) => t.id === id);
    if (!track) {
      throw new Error(`Track with id ${id} not found`);
    }
    return track.audioUrl;
  }
}
