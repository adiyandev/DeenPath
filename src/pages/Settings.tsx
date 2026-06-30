import { useState, useEffect, FormEvent } from 'react';
import { 
  User, Bell, Shield, Moon, Sun, Info, Heart, ChevronRight, Edit2, Check, 
  Database, Cloud, Lock, LogIn, UserPlus, RefreshCw, LogOut, Palette 
} from 'lucide-react';
import { motion } from 'motion/react';
import { hapticLight, hapticMedium } from '../utils/haptics';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface SettingsProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  userName: string;
  setUserName: (name: string) => void;
  fontSizeScale: 'standard' | 'large' | 'xlarge';
  setFontSizeScale: (scale: 'standard' | 'large' | 'xlarge') => void;
  setScreen: (screen: string) => void;
  themeAccent: 'blue' | 'green';
  setThemeAccent: (theme: 'blue' | 'green') => void;
  user: { id: number; email: string; name: string } | null;
  setUser: (user: { id: number; email: string; name: string } | null) => void;
  bookmarks: any[];
  setBookmarks: (bookmarks: any[]) => void;
}

export default function Settings({
  isDarkMode,
  toggleDarkMode,
  userName,
  setUserName,
  fontSizeScale,
  setFontSizeScale,
  setScreen,
  themeAccent,
  setThemeAccent,
  user,
  setUser,
  bookmarks,
  setBookmarks,
}: SettingsProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // Auth States
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Notification toggles
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = window.localStorage.getItem('prayer_alerts');
      return saved ? JSON.parse(saved) : { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
    } catch {
      return { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
    }
  });

  const saveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      setIsEditingName(false);
      // Sync immediately if logged in
      if (user) {
        triggerAutoSyncSettings(tempName.trim());
      }
    }
  };

  const handleAlertToggle = async (key: string) => {
    hapticLight();
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    window.localStorage.setItem('prayer_alerts', JSON.stringify(updated));
    if (user) {
      triggerAutoSyncSettings(userName, updated);
    }

    if (updated[key]) {
      if (Capacitor.isNativePlatform()) {
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } else if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
  };

  // Helper to trigger background settings sync
  const triggerAutoSyncSettings = async (nameToSync = userName, alertsToSync = notifications) => {
    if (!user) return;
    try {
      await fetch(`${API_BASE}/api/sync/settings/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dark_mode: isDarkMode,
          font_size_scale: fontSizeScale,
          theme_accent: themeAccent,
          notifications_fajr: alertsToSync.Fajr,
          notifications_asr: alertsToSync.Asr
        })
      });
    } catch (e) {
      console.warn('Auto-sync settings failed:', e);
    }
  };

  // Auto-sync theme settings when they change
  useEffect(() => {
    if (user) {
      triggerAutoSyncSettings();
    }
  }, [isDarkMode, fontSizeScale, themeAccent]);

  // Auth Submit Handlers
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    const url = isRegisterMode ? `${API_BASE}/api/auth/register` : `${API_BASE}/api/auth/login`;
    const body = isRegisterMode 
      ? { email: authEmail, name: authName || 'Deen Pilgrim', password: authPassword }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isRegisterMode) {
        setAuthSuccess('Registration successful! Please login.');
        setIsRegisterMode(false);
        setAuthPassword('');
      } else {
        // Logged in!
        setUser(data.user);
        setUserName(data.user.name);
        setTempName(data.user.name);
        setAuthSuccess('Signed in successfully.');
        
        // Load settings and bookmarks from server immediately!
        await fetchCloudData(data.user.id);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogOut = () => {
    setUser(null);
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthSuccess('Logged out successfully.');
  };

  // Manual Sync Settings and Bookmarks
  const handleManualSync = async () => {
    if (!user) return;
    setSyncing(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      // 1. Upload bookmarks to database
      const bRes = await fetch(`${API_BASE}/api/sync/bookmarks/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarks })
      });

      if (!bRes.ok) {
        throw new Error('Failed to upload bookmarks to cloud');
      }

      // 2. Upload settings to database
      const sRes = await fetch(`${API_BASE}/api/sync/settings/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dark_mode: isDarkMode,
          font_size_scale: fontSizeScale,
          theme_accent: themeAccent,
          notifications_fajr: notifications.Fajr,
          notifications_asr: notifications.Asr
        })
      });

      if (!sRes.ok) {
        throw new Error('Failed to upload configurations to cloud');
      }

      // 3. Fetch fresh copy to ensure consistency
      await fetchCloudData(user.id);

      setAuthSuccess('All bookmarks and preferences synced securely to the cloud!');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const fetchCloudData = async (userId: number) => {
    try {
      // Fetch Bookmarks
      const bRes = await fetch(`${API_BASE}/api/sync/bookmarks/${userId}`);
      if (bRes.ok) {
        const cloudBookmarks = await bRes.json();
        if (cloudBookmarks && cloudBookmarks.length > 0) {
          setBookmarks(cloudBookmarks);
        }
      }

      // Fetch Settings
      const sRes = await fetch(`${API_BASE}/api/sync/settings/${userId}`);
      if (sRes.ok) {
        const cloudSettings = await sRes.json();
        setFontSizeScale(cloudSettings.font_size_scale || 'standard');
        setThemeAccent(cloudSettings.theme_accent || 'blue');
        // sync notifications object
        const updatedNotifs = {
          ...notifications,
          Fajr: cloudSettings.notifications_fajr !== undefined ? cloudSettings.notifications_fajr : notifications.Fajr,
          Asr: cloudSettings.notifications_asr !== undefined ? cloudSettings.notifications_asr : notifications.Asr
        };
        setNotifications(updatedNotifs);
        window.localStorage.setItem('prayer_alerts', JSON.stringify(updatedNotifs));
      }
    } catch (e) {
      console.warn('Error fetching server state:', e);
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Profile Section */}
      <section className="mb-6">
        <div className="bg-[#faf6ee] dark:bg-[#15231e] border border-[#C5A059]/20 rounded-[28px] p-5 flex items-center gap-4 shadow-sm select-none">
          <div className="w-14 h-14 bg-gradient-to-tr from-primary to-[#C5A059] text-white rounded-full flex items-center justify-center font-bold text-xl shadow">
            {userName ? userName[0].toUpperCase() : 'A'}
          </div>

          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  maxLength={15}
                  className="bg-slate-50 dark:bg-zinc-900 px-3 py-1.5 rounded-xl text-sm font-semibold border-none outline-none w-36 text-slate-900 dark:text-white"
                />
                <button
                  onClick={saveName}
                  className="p-2 rounded-full bg-[#ecf5f2] dark:bg-zinc-900 text-primary dark:text-[#dfc28d] hover:bg-slate-100 transition-all active:scale-90"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-primary dark:text-zinc-50">
                    {userName}
                  </h3>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-[#C5A059] font-bold uppercase tracking-widest mt-0.5">
                  {user ? 'Cloud Account' : 'Developer Mode'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cloud Integration (Cloud Auth) */}
      <section className="mb-6">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-[0.2em] mb-3 pl-1 select-none flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-primary" /> Cloud Sync (Account)
        </h4>

        {user ? (
          <div className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] p-5 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-[#ecf5f2] dark:bg-[#15231e] text-primary dark:text-[#dfc28d]">
                <Cloud className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-left">
                <h5 className="text-sm font-serif italic font-bold text-primary dark:text-zinc-50">
                  Cloud Synchronization Active
                </h5>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Signed in as <strong className="text-slate-700 dark:text-zinc-300">{user.email}</strong>. Settings & Bookmarks are securely stored in the cloud.
                </p>
              </div>
            </div>

            {authSuccess && (
              <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl text-left font-serif mb-4">
                {authSuccess}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow"
              >
                {syncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Sync Cloud
              </button>
              
              <button
                onClick={handleLogOut}
                className="py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-900/50 hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] p-5 shadow-sm text-left">
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Sign up or log in to sync your saved bookmarks, preferences, and Quran reading status to the cloud. Keep your configurations safe from browser cache clears.
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {isRegisterMode && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Omar"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-900/50 focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-900/50 focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Security Key / Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-900/50 focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-2.5" />
                </div>
              </div>

              {authError && (
                <p className="text-[11px] text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-xl">
                  {authError}
                </p>
              )}

              {authSuccess && (
                <p className="text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl">
                  {authSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 mt-2 rounded-xl text-xs font-bold text-white bg-primary hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow"
              >
                {authLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isRegisterMode ? (
                  <UserPlus className="w-3.5 h-3.5" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                {isRegisterMode ? 'Register Account' : 'Secure Sign In'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-900/40 text-center">
              <button
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="text-[11px] font-bold text-primary dark:text-[#dfc28d] hover:underline"
              >
                {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Theme Accent Picker (New Feature) */}
      <section className="mb-6">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-[0.2em] mb-3 pl-1 select-none flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-primary" /> Visual Branding & Accents
        </h4>
        <div className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] overflow-hidden shadow-sm p-4">
          <p className="text-xs text-slate-500 text-left mb-3">Choose the app accent color. All interfaces adjust elegantly.</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                hapticLight();
                setThemeAccent('blue');
              }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                themeAccent === 'blue'
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 shadow-sm'
                  : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200/50 dark:border-zinc-900/50 hover:bg-slate-100/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-700"></div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">Deen Blue</div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Royal Safwan majestic theme</p>
            </button>

            <button
              onClick={() => {
                hapticLight();
                setThemeAccent('green');
              }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                themeAccent === 'green'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200/50 dark:border-zinc-900/50 hover:bg-slate-100/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-800"></div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">Deen Green</div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Traditional Emerald theme</p>
            </button>
          </div>
        </div>
      </section>

      {/* Language & Translation Settings (New Feature) */}
      <section className="mb-6">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-[0.2em] mb-3 pl-1 select-none flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-primary" /> Global Language & Quran Translation
        </h4>
        <div className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] overflow-hidden shadow-sm p-4">
          
          <div className="mb-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">UI Language</label>
            <select
              value={window.localStorage.getItem('ui_language') || 'en'}
              onChange={(e) => {
                hapticLight();
                window.localStorage.setItem('ui_language', e.target.value);
                window.location.reload(); // Refresh to apply UI changes
              }}
              className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all"
            >
              <option value="en">English (English)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="ur">اردو (Urdu)</option>
              <option value="fr">Français (French)</option>
              <option value="id">Bahasa Indonesia (Indonesian)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Quran Translation Edition</label>
            <select
              value={window.localStorage.getItem('quran_translation_id') || '85'}
              onChange={(e) => {
                hapticLight();
                window.localStorage.setItem('quran_translation_id', e.target.value);
                // Optionally reload or just state it'll apply on next Quran load
              }}
              className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all"
            >
              <option value="85">English (Clear Quran)</option>
              <option value="84">Urdu (Taqi Usmani)</option>
              <option value="31">French (Muhammad Hamidullah)</option>
              <option value="33">Indonesian (Ministry of Religious Affairs)</option>
              <option value="83">Spanish (Muhammad Isa García)</option>
              <option value="77">Turkish (Diyanet Isleri)</option>
              <option value="161">Bengali (Taisirul Quran)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="mb-6">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-[0.2em] mb-3 pl-1 select-none">
          Notification Alerts
        </h4>
        <div className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-slate-400 dark:text-zinc-600">
                <Bell className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Athan Adhan Alerts</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Trigger notification sound on prayer times</p>
              </div>
            </div>
            
            {/* Custom switch slider */}
            <button
              onClick={() => handleAlertToggle('Fajr')}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
                notifications.Fajr ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-800'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${
                  notifications.Fajr ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-zinc-900/50 mx-4"></div>

          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-slate-400 dark:text-zinc-600">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Daily Reminders</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Morning & Evening Adhkar reminders</p>
              </div>
            </div>

            <button
              onClick={() => handleAlertToggle('Asr')}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
                notifications.Asr ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-800'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${
                  notifications.Asr ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="mb-6">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-[0.2em] mb-3 pl-1 select-none">
          Visual Theme & Display
        </h4>
        <div className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] overflow-hidden shadow-sm">
          {/* Theme switcher */}
          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-slate-400 dark:text-zinc-600">
                {isDarkMode ? <Sun className="w-5 h-5 text-[#C5A059]" /> : <Moon className="w-5 h-5" />}
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Dark Visual Theme</p>
            </div>

            <button
              onClick={() => {
                hapticLight();
                toggleDarkMode();
              }}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
                isDarkMode ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-800'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${
                  isDarkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-zinc-900/50 mx-4"></div>

          {/* Typography Scale */}
          <div className="p-4">
            <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 text-left">Arabic Font Scaling</p>
            <p className="text-[10px] text-slate-400 mt-0.5 text-left mb-3">Adjust letter sizes for easier Arabic recitation</p>
            
            <div className="grid grid-cols-3 gap-2 bg-gold-container dark:bg-[#15231e] p-1.5 rounded-2xl border border-slate-100 dark:border-zinc-900/50">
              {(['standard', 'large', 'xlarge'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => {
                    hapticLight();
                    setFontSizeScale(scale);
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all focus:outline-none ${
                    fontSizeScale === scale
                      ? 'bg-primary text-white shadow-sm font-serif italic'
                      : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600'
                  }`}
                >
                  {scale === 'standard' ? 'Standard' : scale === 'large' ? 'Large' : 'Extra Large'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About & Mission Section Links */}
      <section className="mb-6">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-[0.2em] mb-3 pl-1 select-none">
          Information & Support
        </h4>
        <div className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] overflow-hidden shadow-sm">
          <div
            onClick={() => setScreen('about')}
            className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="text-slate-400 dark:text-zinc-600">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">About Deen Path</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </section>

      {/* Crafted by details */}
      <footer className="text-center pt-4 select-none">
        <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest">
          Version 2.5.0 (Sapphire)
        </p>
      </footer>
    </div>
  );
}
