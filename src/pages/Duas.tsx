import { useState } from 'react';
import { Heart, Search, Copy, Share2, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Star, Info, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dua, Bookmark as BookmarkType } from '../types';
import { OFFLINE_DUAS } from '../data/duas';

interface DuasProps {
  bookmarks: BookmarkType[];
  toggleBookmark: (item: BookmarkType) => void;
}

export default function Duas({ bookmarks, toggleBookmark }: DuasProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedDuaId, setExpandedDuaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const categories = ['All', 'Morning & Evening', 'Patience', 'Forgiveness', 'Protection', 'Health', 'Travel'];

  // Filter duas by category and search query
  const filteredDuas = OFFLINE_DUAS.filter((dua) => {
    const matchesCategory = selectedCategory === 'All' || dua.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      dua.title.toLowerCase().includes(query) ||
      dua.translation.toLowerCase().includes(query) ||
      (dua.transliteration && dua.transliteration.toLowerCase().includes(query)) ||
      dua.arabic.includes(query);

    return matchesCategory && matchesSearch;
  });

  const handleCopy = (dua: Dua) => {
    const textToCopy = `${dua.title}\n\nArabic:\n${dua.arabic}\n\nTransliteration:\n${dua.transliteration || ''}\n\nTranslation:\n${dua.translation}\n\nSource: ${dua.reference}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(dua.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBookmarkToggle = (dua: Dua) => {
    toggleBookmark({
      id: dua.id,
      type: 'dua',
      title: dua.title,
      arabic: dua.arabic,
      translation: dua.translation,
      reference: dua.reference,
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
  };

  const playRecitation = (dua: Dua) => {
    if (playingId === dua.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingId(dua.id);

    const msg = new SpeechSynthesisUtterance();
    msg.text = dua.arabic;
    msg.lang = 'ar-SA';
    msg.onend = () => setPlayingId(null);
    msg.onerror = () => setPlayingId(null);
    
    // Fallback to reading the translation if Arabic voice is not available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    
    if (arabicVoice) {
      msg.voice = arabicVoice;
      window.speechSynthesis.speak(msg);
    } else {
      // Speak translation if no Arabic voice
      msg.text = dua.translation;
      msg.lang = 'en-US';
      window.speechSynthesis.speak(msg);
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Description Header */}
      <section className="mb-6">
        <div className="bg-[#faf6ee] dark:bg-[#15231e] border border-[#C5A059]/20 rounded-[28px] p-5 shadow-sm">
          <h3 className="text-sm font-serif italic font-semibold text-[#064E3B] dark:text-[#dfc28d] uppercase tracking-wider">
            Supplications & Adhkar
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Browse authentic Duas from the Holy Quran & Hisnul Muslim offline.
          </p>
        </div>
      </section>

      {/* Search Input */}
      <section className="mb-6 relative">
        <div className="flex items-center bg-[#faf6ee]/50 dark:bg-[#0f1513]/50 border border-slate-200/50 dark:border-zinc-900/50 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#064E3B]/20 focus-within:bg-white dark:focus-within:bg-[#0d1311] transition-all">
          <Search className="w-4 h-4 text-[#C5A059] mr-3" />
          <input
            type="text"
            placeholder="Search Duas (e.g. Forgiveness)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-sm text-slate-900 dark:text-zinc-50 placeholder-slate-400 dark:placeholder-zinc-600 focus:ring-0 w-full outline-none"
          />
        </div>
      </section>

      {/* Horizontal categories list */}
      <section className="mb-6 select-none no-scrollbar overflow-x-auto flex gap-2 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-serif italic whitespace-nowrap transition-all focus:outline-none border ${
              selectedCategory === cat
                ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/10'
                : 'bg-[#faf6ee] dark:bg-[#15231e] text-slate-500 dark:text-zinc-400 border-slate-200/50 dark:border-zinc-900/40 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Duas List */}
      <section className="space-y-4">
        {filteredDuas.map((dua) => {
          const isBookmarked = bookmarks.some((b) => b.id === dua.id);
          const isExpanded = expandedDuaId === dua.id;

          return (
            <div
              key={dua.id}
              className={`p-5 rounded-[28px] border transition-all ${
                isExpanded
                  ? 'bg-white dark:bg-[#121c19] border-[#C5A059]/40 shadow-md'
                  : 'bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 hover:border-[#064E3B]/30 shadow-sm'
              }`}
            >
              {/* Header Tapping zone */}
              <div
                onClick={() => setExpandedDuaId(isExpanded ? null : dua.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#ecf5f2] dark:bg-[#15231e] text-[#064E3B] dark:text-[#dfc28d] flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 pr-4">
                      {dua.title}
                    </h4>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#C5A059] bg-[#faf6ee] dark:bg-[#15231e] border border-[#C5A059]/10 px-2.5 py-0.5 rounded-full inline-block mt-2">
                      {dua.category}
                    </span>
                  </div>
                </div>

                <div className="text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expended Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-5 border-t border-slate-100 dark:border-zinc-900/30 text-center space-y-4">
                      {/* Arabic script */}
                      <p className="font-arabic text-arabic text-3xl text-[#064E3B] dark:text-[#faf6ee] leading-relaxed py-2 px-2" dir="rtl">
                        {dua.arabic}
                      </p>

                      {/* Transliteration */}
                      {dua.transliteration && (
                        <p className="text-[#064E3B] dark:text-[#dfc28d] text-xs italic font-medium leading-relaxed bg-[#ecf5f2] dark:bg-[#15231e] border border-[#064E3B]/10 p-3 rounded-2xl">
                          {dua.transliteration}
                        </p>
                      )}

                      {/* Translation */}
                      <p className="text-slate-700 dark:text-zinc-300 text-sm font-serif italic leading-relaxed">
                        {dua.translation}
                      </p>

                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                        Source: {dua.reference}
                      </p>

                      {/* Expandable card actions */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-900/10">
                        <button
                          onClick={() => playRecitation(dua)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            playingId === dua.id
                              ? 'bg-[#ecf5f2] dark:bg-[#15231e] text-[#064E3B] dark:text-[#dfc28d]'
                              : 'bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                          }`}
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${playingId === dua.id ? 'animate-pulse' : ''}`} />
                          <span>{playingId === dua.id ? 'Playing' : 'Listen'}</span>
                        </button>

                        <button
                          onClick={() => handleCopy(dua)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300 flex items-center gap-1.5 transition-colors relative"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                          {copiedId === dua.id && (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                              Copied!
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => handleBookmarkToggle(dua)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            isBookmarked
                              ? 'bg-[#ecf5f2] dark:bg-[#15231e] text-[#064E3B] dark:text-[#dfc28d]'
                              : 'bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                          }`}
                        >
                          {isBookmarked ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredDuas.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-zinc-600">
            <p className="text-xs font-semibold">No Duas found matching "{searchQuery}"</p>
          </div>
        )}
      </section>

      {/* Dua Etiquette Notice */}
      <section className="mt-6">
        <div className="p-5 bg-[#064E3B]/5 dark:bg-[#15231e]/50 rounded-[28px] border border-[#C5A059]/25 flex items-start gap-4">
          <Info className="w-5 h-5 text-[#C5A059] mt-0.5 shrink-0" />
          <div className="text-left">
            <h5 className="text-xs font-serif italic font-bold text-[#064E3B] dark:text-[#dfc28d] uppercase tracking-wider">
              Dua Etiquette (Adab)
            </h5>
            <p className="text-[11px] text-emerald-950/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
              Begin with praising Allah, sending blessings upon the Prophet (ﷺ), facing the Qibla if possible, and raising your hands with humility and absolute conviction.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
