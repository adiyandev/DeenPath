import { useEffect, useState } from 'react';
import { Compass, BookOpen, Heart, Settings, Clock, Share2, Clipboard, Bookmark, BookmarkCheck, DownloadCloud } from 'lucide-react';
import { motion } from 'motion/react';
import { PrayerData, Bookmark as BookmarkType } from '../types';
import { useTranslation } from '../utils/i18n';
import { hapticLight, hapticMedium } from '../utils/haptics';

interface HomeProps {
  prayerData: PrayerData;
  setScreen: (screen: string) => void;
  bookmarks: BookmarkType[];
  toggleBookmark: (item: BookmarkType) => void;
  userName: string;
}

export default function Home({ prayerData, setScreen, bookmarks, toggleBookmark, userName }: HomeProps) {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [countdownStr, setCountdownStr] = useState<string>('00:00:00');
  const [nextPrayerName, setNextPrayerName] = useState<string>('Maghrib');
  const [nextPrayerTimeStr, setNextPrayerTimeStr] = useState<string>('20:45');
  const [copied, setCopied] = useState(false);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [downloadedCount, setDownloadedCount] = useState(0);

  const navigate = (screen: string) => {
    hapticLight();
    setScreen(screen);
  };

  useEffect(() => {
    setTasbihCount(parseInt(window.localStorage.getItem('tasbih_total') || '0', 10));
    
    // Check offline downloads count
    const updateOfflineCount = () => {
      try {
        const ids = window.localStorage.getItem('deenpath_offline_list');
        if (ids) {
          const parsed = JSON.parse(ids);
          setDownloadedCount(parsed.length);
        } else {
          setDownloadedCount(0);
        }
      } catch {
        setDownloadedCount(0);
      }
    };
    
    updateOfflineCount();
    window.addEventListener('offline-storage-updated', updateOfflineCount);
    return () => window.removeEventListener('offline-storage-updated', updateOfflineCount);
  }, []);

  // Daily Verse (Al-Baqarah 2:152)
  const dailyVerse = {
    id: 'daily-verse-1',
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    translation: '“So remember Me; I will remember you. And be grateful to Me and do not deny Me.”',
    reference: 'Surah Al-Baqarah 2:152',
    type: 'verse' as const,
  };

  const isVerseBookmarked = bookmarks.some((b) => b.id === dailyVerse.id);

  // Update real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute countdown to next prayer
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const timings = prayerData.times;
      
      const prayerList = [
        { name: 'Fajr', time: timings.Fajr },
        { name: 'Sunrise', time: timings.Sunrise },
        { name: 'Dhuhr', time: timings.Dhuhr },
        { name: 'Asr', time: timings.Asr },
        { name: 'Maghrib', time: timings.Maghrib },
        { name: 'Isha', time: timings.Isha },
      ];

      // Parse HH:MM into a date today
      const parsedPrayers = prayerList.map((p) => {
        const [hours, minutes] = p.time.split(':').map(Number);
        const prayerDate = new Date(now);
        prayerDate.setHours(hours, minutes, 0, 0);
        return { name: p.name, date: prayerDate, timeStr: p.time };
      });

      // Find the next upcoming prayer today
      let nextPrayer = parsedPrayers.find((p) => p.date > now);

      // If no prayer is left today, the next prayer is Fajr tomorrow
      if (!nextPrayer) {
        const firstPrayer = parsedPrayers[0];
        const tomorrowFajr = new Date(firstPrayer.date);
        tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
        nextPrayer = { name: 'Fajr', date: tomorrowFajr, timeStr: firstPrayer.timeStr };
      }

      setNextPrayerName(nextPrayer.name);
      setNextPrayerTimeStr(nextPrayer.timeStr);

      // Calculate difference in seconds
      const diffMs = nextPrayer.date.getTime() - now.getTime();
      const totalSecs = Math.max(0, Math.floor(diffMs / 1000));

      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;

      const pad = (num: number) => String(num).padStart(2, '0');
      setCountdownStr(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentTime, prayerData]);

  // Handle Share / Clipboard Copy
  const handleCopy = () => {
    hapticLight();
    const textToCopy = `Daily Verse - ${dailyVerse.reference}\n\n${dailyVerse.arabic}\n\n${dailyVerse.translation}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmarkToggle = () => {
    hapticLight();
    toggleBookmark({
      id: dailyVerse.id,
      type: dailyVerse.type,
      title: dailyVerse.reference,
      arabic: dailyVerse.arabic,
      translation: dailyVerse.translation,
      reference: dailyVerse.reference,
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
  };

  // Convert "13:05" to "01:05 PM"
  const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Greetings block */}
      <section className="mb-6">
        <div className="bg-[#faf6ee]/80 dark:bg-[#0f1513]/50 rounded-3xl p-6 border border-[#C5A059]/20 dark:border-zinc-900/50 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-[#C5A059] dark:text-[#dfc28d] uppercase tracking-[0.2em] mb-1">
              {prayerData.hijri.weekday.en}, {prayerData.hijri.day} {prayerData.hijri.month.en} {prayerData.hijri.year} AH
            </p>
            <h2 className="text-2xl font-serif italic text-[#064E3B] dark:text-zinc-100 mt-1">
              Assalamu Alaikum, {userName || 'Ahmed'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 italic">
              May your day be enriched with mindfulness and peace.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none bg-radial-gradient from-[#C5A059] to-transparent"></div>
        </div>
      </section>

      {/* Hero Card: Next Prayer Countdown */}
      <section className="mb-6">
        <div className="relative h-64 rounded-[36px] overflow-hidden shadow-md border border-[#032b21]/40 group">
          {/* Elegant Twilight/Dawn background overlay utilizing rich CSS gradients */}
          <div className="absolute inset-0 z-0 bg-[#064E3B] transition-transform duration-700 group-hover:scale-105">
            {/* Circular architectural details matching the Editorial wireframe */}
            <div className="absolute -right-12 -top-12 w-64 h-64 border border-white/10 rounded-full"></div>
            <div className="absolute -right-20 -top-20 w-80 h-80 border border-white/5 rounded-full"></div>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px]"></div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent z-10"></div>
          
          <div className="absolute inset-0 p-8 z-20 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-white backdrop-blur-md bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Upcoming Prayer
                </span>
                <h3 className="text-5xl font-serif italic text-white mt-5 tracking-tight">
                  {nextPrayerName}
                </h3>
                <p className="text-[#dfc28d] text-sm font-medium mt-1">
                  at {formatTime12h(nextPrayerTimeStr)}
                </p>
              </div>
              
              <div className="text-right">
                <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3 text-[#C5A059]" /> {prayerData.location.split(',')[0]}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.15em]">
                  Local Time
                </p>
                <p className="text-white/95 text-xs font-semibold mt-0.5 font-mono">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
              
              <div className="bg-[#C5A059] text-white rounded-2xl px-4 py-2.5 text-center shadow-lg relative overflow-hidden">
                <p className="font-mono text-2xl font-bold leading-none tracking-tight">
                  {countdownStr}
                </p>
                <p className="text-[8px] text-white/80 uppercase tracking-widest font-bold mt-1">
                  Remaining
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Bento Actions Row */}
      <section className="mb-6 select-none">
        <h4 className="text-[10px] font-bold text-[#C5A059] dark:text-[#dfc28d] uppercase tracking-[0.2em] mb-3 pl-1">
          App Features
        </h4>
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => navigate('prayer-times')}
            className="flex flex-col items-center p-3 rounded-2xl bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 shadow-sm transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-full bg-[#ecf5f2] dark:bg-[#15231e] text-[#064E3B] dark:text-[#dfc28d] flex items-center justify-center mb-2 group-hover:bg-[#064E3B] group-hover:text-white dark:group-hover:text-white transition-colors duration-300">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-serif italic text-slate-800 dark:text-zinc-300">Times</span>
          </button>

          <button
            onClick={() => navigate('quran-list')}
            className="flex flex-col items-center p-3 rounded-2xl bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 shadow-sm transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-full bg-[#ecf5f2] dark:bg-[#15231e] text-[#064E3B] dark:text-[#dfc28d] flex items-center justify-center mb-2 group-hover:bg-[#064E3B] group-hover:text-white dark:group-hover:text-white transition-colors duration-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-serif italic text-slate-800 dark:text-zinc-300">Quran</span>
          </button>

          <button
            onClick={() => navigate('qibla')}
            className="flex flex-col items-center p-3 rounded-2xl bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 shadow-sm transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-full bg-[#ecf5f2] dark:bg-[#15231e] text-[#064E3B] dark:text-[#dfc28d] flex items-center justify-center mb-2 group-hover:bg-[#064E3B] group-hover:text-white dark:group-hover:text-white transition-colors duration-300">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-serif italic text-slate-800 dark:text-zinc-300">Qibla</span>
          </button>

          <button
            onClick={() => navigate('duas')}
            className="flex flex-col items-center p-3 rounded-2xl bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 shadow-sm transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-full bg-[#ecf5f2] dark:bg-[#15231e] text-[#064E3B] dark:text-[#dfc28d] flex items-center justify-center mb-2 group-hover:bg-[#064E3B] group-hover:text-white dark:group-hover:text-white transition-colors duration-300">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-serif italic text-slate-800 dark:text-zinc-300">Duas</span>
          </button>
        </div>
      </section>

      {/* Featured: Daily Verse */}
      <section className="mb-6">
        <div className="bg-white dark:bg-[#0f1513] rounded-[32px] p-6 border border-slate-200/50 dark:border-zinc-900/50 shadow-sm relative overflow-hidden">
          {/* Subtle floral background decor using css radial gradients */}
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-[#C5A059]/5 blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#faf6ee] dark:bg-[#15231e] border border-[#C5A059]/20 text-[#C5A059] dark:text-[#dfc28d] text-[10px] font-bold uppercase tracking-wider">
              {t('dailyVerse')}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 flex items-center justify-center transition-colors relative"
                title="Copy text"
              >
                <Clipboard className="w-4 h-4" />
                {copied && (
                  <span className="absolute -top-8 right-0 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                    Copied!
                  </span>
                )}
              </button>
              <button
                onClick={handleBookmarkToggle}
                className={`w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-900 flex items-center justify-center transition-colors ${
                  isVerseBookmarked
                    ? 'text-[#064E3B] dark:text-[#dfc28d]'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
                }`}
                title={isVerseBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
              >
                {isVerseBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-center py-4 px-2">
            <p className="font-arabic text-arabic text-3xl text-[#064E3B] dark:text-[#faf6ee] leading-relaxed font-normal" dir="rtl">
              {dailyVerse.arabic}
            </p>
            
            <div className="h-px w-16 bg-[#C5A059]/30 mx-auto my-5"></div>
            
            <p className="text-slate-700 dark:text-zinc-200 text-base font-serif italic leading-relaxed">
              {dailyVerse.translation}
            </p>
            <p className="text-[10px] font-bold text-[#C5A059] dark:text-[#dfc28d] uppercase tracking-[0.2em] mt-4 underline underline-offset-4">
              {dailyVerse.reference}
            </p>
          </div>
        </div>
      </section>

      {/* Daily Goal Tracker */}
      <section className="mb-4">
        <div className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 p-6 rounded-[28px] shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-serif italic text-slate-800 dark:text-zinc-100">
                Daily Remembrance Goal
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 uppercase tracking-wider">
                Strive for consistent, daily peace
              </p>
            </div>
            <span className="text-sm font-bold text-[#064E3B] dark:text-[#dfc28d]">{Math.min(100, Math.floor((tasbihCount / 100) * 100))}%</span>
          </div>
          
          <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#064E3B] dark:bg-[#C5A059] rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min(100, (tasbihCount / 100) * 100)}%` }} 
            />
          </div>
          
          <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            <span>Dhikr Count: {tasbihCount}/100</span>
            <span className="text-[#C5A059]">Daily Goal</span>
          </div>
        </div>
      </section>

      {/* Offline Library Widget */}
      <section className="mb-4">
        <div 
          onClick={() => navigate('quran-list')}
          className="bg-[#064E3B] dark:bg-[#15231e] rounded-[28px] p-5 border border-[#064E3B]/20 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform shadow-md relative overflow-hidden group"
        >
          {/* Decorative radial gradient */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#C5A059]/10 blur-2xl pointer-events-none group-hover:bg-[#C5A059]/20 transition-colors" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-white/10 dark:bg-white/5 flex items-center justify-center">
              <DownloadCloud className="w-6 h-6 text-[#C5A059] dark:text-[#dfc28d]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-0.5">Offline Library</h4>
              <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                {downloadedCount > 0 ? `${downloadedCount} Surahs Downloaded` : 'Download for offline use'}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center relative z-10">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
        </div>
      </section>
    </div>
  );
}
