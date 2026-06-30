import { useEffect, useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { PrayerData, Bookmark as BookmarkType } from './types';
import { fetchUserLocation, fetchPrayerTimes } from './services/api';
import { useTranslation } from './utils/i18n';
import { hapticHeavy } from './utils/haptics';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Pages
import Home from './pages/Home';
import PrayerTimes from './pages/PrayerTimes';
import Quran from './pages/Quran';
import Qibla from './pages/Qibla';
import Duas from './pages/Duas';
import Bookmarks from './pages/Bookmarks';
import Settings from './pages/Settings';
import About from './pages/About';
import Tasbih from './pages/Tasbih';
import Onboarding from './pages/Onboarding';

export default function App() {
  const { t, lang } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null);
  const [isDevMode, setIsDevMode] = useLocalStorage<boolean>('dev_mode', false);

  // Persistent States
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('app_dark_mode', false);
  const [userName, setUserName] = useLocalStorage<string>('user_name', '');
  const [fontSizeScale, setFontSizeScale] = useLocalStorage<'standard' | 'large' | 'xlarge'>('font_size_scale', 'standard');
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkType[]>('user_bookmarks', []);
  const [themeAccent, setThemeAccent] = useLocalStorage<'blue' | 'green'>('theme_accent', 'blue');
  const [user, setUser] = useLocalStorage<{ id: number; email: string; name: string } | null>('user_session', null);
  const [showSplash, setShowSplash] = useState(true);

  // API Retrieval state
  const [prayerData, setPrayerData] = useState<PrayerData>({
    times: {
      Fajr: '04:12',
      Sunrise: '05:48',
      Dhuhr: '13:05',
      Asr: '17:10',
      Maghrib: '20:45',
      Isha: '22:15',
    },
    gregorian: {
      date: '29-06-2026',
      format: 'DD-MM-YYYY',
      day: '29',
      weekday: { en: 'Monday' },
      month: { number: 6, en: 'June' },
      year: '2026',
    },
    hijri: {
      date: '14-12-1447',
      format: 'DD-MM-YYYY',
      day: '14',
      weekday: { en: 'Al-Arba\'a', ar: 'الأربعاء' },
      month: { number: 12, en: 'Dhu al-Hijjah', ar: 'ذو الحجة' },
      year: '1447',
      designation: { abbreviated: 'AH' },
    },
    location: 'London, UK'
  });

  // Dark Mode and Theme Accent DOM sync
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (themeAccent === 'green') {
      root.classList.add('theme-green');
    } else {
      root.classList.remove('theme-green');
    }
  }, [themeAccent]);

  // Retrieve user location and prayer times on mount
  useEffect(() => {
    async function loadData() {
      try {
        if (Capacitor.isNativePlatform()) {
          await LocalNotifications.requestPermissions();
        } else if ('Notification' in window) {
          await Notification.requestPermission();
        }

        if (!window.localStorage.getItem('prayer_alerts')) {
          window.localStorage.setItem('prayer_alerts', JSON.stringify({ Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true }));
        }

        const loc = await fetchUserLocation();
        const pTimes = await fetchPrayerTimes(loc.lat, loc.lng, loc.city);
        setPrayerData(pTimes);

        if (Capacitor.isNativePlatform()) {
          try {
            await Preferences.set({
              key: 'widget_prayer_data',
              value: JSON.stringify({
                Fajr: pTimes.times.Fajr,
                Dhuhr: pTimes.times.Dhuhr,
                Asr: pTimes.times.Asr,
                Maghrib: pTimes.times.Maghrib,
                Isha: pTimes.times.Isha
              })
            });
          } catch(e) { console.error('Prefs error', e) }
        }
      } catch (err) {
        console.error('Error in App loading phase:', err);
      } finally {
        setTimeout(() => setShowSplash(false), 1500);
      }
    }
    loadData();
  }, []);

  // Adhan Notification Checker
  useEffect(() => {
    let lastPlayedTime = '';

    const checkAdhan = () => {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMin = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHour}:${currentMin}`;

      if (timeStr === lastPlayedTime) return; // Prevent multiple plays in same minute

      const times = prayerData.times;
      // Sunrise is generally not called out for Adhan, but we can include it or skip it.
      const prayers = [
        { name: 'Fajr', time: times.Fajr },
        { name: 'Dhuhr', time: times.Dhuhr },
        { name: 'Asr', time: times.Asr },
        { name: 'Maghrib', time: times.Maghrib },
        { name: 'Isha', time: times.Isha },
      ];

      const currentPrayer = prayers.find((p) => p.time === timeStr);
      if (currentPrayer) {
        lastPlayedTime = timeStr;
        // Check if alerts are enabled
        try {
          const savedAlerts = window.localStorage.getItem('prayer_alerts');
          const alerts = savedAlerts ? JSON.parse(savedAlerts) : { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
          
          if (alerts[currentPrayer.name]) {
            const adhanAudio = new Audio('https://raw.githubusercontent.com/islamic-network/cdn/master/adhan/makkah.mp3');
            adhanAudio.play().catch((err) => console.log('Audio autoplay prevented', err));
            hapticHeavy();
            
            // Show standard browser notification if possible
            if (Capacitor.isNativePlatform()) {
              LocalNotifications.schedule({
                notifications: [
                  {
                    title: `Time for ${currentPrayer.name} Prayer`,
                    body: `It is now ${timeStr}. Time to pray.`,
                    id: Math.floor(new Date().getTime() / 1000),
                    schedule: { at: new Date(Date.now() + 1000) }
                  }
                ]
              });
            } else if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Time for ${currentPrayer.name} Prayer`, {
                body: `It is now ${timeStr}. Time to pray.`,
                icon: '/icon.png' // assuming icon exists
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    const intervalId = setInterval(checkAdhan, 30000); // Check every 30s
    return () => clearInterval(intervalId);
  }, [prayerData]);

  // Screen Nav Wrapper that updates back history stack
  const navigateToScreen = (newScreen: string) => {
    if (newScreen !== currentScreen) {
      setHistoryStack((prev) => [...prev, currentScreen]);
      setCurrentScreen(newScreen);
      // reset selected surah if navigating away
      if (newScreen !== 'quran-list' && newScreen !== 'quran-detail') {
        setSelectedSurahNumber(null);
      }
    }
  };

  const handleBack = () => {
    if (selectedSurahNumber !== null) {
      setSelectedSurahNumber(null);
      setCurrentScreen('quran-list');
      return;
    }

    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack((prevStack) => prevStack.slice(0, -1));
      setCurrentScreen(prev);
    } else {
      setCurrentScreen('home');
    }
  };

  // Toggle Bookmark Handler
  const toggleBookmark = (item: BookmarkType) => {
    const exists = bookmarks.some((b) => b.id === item.id);
    if (exists) {
      setBookmarks(bookmarks.filter((b) => b.id !== item.id));
    } else {
      setBookmarks([...bookmarks, item]);
    }
  };

  // Dynamic Header Title Resolution
  const getHeaderDetails = () => {
    if (selectedSurahNumber !== null) {
      return {
        title: t('readSurah'),
        subtitle: t('quranReading')
      };
    }

    switch (currentScreen) {
      case 'home':
        return { title: t('deenPath'), subtitle: t('peaceFaith') };
      case 'prayer-times':
        return { title: t('prayerTimes'), subtitle: 'Al-Adhan Schedule' };
      case 'quran-list':
        return { title: t('quranLibrary'), subtitle: 'Surah Index' };
      case 'qibla':
        return { title: 'Qibla Direction', subtitle: 'Kaaba Compass' };
      case 'tasbih':
        return { title: t('tasbih'), subtitle: 'Digital Dhikr Counter' };
      case 'duas':
        return { title: 'Supplications', subtitle: 'Authentic Adhkar' };
      case 'bookmarks':
        return { title: 'Saved Collection', subtitle: 'My Adhkar & Verses' };
      case 'settings':
        return { title: t('settings'), subtitle: t('generalPreferences') };
      case 'about':
        return { title: t('aboutTheMission'), subtitle: t('designPhilosophy') };
      default:
        return { title: t('deenPath'), subtitle: t('peaceFaith') };
    }
  };

  const headerDetails = getHeaderDetails();
  const canGoBack = currentScreen !== 'home' || selectedSurahNumber !== null;

  if (showSplash) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col justify-center items-center relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-96 h-96 bg-gold/10 rounded-full blur-[100px]"></div>
        <div className="z-10 flex flex-col items-center animate-fade-in">
          <img src="/logo.png" alt="Deen Path Logo" className="w-24 h-24 mb-6 drop-shadow-2xl animate-pulse-glow object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-4xl font-serif italic font-bold text-primary dark:text-zinc-50 mb-2 tracking-tight">
            {t('deenPath')}
          </h1>
          <p className="text-xs font-bold text-[#C5A059] uppercase tracking-[0.2em] mt-2">
            {t('peaceFaith')}
          </p>
        </div>
      </div>
    );
  }

  if (!user && !isDevMode) {
    return <Onboarding onSuccess={(u) => { setUser(u); setUserName(u.name); }} onDevMode={() => setIsDevMode(true)} />;
  }

  return (
    <div dir={lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr'} className="min-h-screen bg-[#EFECE6] dark:bg-[#121816] text-[#1E293B] dark:text-zinc-200 transition-colors duration-300">
      {/* Framed mobile interface context */}
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark shadow-2xl relative overflow-hidden border-x border-slate-200/50 dark:border-zinc-900/50">
        
        {/* Render Header unless it is onboarding or splash */}
        {currentScreen !== 'about' && (
          <Header
            title={headerDetails.title}
            subtitle={headerDetails.subtitle}
            canGoBack={canGoBack}
            onBack={handleBack}
            isDarkMode={isDarkMode}
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onBookmarkClick={() => navigateToScreen('bookmarks')}
          />
        )}

        {/* Content canvas */}
        <main className="flex-1 px-6 pt-6 overflow-y-auto overflow-x-hidden no-scrollbar pb-24">
          {currentScreen === 'home' && (
            <Home
              prayerData={prayerData}
              setScreen={navigateToScreen}
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              userName={userName}
            />
          )}

          {currentScreen === 'prayer-times' && (
            <PrayerTimes
              prayerData={prayerData}
              setScreen={navigateToScreen}
            />
          )}

          {(currentScreen === 'quran-list' || currentScreen === 'quran-detail') && (
            <Quran
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              selectedSurah={selectedSurahNumber}
              setSelectedSurah={(num) => {
                setSelectedSurahNumber(num);
                if (num !== null) {
                  setCurrentScreen('quran-detail');
                } else {
                  setCurrentScreen('quran-list');
                }
              }}
              fontSizeScale={fontSizeScale}
            />
          )}

          {currentScreen === 'qibla' && <Qibla />}
          
          {currentScreen === 'tasbih' && <Tasbih />}

          {currentScreen === 'duas' && (
            <Duas
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
            />
          )}

          {currentScreen === 'bookmarks' && (
            <Bookmarks
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              setScreen={navigateToScreen}
              setSelectedSurah={setSelectedSurahNumber}
            />
          )}

          {currentScreen === 'settings' && (
            <Settings
              isDarkMode={isDarkMode}
              toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              userName={userName}
              setUserName={setUserName}
              fontSizeScale={fontSizeScale}
              setFontSizeScale={setFontSizeScale}
              setScreen={navigateToScreen}
              themeAccent={themeAccent}
              setThemeAccent={setThemeAccent}
              user={user}
              setUser={setUser}
              bookmarks={bookmarks}
              setBookmarks={setBookmarks}
            />
          )}

          {currentScreen === 'about' && (
            <About onBack={handleBack} />
          )}
        </main>

        {/* Bottom tab menu bar unless deep about screen */}
        {currentScreen !== 'about' && (
          <BottomNav
            currentScreen={selectedSurahNumber !== null ? 'quran-list' : currentScreen}
            setScreen={navigateToScreen}
          />
        )}
      </div>
    </div>
  );
}
