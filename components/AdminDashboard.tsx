import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Song } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface AdminDashboardProps {
  addSongs: (songs: Song[]) => void;
  onLogout: () => void;
}

interface StagedFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  songDetails?: { title: string; artist: string; album: string };
  coverArtFile?: File;
  error?: string;
}

const StatusBadge: React.FC<{ status: StagedFile['status'] }> = ({ status }) => {
  const baseClasses = "text-xs font-semibold px-2.5 py-0.5 rounded-full";
  switch (status) {
    case 'pending':
      return <span className={`${baseClasses} bg-gray-600 text-gray-100`}>Pending</span>;
    case 'processing':
      return <span className={`${baseClasses} bg-blue-500 text-white animate-pulse`}>Processing...</span>;
    case 'success':
      return <span className={`${baseClasses} bg-brand-primary text-brand-bg`}>Success</span>;
    case 'error':
      return <span className={`${baseClasses} bg-red-500 text-white`}>Error</span>;
    default:
      return null;
  }
};


export const AdminDashboard: React.FC<AdminDashboardProps> = ({ addSongs, onLogout }) => {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newStagedFiles: StagedFile[] = Array.from(files).map(file => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      status: 'pending',
    }));
    
    setStagedFiles(prev => [...prev, ...newStagedFiles]);
  };
  
  const processFile = async (file: File): Promise<{ songDetails: { title: string; artist: string; album: string }, coverArtFile: File }> => {
     const geminiPrompt = `Extract the artist and title from this filename: "${file.name}". Assume "Artist - Title" or similar formats.`;
     const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: geminiPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
            },
            required: ["title", "artist"],
          },
        },
      });

      const geminiResult = JSON.parse(geminiResponse.text.trim());
      const { title, artist } = geminiResult;
      
      if (!title || !artist) {
          throw new Error("AI could not determine title and artist.");
      }
      
      const searchTerm = encodeURIComponent(`${artist} ${title}`);
      const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=1`);
      if (!itunesResponse.ok) throw new Error('iTunes search failed.');
      
      const itunesData = await itunesResponse.json();
      if (itunesData.resultCount === 0) throw new Error('Song not found on iTunes.');
      
      const songData = itunesData.results[0];
      
      const songDetails = {
        title: songData.trackName || title,
        artist: songData.artistName || artist,
        album: songData.collectionName || title, // Fallback to title for album
      };

      const highResArtworkUrl = (songData.artworkUrl100 || '').replace('100x100', '600x600');
      if (!highResArtworkUrl) throw new Error('Cover art not found.');
      
      const artResponse = await fetch(highResArtworkUrl);
      if (!artResponse.ok) throw new Error('Failed to download cover art.');
      
      const artBlob = await artResponse.blob();
      const coverArtFile = new File([artBlob], 'cover.jpg', { type: artBlob.type });

      return { songDetails, coverArtFile };
  };

  const handleProcessQueue = async () => {
    setIsProcessing(true);
    setProcessedCount(0);

    let currentProcessed = 0;
    for (const stagedFile of stagedFiles) {
      if (stagedFile.status !== 'pending') {
        currentProcessed++;
        setProcessedCount(currentProcessed);
        continue;
      }
      
      setStagedFiles(prev => prev.map(sf => 
        sf.id === stagedFile.id ? { ...sf, status: 'processing' } : sf
      ));

      try {
        const { songDetails, coverArtFile } = await processFile(stagedFile.file);
        setStagedFiles(prev => prev.map(sf => 
          sf.id === stagedFile.id ? { ...sf, status: 'success', songDetails, coverArtFile } : sf
        ));
      } catch (e: any) {
        console.error(`Failed to process ${stagedFile.file.name}:`, e);
        setStagedFiles(prev => prev.map(sf => 
          sf.id === stagedFile.id ? { ...sf, status: 'error', error: e.message || 'An unknown error occurred' } : sf
        ));
      }
      currentProcessed++;
      setProcessedCount(currentProcessed);
    }
    
    setIsProcessing(false);
  };
  
  const handleAddSongsToLibrary = () => {
    const successfulFiles = stagedFiles.filter(sf => sf.status === 'success');
    if (successfulFiles.length === 0) return;

    const newSongs: Song[] = successfulFiles.map(sf => ({
      id: `${new Date().toISOString()}-${sf.songDetails!.title}`,
      title: sf.songDetails!.title,
      artist: sf.songDetails!.artist,
      album: sf.songDetails!.album,
      audioSrc: URL.createObjectURL(sf.file),
      coverArtSrc: URL.createObjectURL(sf.coverArtFile!),
    }));

    addSongs(newSongs);
    setStagedFiles([]); // Clear the queue
  };

  const successfulCount = stagedFiles.filter(s => s.status === 'success').length;
  const pendingCount = stagedFiles.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans p-4 sm:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-brand-primary">Admin Dashboard</h1>
        <button onClick={onLogout} className="px-4 py-2 text-sm font-medium bg-brand-elevated rounded-full hover:bg-opacity-80 transition-all">Logout</button>
      </header>

      <div className="max-w-4xl mx-auto bg-brand-surface p-6 sm:p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Bulk Upload Songs</h2>
        <p className="text-brand-secondary mb-6 text-sm">Upload multiple audio files. The system will automatically find the title, artist, album, and cover art for each song.</p>

        <div className="border-2 border-dashed border-brand-elevated rounded-lg p-8 text-center bg-brand-bg/30">
          <label htmlFor="audioFiles" className="cursor-pointer">
            <p className="text-brand-primary font-semibold">Click to select files</p>
            <p className="text-xs text-brand-secondary mt-1">or drag and drop audio files here</p>
            <input id="audioFiles" name="audioFiles" type="file" accept="audio/*" multiple onChange={handleFileChange} className="sr-only"/>
          </label>
        </div>
        
        {stagedFiles.length > 0 && (
          <>
            <div className="my-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={handleProcessQueue} 
                  disabled={isProcessing || pendingCount === 0}
                  className="px-6 py-2 font-bold text-brand-bg bg-brand-primary rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Process All Files`}
                </button>
                <button
                  onClick={handleAddSongsToLibrary}
                  disabled={isProcessing || successfulCount === 0}
                  className="px-6 py-2 font-semibold text-brand-bg bg-brand-secondary rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {successfulCount > 0 ? `${successfulCount} ` : ''}Songs to Library
                </button>
              </div>
               <button
                  onClick={() => setStagedFiles([])}
                  disabled={isProcessing}
                  className="text-sm text-brand-secondary hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  Clear All
                </button>
            </div>
            
            {isProcessing && (
              <div className="w-full bg-brand-elevated rounded-full h-2.5 my-4">
                <div 
                  className="bg-brand-primary h-2.5 rounded-full transition-all duration-300 ease-linear" 
                  style={{width: `${stagedFiles.length > 0 ? (processedCount / stagedFiles.length) * 100 : 0}%`}}
                ></div>
                <p className="text-xs text-center mt-1 text-brand-secondary">{processedCount} / {stagedFiles.length} files processed</p>
              </div>
            )}

            <div className="space-y-3 mt-6 max-h-[40vh] overflow-y-auto pr-2">
              {stagedFiles.map(sf => (
                <div key={sf.id} className="bg-brand-elevated p-3 rounded-lg flex items-center gap-4">
                  <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-medium truncate text-brand-text">{sf.file.name}</p>
                    {sf.status === 'error' && <p className="text-xs text-red-400 truncate mt-1">{sf.error}</p>}
                    {sf.status === 'success' && <p className="text-xs text-brand-secondary truncate mt-1">{sf.songDetails?.artist} - {sf.songDetails?.title}</p>}
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={sf.status} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
