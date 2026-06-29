import { useState } from 'react';
import { RefreshCw, Heart, ChevronRight, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { hapticLight, hapticSuccess, hapticMedium } from '../utils/haptics';

export default function Tasbih() {
  const [count, setCount] = useState(0);
  const [totalCount, setTotalCount] = useState(() => {
    return parseInt(window.localStorage.getItem('tasbih_total') || '0', 10);
  });
  
  const [cycle, setCycle] = useState(33);

  const increment = () => {
    hapticLight();
    setCount(prev => {
      const next = prev + 1;
      if (next > 0 && next % cycle === 0) {
        hapticSuccess();
      }
      return next;
    });
    setTotalCount(prev => {
      const next = prev + 1;
      window.localStorage.setItem('tasbih_total', next.toString());
      return next;
    });
  };

  const reset = () => {
    hapticMedium();
    setCount(0);
  };

  const handleCycleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCycle(parseInt(e.target.value, 10));
    setCount(0);
  };

  return (
    <div className="animate-fade-in pb-24 text-center">
      {/* Title & Stats */}
      <section className="mb-8">
        <div className="bg-gold-container dark:bg-[#15231e] border border-[#C5A059]/25 rounded-[32px] p-6 relative shadow-sm text-center">
          <h2 className="text-xl font-serif italic font-bold text-primary dark:text-zinc-50 tracking-tight mb-1">
            Digital Tasbih
          </h2>
          <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em] mb-4">
            Dhikr Counter
          </p>
          <div className="flex justify-center items-center gap-6">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</p>
              <p className="text-lg font-serif italic text-primary dark:text-[#dfc28d]">{totalCount}</p>
            </div>
            <div className="w-[1px] h-8 bg-slate-200 dark:bg-zinc-800/80"></div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cycle</p>
              <select
                value={cycle}
                onChange={handleCycleChange}
                className="bg-transparent text-lg font-serif italic text-primary dark:text-[#dfc28d] outline-none cursor-pointer"
              >
                <option value={33}>33</option>
                <option value={99}>99</option>
                <option value={100}>100</option>
                <option value={1000}>1000</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Counter Ring */}
      <section className="flex flex-col items-center justify-center relative mb-8">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="116"
              className="stroke-slate-100 dark:stroke-zinc-900/50"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="128"
              cy="128"
              r="116"
              className="stroke-primary dark:stroke-[#dfc28d] transition-all duration-300 ease-out"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 116}
              strokeDashoffset={2 * Math.PI * 116 * (1 - (count % cycle) / cycle)}
              strokeLinecap="round"
            />
          </svg>

          {/* Interaction Area */}
          <button
            onClick={increment}
            className="absolute inset-4 bg-white dark:bg-[#0f1513] rounded-full shadow-lg border-4 border-slate-50 dark:border-zinc-900 flex flex-col items-center justify-center active:scale-95 transition-transform"
          >
            <span className="text-6xl font-serif italic text-primary dark:text-zinc-100 mb-1">
              {count}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-1">
              <Fingerprint className="w-3.5 h-3.5" /> Tap to count
            </span>
          </button>
        </div>
        
        {/* Reset Button */}
        <button
          onClick={reset}
          className="mt-8 flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-500 hover:text-primary dark:hover:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-xs font-bold uppercase tracking-widest shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Cycle
        </button>
      </section>

      {/* Suggested Dhikr */}
      <section className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] p-5 text-left shadow-sm">
        <h4 className="text-xs font-serif italic font-bold text-primary dark:text-[#dfc28d] uppercase tracking-widest mb-3">
          Suggested Dhikr
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Subhanallah</p>
              <p className="text-[10px] text-slate-400">Glory be to Allah</p>
            </div>
            <p className="text-xl font-arabic text-primary dark:text-[#dfc28d]">سُبْحَانَ ٱللَّٰهِ</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Alhamdulillah</p>
              <p className="text-[10px] text-slate-400">Praise be to Allah</p>
            </div>
            <p className="text-xl font-arabic text-primary dark:text-[#dfc28d]">ٱلْحَمْدُ لِلَّٰهِ</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Allahu Akbar</p>
              <p className="text-[10px] text-slate-400">Allah is Greatest</p>
            </div>
            <p className="text-xl font-arabic text-primary dark:text-[#dfc28d]">ٱللَّٰهُ أَكْبَرُ</p>
          </div>
        </div>
      </section>
    </div>
  );
}
