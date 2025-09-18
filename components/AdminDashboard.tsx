import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { SongData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface AdminDashboardProps {
  addSongs: (songs: SongData[]) => Promise<void>;
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

const SingleSongUploader: React.FC<{ addSongs: (songs: SongData[]) => Promise<void> }> = ({ addSongs }) => {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [album, setAlbum] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
    const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverArtFile(file);
            if (coverArtPreview) URL.revokeObjectURL(coverArtPreview);
            setCoverArtPreview(URL.createObjectURL(file));
        }
    };

    const handleFetchInfo = async () => {
        if (!title) {
            setError('Please enter a song title to fetch info.');
            return;
        }
        setIsFetching(true);
        setError(null);
        try {
            const searchTerm = encodeURIComponent(title);
            const response = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=1`);
            if (!response.ok) throw new Error('Failed to fetch from iTunes.');
            const data = await response.json();
            if (data.resultCount === 0) throw new Error(`No results found for "${title}".`);

            const result = data.results[0];
            setArtist(result.artistName);
            setAlbum(result.collectionName);

            const highResArtworkUrl = result.artworkUrl100.replace('100x100', '600x600');
            const artResponse = await fetch(highResArtworkUrl);
            const artBlob = await artResponse.blob();
            const artFile = new File([artBlob], 'cover.jpg', { type: artBlob.type });
            setCoverArtFile(artFile);
            if (coverArtPreview) URL.revokeObjectURL(coverArtPreview);
            setCoverArtPreview(URL.createObjectURL(artFile));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !artist || !album || !audioFile || !coverArtFile) {
            setError("All fields, including audio and cover art, are required.");
            return;
        }
        setIsSubmitting(true);
        const newSongData: SongData = {
            title,
            artist,
            album,
            audioFile,
            coverArtFile,
        };
        await addSongs([newSongData]);
        
        // Reset form
        setTitle('');
        setArtist('');
        setAlbum('');
        setAudioFile(null);
        setCoverArtFile(null);
        if (coverArtPreview) URL.revokeObjectURL(coverArtPreview);
        setCoverArtPreview(null);
        setError(null);
        (e.target as HTMLFormElement).reset();
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}
             <div className="flex items-end gap-3">
                <div className="flex-grow">
                    <label htmlFor="title" className="block text-sm font-medium text-brand-secondary mb-1">Song Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Blinding Lights" className="w-full bg-brand-elevated border border-brand-elevated rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                </div>
                <button type="button" onClick={handleFetchInfo} disabled={isFetching || isSubmitting} className="px-4 py-2 text-sm font-bold text-brand-bg bg-brand-primary rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                    {isFetching ? 'Fetching...' : 'Fetch Info'}
                </button>
            </div>
             <div>
                <label htmlFor="artist" className="block text-sm font-medium text-brand-secondary mb-1">Artist</label>
                <input type="text" id="artist" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="e.g., The Weeknd" className="w-full bg-brand-elevated border border-brand-elevated rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
            </div>
             <div>
                <label htmlFor="album" className="block text-sm font-medium text-brand-secondary mb-1">Album</label>
                <input type="text" id="album" value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="e.g., After Hours" className="w-full bg-brand-elevated border border-brand-elevated rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="audioFile" className="block text-sm font-medium text-brand-secondary mb-1">Audio File</label>
                    <input type="file" id="audioFile" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="w-full text-sm text-brand-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-brand-bg hover:file:bg-opacity-90"/>
                 </div>
                 <div className="flex items-center gap-4">
                    {coverArtPreview && <img src={coverArtPreview} alt="Cover art preview" className="w-16 h-16 rounded-md object-cover"/>}
                    <div className="flex-grow">
                        <label htmlFor="coverArtFile" className="block text-sm font-medium text-brand-secondary mb-1">Cover Art</label>
                        <input type="file" id="coverArtFile" accept="image/*" onChange={handleCoverArtChange} className="w-full text-sm text-brand-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-elevated file:text-brand-text hover:file:bg-opacity-80"/>
                    </div>
                 </div>
             </div>
             <button type="submit" disabled={isSubmitting} className="w-full py-3 font-bold text-brand-bg bg-brand-primary rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Adding...' : 'Add Song to Library'}
            </button>
        </form>
    );
};


const BulkUploader: React.FC<{ addSongs: (songs: SongData[]) => Promise<void> }> = ({ addSongs }) => {
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
        album: songData.collectionName || title,
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
  
  const handleAddSongsToLibrary = async () => {
    const successfulFiles = stagedFiles.filter(sf => sf.status === 'success');
    if (successfulFiles.length === 0) return;

    const newSongsData: SongData[] = successfulFiles.map(sf => ({
      title: sf.songDetails!.title,
      artist: sf.songDetails!.artist,
      album: sf.songDetails!.album,
      audioFile: sf.file,
      coverArtFile: sf.coverArtFile!,
    }));

    await addSongs(newSongsData);
    setStagedFiles([]);
    setProcessedCount(0);
  };

  const successfulCount = stagedFiles.filter(s => s.status === 'success').length;
  const pendingCount = stagedFiles.filter(s => s.status === 'pending').length;

  return (
    <div>
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
              <div className="my-4">
                <div className="w-full bg-brand-elevated rounded-full h-2.5">
                    <div 
                    className="bg-brand-primary h-2.5 rounded-full transition-all duration-300 ease-linear" 
                    style={{width: `${stagedFiles.length > 0 ? (processedCount / stagedFiles.length) * 100 : 0}%`}}
                    ></div>
                </div>
                <p className="text-xs text-center mt-2 text-brand-secondary">{processedCount} / {stagedFiles.length} files processed</p>
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
  );
};


export const AdminDashboard: React.FC<AdminDashboardProps> = ({ addSongs, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'bulk' | 'single'>('bulk');
    
    const tabClasses = (tabName: 'bulk' | 'single') => 
        `px-4 py-2 font-semibold text-sm rounded-t-lg transition-all border-b-2 ${
            activeTab === tabName 
            ? 'text-brand-primary border-brand-primary' 
            : 'text-brand-secondary border-transparent hover:text-brand-text'
        }`;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans p-4 sm:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-brand-primary">Admin Dashboard</h1>
        <button onClick={onLogout} className="px-4 py-2 text-sm font-medium bg-brand-elevated rounded-full hover:bg-opacity-80 transition-all">Logout</button>
      </header>

      <div className="max-w-4xl mx-auto bg-brand-surface p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="flex border-b border-brand-elevated mb-6">
            <button onClick={() => setActiveTab('bulk')} className={tabClasses('bulk')}>
                Bulk Upload
            </button>
            <button onClick={() => setActiveTab('single')} className={tabClasses('single')}>
                Single Song
            </button>
        </div>

        {activeTab === 'bulk' ? <BulkUploader addSongs={addSongs} /> : <SingleSongUploader addSongs={addSongs} />}
        
      </div>
    </div>
  );
};
