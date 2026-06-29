import { useState } from 'react';
import { Bookmark, Clipboard, Trash2, Heart, BookOpen, Star, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark as BookmarkType } from '../types';

interface BookmarksProps {
  bookmarks: BookmarkType[];
  toggleBookmark: (item: BookmarkType) => void;
  setScreen: (screen: string) => void;
  setSelectedSurah: (num: number | null) => void;
}

export default function Bookmarks({ bookmarks, toggleBookmark, setScreen, setSelectedSurah }: BookmarksProps) {
  const [activeTab, setActiveTab] = useState<'verse' | 'dua'>('verse');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredBookmarks = bookmarks.filter((b) => b.type === activeTab);

  const handleCopy = (bookmark: BookmarkType) => {
    const textToCopy = `${bookmark.title}\n\nArabic:\n${bookmark.arabic || ''}\n\nTranslation:\n${bookmark.translation}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(bookmark.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNavigateToSurah = (title: string) => {
    // Ex title: "Al-Fatihah 1:3" -> extract "Al-Fatihah" or find surah number
    // To make it simple, we can extract the Surah name or check bookmarks structure.
    // If the reference starts with popular names, we can set the screen and open.
    // Let's check for surah number: "verse-1-3" -> "1"
    const isVerse = title.includes(':');
    if (isVerse) {
      // Find the corresponding bookmark to parse its id, format is "verse-SURAHNUM-AYAHNUM"
      const found = bookmarks.find(b => b.title === title);
      if (found) {
        const parts = found.id.split('-');
        if (parts.length >= 2) {
          const surahNum = parseInt(parts[1]);
          if (!isNaN(surahNum)) {
            setSelectedSurah(surahNum);
            setScreen('quran-list');
          }
        }
      }
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Category Tabs */}
      <section className="mb-6 flex border-b border-slate-200/50 dark:border-zinc-900/50 select-none">
        <button
          onClick={() => setActiveTab('verse')}
          className={`flex-1 py-3 text-xs uppercase tracking-[0.15em] text-center relative focus:outline-none ${
            activeTab === 'verse'
              ? 'text-[#064E3B] dark:text-[#dfc28d] font-serif italic font-bold'
              : 'text-slate-400 dark:text-zinc-600 hover:text-slate-600'
          }`}
        >
          Saved Verses
          {activeTab === 'verse' && (
            <motion.div
              layoutId="bookmarkTabIndicator"
              className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#064E3B] dark:bg-[#C5A059]"
            />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('dua')}
          className={`flex-1 py-3 text-xs uppercase tracking-[0.15em] text-center relative focus:outline-none ${
            activeTab === 'dua'
              ? 'text-[#064E3B] dark:text-[#dfc28d] font-serif italic font-bold'
              : 'text-slate-400 dark:text-zinc-600 hover:text-slate-600'
          }`}
        >
          Saved Duas
          {activeTab === 'dua' && (
            <motion.div
              layoutId="bookmarkTabIndicator"
              className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#064E3B] dark:bg-[#C5A059]"
            />
          )}
        </button>
      </section>

      {/* Bookmarks Grid / List */}
      <section className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredBookmarks.map((bookmark) => (
            <motion.div
              key={bookmark.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              className="p-5 bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] shadow-sm relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div 
                  onClick={() => handleNavigateToSurah(bookmark.title)}
                  className={`flex items-center gap-2 ${activeTab === 'verse' ? 'cursor-pointer hover:underline' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#ecf5f2] dark:bg-[#15231e] text-[#064E3B] dark:text-[#dfc28d] flex items-center justify-center shrink-0">
                    {activeTab === 'verse' ? <BookOpen className="w-4 h-4" /> : <Heart className="w-4 h-4 fill-current" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {bookmark.title}
                    </h4>
                    {activeTab === 'verse' && (
                      <span className="text-[8px] font-bold text-[#C5A059] uppercase tracking-widest block mt-0.5">
                        Click to read full Surah
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Copy */}
                  <button
                    onClick={() => handleCopy(bookmark)}
                    className="w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 flex items-center justify-center transition-colors relative"
                    title="Copy text"
                  >
                    <Clipboard className="w-4 h-4" />
                    {copiedId === bookmark.id && (
                      <span className="absolute -top-8 right-0 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                        Copied!
                      </span>
                    )}
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => toggleBookmark(bookmark)}
                    className="w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                    title="Remove from saved collection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calligraphy text if exists (verses only) */}
              {bookmark.arabic && (
                <div className="text-right py-2 mb-3">
                  <p className="font-arabic text-arabic text-2xl leading-relaxed text-[#064E3B] dark:text-[#faf6ee]" dir="rtl">
                    {bookmark.arabic}
                  </p>
                </div>
              )}

              {/* Translation text */}
              <div className={`pl-2 border-l-2 border-[#C5A059]/30 dark:border-zinc-800 ${bookmark.arabic ? 'pt-2 mt-2' : ''}`}>
                <p className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed font-serif italic">
                  {bookmark.translation}
                </p>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-zinc-900/30 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Reference: {bookmark.reference}</span>
                <span>Added on {bookmark.dateAdded}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredBookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center select-none animate-fade-in">
            <div className="w-20 h-20 bg-[#faf6ee] dark:bg-[#15231e] rounded-full flex items-center justify-center mb-4 border border-[#C5A059]/25">
              <Bookmark className="w-8 h-8 text-[#C5A059]" />
            </div>
            <h4 className="text-sm font-serif italic font-bold text-[#064E3B] dark:text-zinc-200">
              No Saved {activeTab === 'verse' ? 'Verses' : 'Duas'}
            </h4>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 px-8 max-w-xs leading-relaxed italic">
              When reading the Holy Quran or browsing Duas, click the bookmark icon to build your personalized offline spiritual library.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
