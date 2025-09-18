import React, { useState, useRef, useEffect } from 'react';
import { Song } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { NextIcon } from './icons/NextIcon';
import { PrevIcon } from './icons/PrevIcon';
import { VolumeUpIcon } from './icons/VolumeUpIcon';
import { VolumeOffIcon } from './icons/VolumeOffIcon';

interface UserPlayerProps {
  songs: Song[];
  onLogout: () => void;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const UserPlayer: React.FC<UserPlayerProps> = ({ songs, onLogout }) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    // Reset player state if songs array changes (e.g., becomes empty)
    if (songs.length === 0) {
        setIsPlaying(false);
        setCurrentSongIndex(0);
    }
  }, [songs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    
    if (isPlaying) {
      audio.play().catch(e => console.error("Error playing audio:", e));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSongIndex, currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSongEnd = () => {
    playNext();
  };

  const togglePlayPause = () => {
    if (songs.length > 0) {
        setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (songs.length === 0) return;
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
    setIsPlaying(true);
  };

  const playPrev = () => {
    if (songs.length === 0) return;
    setCurrentSongIndex((prevIndex) => (prevIndex - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Number(e.target.value);
      setProgress(Number(e.target.value));
    }
  };

   const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
  };
  
  const toggleMute = () => {
      setIsMuted(!isMuted);
  };

  const selectSong = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };
  
  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.album.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!songs.length) {
    return (
        <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col items-center justify-center p-4">
             <header className="absolute top-0 right-0 p-4 sm:p-8">
                <button onClick={onLogout} className="px-4 py-2 text-sm font-medium bg-brand-elevated rounded-full hover:bg-opacity-80 transition-all">Logout</button>
            </header>
            <h2 className="text-2xl text-brand-secondary">No songs available.</h2>
            <p className="text-brand-secondary">An admin needs to upload some music first.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans flex flex-col lg:flex-row p-4 sm:p-8 gap-8">
      {currentSong && <audio
        ref={audioRef}
        key={currentSong.id}
        src={currentSong.audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleSongEnd}
      />}
      <header className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <button onClick={onLogout} className="px-4 py-2 text-sm font-medium bg-brand-elevated rounded-full hover:bg-opacity-80 transition-all">Logout</button>
      </header>
      
      {/* Player Section */}
      <div className="w-full lg:w-2/3 flex flex-col items-center justify-center lg:items-start text-center lg:text-left">
          <div className="relative w-full max-w-sm lg:max-w-md aspect-square rounded-xl shadow-2xl overflow-hidden mb-8">
              <img src={currentSong.coverArtSrc || 'https://picsum.photos/500/500'} alt={currentSong.album} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>
          <div>
              <h2 className="text-4xl font-bold truncate">{currentSong.title}</h2>
              <p className="text-xl text-brand-secondary mt-2">
                {currentSong.artist} &bull; {currentSong.album}
              </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mt-8">
              <input
                  type="range"
                  ref={progressBarRef}
                  value={progress}
                  max={duration || 0}
                  onChange={handleProgressChange}
                  className="w-full h-1 bg-brand-elevated rounded-lg appearance-none cursor-pointer range-sm accent-brand-primary"
              />
              <div className="flex justify-between text-xs text-brand-secondary mt-1">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
              </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 mt-6">
              <button onClick={playPrev} className="text-brand-secondary hover:text-brand-text transition-colors"><PrevIcon className="w-8 h-8" /></button>
              <button onClick={togglePlayPause} className="bg-brand-primary text-brand-bg rounded-full p-4 hover:scale-105 transition-transform shadow-lg">
                  {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
              </button>
              <button onClick={playNext} className="text-brand-secondary hover:text-brand-text transition-colors"><NextIcon className="w-8 h-8" /></button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 mt-8 w-full max-w-xs justify-center lg:justify-start">
             <button onClick={toggleMute} className="text-brand-secondary hover:text-brand-text transition-colors">
                {isMuted || volume === 0 ? <VolumeOffIcon/> : <VolumeUpIcon/>}
             </button>
             <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-brand-elevated rounded-lg appearance-none cursor-pointer range-sm accent-brand-secondary"
             />
          </div>
      </div>

      {/* Playlist Section */}
      <div className="w-full lg:w-1/3 bg-brand-surface rounded-xl p-6 flex flex-col">
          <h3 className="text-2xl font-bold mb-4">Up Next</h3>
          <div className="mb-4 relative">
            <input
                type="text"
                placeholder="Search playlist..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-brand-elevated border-transparent rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm"
            />
          </div>
          <div className="overflow-y-auto flex-grow pr-2">
              <ul className="space-y-2">
                  {filteredSongs.map((song) => {
                      const originalIndex = songs.findIndex(s => s.id === song.id);
                      return (
                        <li
                            key={song.id}
                            onClick={() => selectSong(originalIndex)}
                            className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${originalIndex === currentSongIndex ? 'bg-brand-primary/20' : 'hover:bg-brand-elevated'}`}
                        >
                            <img src={song.coverArtSrc} alt={song.album} className="w-12 h-12 rounded-md object-cover" />
                            <div className="flex-grow overflow-hidden">
                                <p className={`font-semibold truncate ${originalIndex === currentSongIndex ? 'text-brand-primary' : 'text-brand-text'}`}>{song.title}</p>
                                <p className="text-sm text-brand-secondary truncate">{song.artist}</p>
                            </div>
                            {originalIndex === currentSongIndex && isPlaying && (
                               <div className="flex items-center space-x-0.5">
                                  <span className="w-1 h-4 bg-brand-primary rounded-full animate-[bounce_1s_ease-in-out_infinite] delay-0"></span>
                                  <span className="w-1 h-5 bg-brand-primary rounded-full animate-[bounce_1.2s_ease-in-out_infinite] delay-150"></span>
                                  <span className="w-1 h-3 bg-brand-primary rounded-full animate-[bounce_0.8s_ease-in-out_infinite] delay-300"></span>
                               </div>
                            )}
                        </li>
                      );
                  })}
              </ul>
               {filteredSongs.length === 0 && searchTerm && (
                <p className="text-center text-brand-secondary text-sm mt-4">No songs match your search.</p>
            )}
          </div>
      </div>
    </div>
  );
};
