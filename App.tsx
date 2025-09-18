import React, { useState, useEffect } from 'react';
import { Song, UserRole, SongData } from './types';
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { UserPlayer } from './components/UserPlayer';
import { getSongsFromDB, addSongsToDB, StoredSong } from './lib/db';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialSongs = async () => {
      try {
        const dbSongs = await getSongsFromDB();
        setSongs(dbSongs);
      } catch (error) {
        console.error("Failed to load songs from DB:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialSongs();
  }, []);


  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
  };

  const addSongs = async (newSongsData: SongData[]) => {
    // 1. Prepare data for DB (add unique ID) and for state (create object URLs)
    const newStoredSongs: StoredSong[] = [];
    const newDisplaySongs: Song[] = [];

    newSongsData.forEach(data => {
        const id = `${new Date().toISOString()}-${data.title}`;
        newStoredSongs.push({ 
            id, 
            title: data.title,
            artist: data.artist,
            album: data.album,
            audioFile: data.audioFile,
            coverArtFile: data.coverArtFile
        });
        newDisplaySongs.push({
            id,
            title: data.title,
            artist: data.artist,
            album: data.album,
            audioSrc: URL.createObjectURL(data.audioFile),
            coverArtSrc: URL.createObjectURL(data.coverArtFile)
        });
    });

    // 2. Save to DB
    try {
        await addSongsToDB(newStoredSongs);
        // 3. Update state
        setSongs(prevSongs => [...prevSongs, ...newDisplaySongs]);
    } catch (error) {
        console.error("Failed to save songs to DB:", error);
        // Revoke object URLs if save fails to prevent memory leaks
        newDisplaySongs.forEach(song => {
            URL.revokeObjectURL(song.audioSrc);
            URL.revokeObjectURL(song.coverArtSrc);
        });
    }
  };

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-text">
                <p>Loading Music Library...</p>
            </div>
        );
    }

    switch (userRole) {
      case 'admin':
        return <AdminDashboard addSongs={addSongs} onLogout={handleLogout} />;
      case 'user':
        return <UserPlayer songs={songs} onLogout={handleLogout} />;
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <div className="bg-brand-bg min-h-screen">
      {renderContent()}
    </div>
  );
};

export default App;
