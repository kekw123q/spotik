import { Track } from './Track';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  tracks: Track[];
  isUserPlaylist: boolean;
}
