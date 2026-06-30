import { useEffect, useState, useRef } from 'react';
import { BookOpen, Search, Bookmark, BookmarkCheck, Play, Pause, Headphones, Share2, ArrowLeft, Volume2, Copy, AlertCircle, Info, Download, DownloadCloud, Trash2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Surah, Ayah, Bookmark as BookmarkType } from '../types';
import { fetchSurahList, fetchSurahDetail } from '../services/api';
import { saveSurahOffline, removeSurahOffline, getDownloadedSurahIds } from '../utils/offline';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';

interface QuranProps {
  bookmarks: BookmarkType[];
  toggleBookmark: (item: BookmarkType) => void;
  selectedSurah: number | null;
  setSelectedSurah: (num: number | null) => void;
  fontSizeScale: 'standard' | 'large' | 'xlarge';
}

const RECITERS = [
  { id: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy' },
  { id: 'Abdul_Basit_Murattal_128kbps', name: 'Abdul Basit (Murattal)' },
  { id: 'Abdul_Basit_Mujawwad_128kbps', name: 'Abdul Basit (Mujawwad)' },
  { id: 'Husary_128kbps', name: 'Mahmoud Khalil Al-Husary' },
  { id: 'Ghamadi_40kbps', name: 'Saad Al-Ghamdi' },
  { id: 'MaherAlMuaiqly128kbps', name: 'Maher Al-Muaiqly' },
  { id: 'Minshawy_Murattal_128kbps', name: 'Mohamed Siddiq Al-Minshawi' },
  { id: 'Sudaris_128kbps', name: 'Abdul Rahman Al-Sudais' },
];

export default function Quran({ bookmarks, toggleBookmark, selectedSurah, setSelectedSurah, fontSizeScale }: QuranProps) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReciter, setSelectedReciter] = useState<string>(() => {
    return window.localStorage.getItem('user_reciter') || 'Alafasy_128kbps';
  });

  const getArabicSizeClass = () => {
    if (fontSizeScale === 'large') return 'text-4xl leading-[2.4]';
    if (fontSizeScale === 'xlarge') return 'text-5xl leading-[2.6]';
    return 'text-3xl leading-[2.2]';
  };

  // Surah Details state
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [selectedSurahMeta, setSelectedSurahMeta] = useState<Surah | null>(null);

  const [downloadedSurahs, setDownloadedSurahs] = useState<number[]>([]);
  const [downloadingSurahs, setDownloadingSurahs] = useState<number[]>([]);

  useEffect(() => {
    setDownloadedSurahs(getDownloadedSurahIds());
    const handleOfflineUpdate = () => setDownloadedSurahs(getDownloadedSurahIds());
    window.addEventListener('offline-storage-updated', handleOfflineUpdate);
    return () => window.removeEventListener('offline-storage-updated', handleOfflineUpdate);
  }, []);

  const handleDownloadToggle = async (e: React.MouseEvent, surahNum: number) => {
    e.stopPropagation();
    hapticMedium();
    if (downloadedSurahs.includes(surahNum)) {
      removeSurahOffline(surahNum);
    } else {
      setDownloadingSurahs(prev => [...prev, surahNum]);
      try {
        const data = await fetchSurahDetail(surahNum);
        await saveSurahOffline(surahNum, data);
        hapticSuccess();
      } catch (err) {
        console.error('Failed to download', err);
      } finally {
        setDownloadingSurahs(prev => prev.filter(id => id !== surahNum));
      }
    }
  };

  // Audio Player state
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null);
  const [audioState, setAudioState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch surah list on mount
  useEffect(() => {
    async function loadSurahs() {
      try {
        setLoading(true);
        const data = await fetchSurahList();
        setSurahs(data);
      } catch (err) {
        setError('Failed to load Quran chapters. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    }
    loadSurahs();
  }, []);

  // Fetch surah detail when a surah is selected
  useEffect(() => {
    if (selectedSurah === null) {
      setAyahs([]);
      setSelectedSurahMeta(null);
      stopAudio();
      return;
    }

    async function loadSurahDetail() {
      try {
        setDetailLoading(true);
        stopAudio();
        const data = await fetchSurahDetail(selectedSurah);
        setAyahs(data.ayahs);
        setSelectedSurahMeta(data.surah);
      } catch (err) {
        console.error(err);
      } finally {
        setDetailLoading(false);
      }
    }

    loadSurahDetail();
  }, [selectedSurah]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingAyahNumber(null);
    setAudioState('idle');
  };

  // Play audio for a specific verse
  const playAyahAudio = (ayahNumInSurah: number) => {
    if (!selectedSurah) return;

    const surahStr = String(selectedSurah).padStart(3, '0');
    const ayahStr = String(ayahNumInSurah).padStart(3, '0');
    // Using dynamic high-quality recitations from everyayah.com
    const audioUrl = `https://everyayah.com/data/${selectedReciter}/${surahStr}${ayahStr}.mp3`;

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    } else {
      audio.pause();
    }
    
    audio.src = audioUrl;
    setPlayingAyahNumber(ayahNumInSurah);
    setAudioState('playing');

    audio.play().catch((err) => {
      console.warn('Audio streaming blocked or network offline:', err);
      setAudioState('idle');
      setPlayingAyahNumber(null);
    });

    // Auto-advance or stop when audio ends
    audio.onended = () => {
      // Re-query ayahs from state since closure might be stale (React setState dependency)
      // Actually, ayahs is stable for the surah, but let's use a function to be safe if it were to change
      setPlayingAyahNumber((currentPlaying) => {
        if (currentPlaying === null) return null;
        
        // Find next ayah using the current ayahs array from the component scope
        // Note: ayahs is set once on mount of surah detail, so the closure value is accurate.
        const nextAyah = ayahs.find(a => a.numberInSurah === currentPlaying + 1);
        if (nextAyah) {
          // Defer to next tick to allow state updates to settle before playing next
          setTimeout(() => playAyahAudio(nextAyah.numberInSurah), 50);
          return currentPlaying; // Keep current until next starts, or just let playAyahAudio update it
        } else {
          setAudioState('idle');
          return null;
        }
      });
    };
  };

  const togglePlayPause = (ayahNumInSurah: number) => {
    hapticLight();
    if (playingAyahNumber === ayahNumInSurah && audioState === 'playing') {
      if (audioRef.current) {
        audioRef.current.pause();
        setAudioState('paused');
      }
    } else if (playingAyahNumber === ayahNumInSurah && audioState === 'paused') {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        setAudioState('playing');
      }
    } else {
      playAyahAudio(ayahNumInSurah);
    }
  };

  const handleCopyVerse = (ayah: Ayah) => {
    hapticLight();
    const text = `Surah ${selectedSurahMeta?.englishName} (${selectedSurah}:${ayah.numberInSurah})\n\n${ayah.text}\n\n${ayah.translation}`;
    navigator.clipboard.writeText(text);
  };

  const handleBookmarkToggle = (ayah: Ayah) => {
    hapticLight();
    toggleBookmark({
      id: `verse-${selectedSurah}-${ayah.numberInSurah}`,
      type: 'verse',
      title: `${selectedSurahMeta?.englishName} ${selectedSurah}:${ayah.numberInSurah}`,
      arabic: ayah.text,
      translation: ayah.translation,
      reference: `${selectedSurahMeta?.englishName} ${selectedSurah}:${ayah.numberInSurah}`,
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
  };

  // Filter surahs based on search query
  const filteredSurahs = surahs.filter((s) => {
    const query = searchQuery.toLowerCase();
    return (
      s.englishName.toLowerCase().includes(query) ||
      s.englishNameTranslation.toLowerCase().includes(query) ||
      s.number.toString().includes(query)
    );
  });

  // Render Surah detail view
  if (selectedSurah !== null && selectedSurahMeta) {
    const activeReciterName = RECITERS.find(r => r.id === selectedReciter)?.name || 'Mishary Alafasy';

    return (
      <div className="animate-fade-in pb-24">
        {/* Floating Mini Audio Bar if playing */}
        {playingAyahNumber !== null && (
          <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto bg-primary text-white rounded-[24px] p-4 shadow-xl border border-[#C5A059]/30 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-[#C5A059] animate-pulse" />
              <div>
                <p className="text-xs font-bold text-[#dfc28d]">{activeReciterName}</p>
                <p className="text-[10px] text-slate-200 font-serif italic">
                  Surah {selectedSurahMeta.englishName} • Verse {playingAyahNumber}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => stopAudio()}
              className="text-xs px-3 py-1.5 bg-[#C5A059] hover:bg-[#b08e4f] text-white rounded-lg font-bold uppercase tracking-wider"
            >
              Stop
            </button>
          </div>
        )}

        {/* Bismillah Header / Surah Banner */}
        <section className="mb-6 text-center select-none">
          <div className="bg-gold-container dark:bg-[#15231e] border border-[#C5A059]/25 rounded-[32px] p-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 bottom-0 right-0 opacity-5 pointer-events-none bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:12px_16px]"></div>
            
            <h3 className="text-2xl font-serif italic font-semibold text-primary dark:text-zinc-50 tracking-tight">
              {selectedSurahMeta.englishName}
            </h3>
            <p className="text-[10px] font-bold text-[#C5A059] dark:text-[#dfc28d] uppercase tracking-[0.2em] mt-1.5">
              {selectedSurahMeta.englishNameTranslation} • {selectedSurahMeta.numberOfAyahs} Ayahs
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-[9px] font-bold uppercase tracking-wider bg-[#ecf5f2] dark:bg-[#032b21] text-[#064E3B] dark:text-emerald-400 px-3.5 py-1 border border-[#064E3B]/10 rounded-full">
                {selectedSurahMeta.revelationType}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-800 text-[#C5A059] dark:text-[#dfc28d] px-3.5 py-1 border border-[#C5A059]/15 rounded-full">
                Surah #{selectedSurahMeta.number}
              </span>
            </div>

            {/* Reciter Selector */}
            <div className="mt-5 pt-4 border-t border-[#C5A059]/15 max-w-xs mx-auto">
              <label className="block text-[9px] font-bold text-slate-400 dark:text-[#dfc28d] uppercase tracking-wider mb-1.5">
                Quran Reciter Voice
              </label>
              <select
                value={selectedReciter}
                onChange={(e) => {
                  setSelectedReciter(e.target.value);
                  window.localStorage.setItem('user_reciter', e.target.value);
                  stopAudio();
                }}
                className="w-full bg-white dark:bg-zinc-900 border border-[#C5A059]/20 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Bismillah Text (except Surah At-Tawbah) */}
        {selectedSurah !== 9 && (
          <section className="mb-6 text-center select-none py-4 border-b border-slate-200/30 dark:border-zinc-900/30">
            <h4 className="font-arabic text-3xl text-[#064E3B] dark:text-[#faf6ee] leading-relaxed">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </h4>
            <p className="text-[10px] text-[#C5A059] uppercase tracking-widest mt-2">
              In the name of Allah, the Entirely Merciful, the Especially Merciful.
            </p>
          </section>
        )}

        {/* Loading detail state */}
        {detailLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#064E3B] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold mt-4">
              Loading classical Arabic scripts...
            </p>
          </div>
        ) : (
          <section className="space-y-6">
            {ayahs.map((ayah) => {
              const isBookmarked = bookmarks.some((b) => b.id === `verse-${selectedSurah}-${ayah.numberInSurah}`);
              const isPlaying = playingAyahNumber === ayah.numberInSurah;

              return (
                <div
                  key={ayah.number}
                  className={`p-6 rounded-[28px] border transition-all ${
                    isPlaying
                      ? 'bg-[#faf6ee] dark:bg-[#121c19] border-[#C5A059]/40 shadow-md'
                      : 'bg-white dark:bg-[#0f1513] border-slate-200/50 dark:border-zinc-900/50 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-zinc-900/30 pb-3">
                    <span className="w-7 h-7 bg-[#ecf5f2] dark:bg-zinc-900 text-[#064E3B] dark:text-[#dfc28d] rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm font-mono">
                      {ayah.numberInSurah}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Audio Play Trigger */}
                      <button
                        onClick={() => togglePlayPause(ayah.numberInSurah)}
                        className={`w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center justify-center transition-colors ${
                          isPlaying
                            ? 'text-[#C5A059]'
                            : 'text-slate-400 hover:text-[#064E3B] dark:hover:text-[#dfc28d]'
                        }`}
                        title="Stream recitation"
                      >
                        {isPlaying && audioState === 'playing' ? (
                          <Pause className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>

                      {/* Copy */}
                      <button
                        onClick={() => handleCopyVerse(ayah)}
                        className="w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-400 hover:text-[#064E3B] dark:hover:text-[#dfc28d] flex items-center justify-center transition-colors"
                        title="Copy verse"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Bookmark toggle */}
                      <button
                        onClick={() => handleBookmarkToggle(ayah)}
                        className={`w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center justify-center transition-colors ${
                          isBookmarked
                            ? 'text-[#064E3B] dark:text-[#dfc28d]'
                            : 'text-slate-400 hover:text-[#064E3B] dark:hover:text-[#dfc28d]'
                        }`}
                        title="Save to bookmarks"
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text (Right-Aligned) */}
                  <div className="text-right py-2">
                    <p className={`font-arabic text-arabic text-[#064E3B] dark:text-[#faf6ee] tracking-wide ${getArabicSizeClass()}`} dir="rtl">
                      {ayah.text}
                    </p>
                  </div>

                  {/* Translation Text (Left-Aligned) */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-900/30 pl-2">
                    <p className="text-slate-700 dark:text-zinc-200 text-base font-serif italic leading-relaxed">
                      {ayah.translation}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    );
  }

  // Render chapters list view
  return (
    <div className="animate-fade-in pb-24">
      {/* Search Input Section */}
      <section className="mb-6 relative">
        <div className="flex items-center bg-[#faf6ee]/50 dark:bg-[#0f1513]/50 border border-slate-200/50 dark:border-zinc-900/50 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#064E3B]/20 focus-within:bg-white dark:focus-within:bg-[#0d1311] transition-all">
          <Search className="w-4 h-4 text-[#C5A059] mr-3" />
          <input
            type="text"
            placeholder="Search Surah index (e.g. Al-Kahf)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 dark:placeholder-zinc-600 focus:ring-0 w-full outline-none"
          />
        </div>
      </section>

      {/* Chapters Index List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-[#064E3B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold mt-4">
            Loading Holy Quran chapters...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-red-800 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs bg-red-600 text-white font-semibold px-4 py-2 rounded-xl"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSurahs.map((surah) => (
            <div
              key={surah.number}
              onClick={() => setSelectedSurah(surah.number)}
              className="p-4 bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 hover:border-[#064E3B]/30 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center gap-4">
                {/* Surah Number Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#ecf5f2] dark:bg-[#15231e] text-[#064E3B] dark:text-[#dfc28d] flex items-center justify-center font-bold text-xs font-mono shadow-inner group-hover:bg-[#064E3B] group-hover:text-white dark:group-hover:text-white transition-colors duration-300">
                  {surah.number}
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-[#064E3B] dark:group-hover:text-[#dfc28d] transition-colors">
                    {surah.englishName}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {surah.englishNameTranslation} • {surah.numberOfAyahs} Ayahs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right mr-2">
                  <p className="font-arabic text-2xl text-[#064E3B] dark:text-zinc-100 leading-none">
                    {surah.name}
                  </p>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-[#C5A059] bg-[#faf6ee] dark:bg-zinc-900 border border-[#C5A059]/10 px-2.5 py-0.5 rounded-full inline-block mt-2">
                    {surah.revelationType}
                  </span>
                </div>
                
                <button
                  onClick={(e) => handleDownloadToggle(e, surah.number)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    downloadedSurahs.includes(surah.number)
                      ? 'bg-[#064E3B] text-white'
                      : 'bg-[#faf6ee] dark:bg-zinc-800 text-slate-400 hover:text-[#064E3B]'
                  }`}
                  disabled={downloadingSurahs.includes(surah.number)}
                  title={downloadedSurahs.includes(surah.number) ? "Remove Download" : "Download for offline"}
                >
                  {downloadingSurahs.includes(surah.number) ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : downloadedSurahs.includes(surah.number) ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <DownloadCloud className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {filteredSurahs.length === 0 && (
            <div className="text-center py-16 text-slate-400 dark:text-zinc-600">
              <p className="text-xs font-semibold">No Chapters found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
