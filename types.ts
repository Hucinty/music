export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  audioSrc: string;
  coverArtSrc: string;
}

export type UserRole = 'admin' | 'user' | null;

// New type for passing raw data to be persisted
export interface SongData {
    title: string;
    artist: string;
    album: string;
    audioFile: File;
    coverArtFile: File;
}
