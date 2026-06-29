import { ArrowLeft, Moon, Sun, Bookmark } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  canGoBack: boolean;
  onBack?: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onBookmarkClick?: () => void;
}

export default function Header({
  title,
  subtitle,
  canGoBack,
  onBack,
  isDarkMode,
  toggleDarkMode,
  onBookmarkClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-bg-light/90 dark:bg-bg-dark/95 border-b border-slate-200/50 dark:border-zinc-900/50 backdrop-blur-md transition-all duration-300">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Side: Back Button or Spacer */}
        <div className="w-10 flex items-center">
          {canGoBack && onBack ? (
            <button
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100/60 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 active:scale-95 transition-all"
              aria-label="Go back"
              id="back-button"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-4" />
          )}
        </div>

        {/* Center: Brand or Title */}
        <div className="flex-1 text-center select-none">
          <h1 className="text-lg font-serif italic font-semibold text-[#064E3B] dark:text-zinc-100 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[9px] font-bold text-[#C5A059] dark:text-[#dfc28d] uppercase tracking-[0.2em] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Side: Toggle controls / Bookmarks */}
        <div className="w-10 flex items-center justify-end gap-1.5">
          {onBookmarkClick && (
            <button
              onClick={onBookmarkClick}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-[#064E3B] dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              aria-label="View bookmarks"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/60 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400 hover:text-[#064E3B] dark:hover:text-[#dfc28d] transition-all active:scale-90"
            aria-label="Toggle visual theme"
            id="toggle-dark-mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-[#C5A059]" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
