import React, { useState } from 'react';
import { Song, UserRole } from './types';
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { UserPlayer } from './components/UserPlayer';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
  };

  const addSongs = (newSongs: Song[]) => {
    setSongs(prevSongs => [...prevSongs, ...newSongs]);
  };

  const renderContent = () => {
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
