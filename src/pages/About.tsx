import { Heart, Globe, ArrowLeft, ArrowUpRight, HelpCircle } from 'lucide-react';

interface AboutProps {
  onBack: () => void;
}

export default function About({ onBack }: AboutProps) {
  return (
    <div className="animate-fade-in pb-24 text-center">
      {/* Back Button and Title Hero banner */}
      <section className="mb-6 flex justify-start items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-primary dark:hover:text-[#dfc28d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </button>
      </section>

      {/* Main Logo & Mission details */}
      <section className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[32px] p-6 shadow-sm mb-6 select-none">
        <div className="w-20 h-20 bg-primary text-white border border-[#C5A059]/30 rounded-[28px] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25 animate-pulse-glow">
          <span className="text-4xl font-normal">🌿</span>
        </div>
        
        <h3 className="text-xl font-serif italic font-bold text-primary dark:text-zinc-50 tracking-tight">
          Deen Path
        </h3>
        <p className="text-[9px] font-bold text-[#C5A059] dark:text-[#dfc28d] uppercase tracking-[0.2em] mt-1.5">
          Digital Tranquility
        </p>

        <div className="h-0.5 w-12 bg-slate-100 dark:bg-zinc-900/50 mx-auto my-5"></div>

        <p className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed text-left font-serif italic">
          Deen Path is dedicated to providing a peaceful spiritual digital space for the modern Muslim. Our goal is to reduce cognitive load and evoke a sense of peace and tranquility through minimalist design, spacious layouts, and focused utility.
        </p>
      </section>

      {/* App core pillars */}
      <section className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] p-5 shadow-sm text-left mb-6 select-none">
        <h4 className="text-xs font-serif italic font-bold text-primary dark:text-[#dfc28d] uppercase tracking-widest mb-3">
          Design & Utility Philosophy
        </h4>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-sm mt-0.5">✨</span>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Spacious Architecture</p>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                Generous padding and negative space prevent sensory overload and provide breathing room.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-sm mt-0.5">📜</span>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Reverent Arabic Typography</p>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                Utilizes classic Noto Naskh and Amiri typefaces to ensure clean, beautiful rendering of harakaat diacritics.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-sm mt-0.5">🛡️</span>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">No Key, No Ad-Slop Policy</p>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                Guarantees zero commercial ads, telemetry noise, or third-party tracking, preserving the purity of your spiritual workspace.
              </p>
            </div>
          </li>
        </ul>
      </section>

      {/* Terms and Links Grid */}
      <section className="grid grid-cols-2 gap-3 mb-6">
        <a
          href="#"
          className="p-4 bg-gold-container dark:bg-[#15231e] hover:bg-gold-container/90 border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl flex items-center justify-between text-left group"
        >
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Privacy & Terms</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Policy Details</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary dark:group-hover:text-[#dfc28d] transition-colors" />
        </a>

        <a
          href="#"
          className="p-4 bg-gold-container dark:bg-[#15231e] hover:bg-gold-container/90 border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl flex items-center justify-between text-left group"
        >
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Support Desk</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Contact Support</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary dark:group-hover:text-[#dfc28d] transition-colors" />
        </a>
      </section>

      {/* Footer copyright */}
      <footer className="select-none">
        <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest">
          Made by Adiyan
        </p>
      </footer>
    </div>
  );
}
