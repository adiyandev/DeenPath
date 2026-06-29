import { Home, BookOpen, Heart, Settings, CircleDot } from 'lucide-react';
import { motion } from 'motion/react';
import { hapticLight } from '../utils/haptics';

interface BottomNavProps {
  currentScreen: string;
  setScreen: (screen: string) => void;
}

export default function BottomNav({ currentScreen, setScreen }: BottomNavProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'quran-list', label: 'Quran', icon: BookOpen },
    { id: 'tasbih', label: 'Tasbih', icon: CircleDot },
    { id: 'duas', label: 'Duas', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    hapticLight();
    setScreen(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-light/95 dark:bg-bg-dark/95 border-t border-slate-200/50 dark:border-zinc-900/50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.02)] backdrop-blur-md">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentScreen === item.id || (item.id === 'quran-list' && currentScreen === 'quran-detail');

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="relative flex flex-col items-center justify-center py-1 flex-1 text-center transition-colors focus:outline-none"
              id={`nav-tab-${item.id}`}
            >
              {/* Highlight background pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBackground"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="absolute -top-1 w-12 h-8 bg-[#ecf5f2] dark:bg-[#15231e] rounded-full -z-10"
                />
              )}

              <div className="relative">
                <IconComponent
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isActive
                      ? 'text-[#064E3B] dark:text-[#dfc28d] scale-110'
                      : 'text-slate-400 dark:text-zinc-600 hover:text-[#064E3B] dark:hover:text-[#dfc28d]'
                  }`}
                />
              </div>

              <span
                className={`text-[10px] tracking-wider mt-1 transition-colors duration-300 ${
                  isActive
                    ? 'text-[#064E3B] dark:text-[#dfc28d] font-serif italic font-bold'
                    : 'text-slate-400 dark:text-zinc-600 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
