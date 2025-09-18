import { Song } from '../types';

const SONGS_STORAGE_KEY = 'meloVibeSongs';

/**
 * Saves the list of songs to the browser's localStorage.
 * @param songs - The array of song objects to save.
 */
export const saveSongs = (songs: Song[]): void => {
  try {
    const serializedSongs = JSON.stringify(songs);
    localStorage.setItem(SONGS_STORAGE_KEY, serializedSongs);
  } catch (error) {
    console.error("Failed to save songs to localStorage:", error);
  }
};

/**
 * Loads the list of songs from the browser's localStorage.
 * @returns An array of song objects, or an empty array if none are found or an error occurs.
 */
export const loadSongs = (): Song[] => {
  try {
    const serializedSongs = localStorage.getItem(SONGS_STORAGE_KEY);
    if (serializedSongs === null) {
      return [];
    }
    return JSON.parse(serializedSongs);
  } catch (error) {
    console.error("Failed to load songs from localStorage:", error);
    return [];
  }
};
