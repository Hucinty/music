import { Song } from '../types';

const DB_NAME = 'MeloVibeDB';
const DB_VERSION = 1;
const STORE_NAME = 'songs';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export interface StoredSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  audioFile: File;
  coverArtFile: File;
}

export const addSongsToDB = async (songs: StoredSong[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();

    songs.forEach(song => {
        store.put(song);
    });
  });
};

export const getSongsFromDB = async (): Promise<Song[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const storedSongs: StoredSong[] = request.result;
            const songs: Song[] = storedSongs.map(s => ({
                id: s.id,
                title: s.title,
                artist: s.artist,
                album: s.album,
                audioSrc: URL.createObjectURL(s.audioFile),
                coverArtSrc: URL.createObjectURL(s.coverArtFile),
            }));
            resolve(songs);
        };
    });
};
