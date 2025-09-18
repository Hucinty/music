
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  audioSrc: string;
  coverArtSrc: string;
}

export type UserRole = 'admin' | 'user' | null;
