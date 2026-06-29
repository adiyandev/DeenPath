import { useState, useEffect } from 'react';
import { Sun, Moon, Bell, BellOff, MapPin, Compass, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { PrayerData } from '../types';
import { hapticLight } from '../utils/haptics';

interface PrayerTimesProps {
  prayerData: PrayerData;
  setScreen: (screen: string) => void;
}

export default function PrayerTimes({ prayerData, setScreen }: PrayerTimesProps) {
  const [activeAlerts, setActiveAlerts] = useState<Record<string, boolean>>(() => {
    try {
      const saved = window.localStorage.getItem('prayer_alerts');
      return saved ? JSON.parse(saved) : { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
    } catch {
      return { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
    }
  });

  const [currentPrayer, setCurrentPrayer] = useState<string>('Asr');
  const [dayProgress, setDayProgress] = useState<number>(65); // 0-100% position on the celestial track

  // Calculate current active prayer & progress through the day
  useEffect(() => {
    const parseTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    };

    const determineCurrentPrayerAndProgress = () => {
      const now = new Date();
      const times = prayerData.times;
      
      const fajr = parseTime(times.Fajr);
      const sunrise = parseTime(times.Sunrise);
      const dhuhr = parseTime(times.Dhuhr);
      const asr = parseTime(times.Asr);
      const maghrib = parseTime(times.Maghrib);
      const isha = parseTime(times.Isha);

      let current = 'Isha';
      let progress = 95; // night default

      if (now >= fajr && now < sunrise) {
        current = 'Fajr';
        const total = sunrise.getTime() - fajr.getTime();
        const done = now.getTime() - fajr.getTime();
        progress = 10 + (done / total) * 15; // 10% to 25% on bar
      } else if (now >= sunrise && now < dhuhr) {
        current = 'Sunrise';
        const total = dhuhr.getTime() - sunrise.getTime();
        const done = now.getTime() - sunrise.getTime();
        progress = 25 + (done / total) * 20; // 25% to 45%
      } else if (now >= dhuhr && now < asr) {
        current = 'Dhuhr';
        const total = asr.getTime() - dhuhr.getTime();
        const done = now.getTime() - dhuhr.getTime();
        progress = 45 + (done / total) * 20; // 45% to 65%
      } else if (now >= asr && now < maghrib) {
        current = 'Asr';
        const total = maghrib.getTime() - asr.getTime();
        const done = now.getTime() - asr.getTime();
        progress = 65 + (done / total) * 15; // 65% to 80%
      } else if (now >= maghrib && now < isha) {
        current = 'Maghrib';
        const total = isha.getTime() - maghrib.getTime();
        const done = now.getTime() - maghrib.getTime();
        progress = 80 + (done / total) * 15; // 80% to 95%
      } else {
        // Late night before Fajr tomorrow, or early night after Isha
        current = 'Isha';
        progress = 95;
      }

      setCurrentPrayer(current);
      setDayProgress(Math.min(100, Math.max(0, progress)));
    };

    determineCurrentPrayerAndProgress();
    const interval = setInterval(determineCurrentPrayerAndProgress, 60000);
    return () => clearInterval(interval);
  }, [prayerData]);

  const toggleAlert = (prayerName: string) => {
    hapticLight();
    const updated = { ...activeAlerts, [prayerName]: !activeAlerts[prayerName] };
    setActiveAlerts(updated);
    window.localStorage.setItem('prayer_alerts', JSON.stringify(updated));
  };

  const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const prayers = [
    { id: 'Fajr', label: 'Fajr', subtitle: 'Dawn', time: prayerData.times.Fajr, icon: 'twilight' },
    { id: 'Sunrise', label: 'Sunrise', subtitle: 'Sunrise', time: prayerData.times.Sunrise, icon: 'sunrise' },
    { id: 'Dhuhr', label: 'Dhuhr', subtitle: 'Noon', time: prayerData.times.Dhuhr, icon: 'sunny' },
    { id: 'Asr', label: 'Asr', subtitle: 'Afternoon', time: prayerData.times.Asr, icon: 'cloudy' },
    { id: 'Maghrib', label: 'Maghrib', subtitle: 'Sunset', time: prayerData.times.Maghrib, icon: 'sunset' },
    { id: 'Isha', label: 'Isha', subtitle: 'Night', time: prayerData.times.Isha, icon: 'night' },
  ];

  return (
    <div className="animate-fade-in pb-24">
      {/* Date & Location Header */}
      <section className="mb-6 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold text-[#C5A059] dark:text-[#dfc28d] uppercase tracking-[0.2em]">
            {prayerData.gregorian.weekday.en}, {prayerData.gregorian.day} {prayerData.gregorian.month.en}
          </p>
          <h2 className="text-2xl font-serif italic text-[#064E3B] dark:text-zinc-100 tracking-tight mt-1">
            {prayerData.hijri.day} {prayerData.hijri.month.en} {prayerData.hijri.year} AH
          </h2>
        </div>
        
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#faf6ee] dark:bg-[#15231e] text-[#C5A059] dark:text-[#dfc28d] border border-[#C5A059]/25">
          <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
          <span className="text-[9px] font-bold uppercase tracking-widest">{prayerData.location.split(',')[0]}</span>
        </div>
      </section>

      {/* Celestial Progress Bar */}
      <section className="mb-6 bg-white dark:bg-[#0f1513] rounded-[28px] p-5 border border-slate-200/50 dark:border-zinc-900/50 shadow-sm select-none">
        <div className="flex justify-between items-center px-1 mb-3">
          <span className="text-[9px] text-[#C5A059] dark:text-[#dfc28d] font-bold uppercase tracking-[0.15em] flex items-center gap-1">
            <Sun className="w-3 h-3" /> Day's Celestial Journey
          </span>
          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-[0.15em] flex items-center gap-1">
            <Moon className="w-3 h-3" /> Night
          </span>
        </div>

        <div className="relative h-1.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full mb-3">
          {/* Active solar/celestial track color gradient */}
          <div 
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#064E3B] via-[#C5A059] to-[#032b21]"
            style={{ width: `${dayProgress}%` }}
          />
          {/* Current Solar indicator pin */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#C5A059] border-2 border-white dark:border-zinc-950 rounded-full shadow transition-all duration-1000"
            style={{ left: `calc(${dayProgress}% - 8px)` }}
          />
        </div>

        <div className="flex justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
          <span>{prayerData.times.Fajr}</span>
          <span className="text-[#064E3B] dark:text-[#dfc28d] font-serif italic font-bold">
            Current: {currentPrayer}
          </span>
          <span>{prayerData.times.Isha}</span>
        </div>
      </section>

      {/* Prayers List */}
      <section className="space-y-3">
        {prayers.map((prayer) => {
          const isCurrent = currentPrayer === prayer.id;
          const isAlertOn = activeAlerts[prayer.id];

          return (
            <div
              key={prayer.id}
              className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                isCurrent
                  ? 'bg-[#064E3B] text-white border-2 border-[#C5A059]/40 shadow-lg scale-[1.01] relative overflow-hidden'
                  : 'bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 shadow-sm text-slate-800 dark:text-zinc-200'
              }`}
            >
              {isCurrent && (
                <>
                  <div className="absolute -right-6 -top-6 w-20 h-20 border border-white/5 rounded-full pointer-events-none"></div>
                  <div className="absolute -right-10 -top-10 w-28 h-28 border border-white/10 rounded-full pointer-events-none"></div>
                </>
              )}
              
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCurrent
                      ? 'bg-[#C5A059] text-white font-bold'
                      : 'bg-[#ecf5f2] dark:bg-[#15231e] text-[#064E3B] dark:text-[#dfc28d]'
                  }`}
                >
                  {prayer.id === 'Fajr' || prayer.id === 'Sunrise' || prayer.id === 'Dhuhr' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-900 dark:text-zinc-100'}`}>
                      {prayer.label}
                    </p>
                    {isCurrent && (
                      <span className="h-2 w-2 rounded-full bg-[#C5A059] animate-pulse" />
                    )}
                  </div>
                  <p className={`text-[10px] uppercase tracking-wider ${isCurrent ? 'text-slate-200' : 'text-slate-400'}`}>
                    {prayer.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 relative z-10">
                <p className={`text-base font-bold font-mono ${isCurrent ? 'text-[#dfc28d]' : 'text-slate-900 dark:text-zinc-50'}`}>
                  {formatTime12h(prayer.time)}
                </p>

                {/* Alarm Alert Bell Switcher */}
                {prayer.id !== 'Sunrise' ? (
                  <button
                    onClick={() => toggleAlert(prayer.id)}
                    className={`p-2 rounded-full transition-colors ${
                      isCurrent
                        ? isAlertOn ? 'text-[#dfc28d] hover:bg-white/10' : 'text-emerald-400/80 hover:bg-white/10'
                        : isAlertOn
                        ? 'text-[#064E3B] dark:text-[#dfc28d] hover:bg-slate-100 dark:hover:bg-zinc-800'
                        : 'text-slate-300 dark:text-zinc-700 hover:text-slate-400'
                    }`}
                    title={isAlertOn ? `Disable alarm for ${prayer.label}` : `Enable alarm for ${prayer.label}`}
                  >
                    {isAlertOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                ) : (
                  <div className="w-8" /> /* Sunrise has no athan alert */
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Qibla Direction Hint Box */}
      <section className="mt-6">
        <div
          onClick={() => setScreen('qibla')}
          className="bg-[#faf6ee] dark:bg-[#15231e] border border-[#C5A059]/30 rounded-[28px] p-5 flex items-center justify-between cursor-pointer hover:bg-[#faf6ee]/90 dark:hover:bg-[#15231e]/90 transition-colors duration-300 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center">
              <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                Qibla Direction
              </h4>
              <p className="text-[11px] text-[#064E3B] dark:text-zinc-300 mt-1 font-serif italic">
                Kaaba is approximately 118° SE from your location.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
