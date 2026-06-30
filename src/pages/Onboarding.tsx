import { useState } from 'react';
import { UserPlus, Shield, Lock, ArrowRight, Loader2, Key } from 'lucide-react';
import { motion } from 'motion/react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface OnboardingProps {
  onSuccess: (user: any) => void;
  onDevMode: () => void;
}

export default function Onboarding({ onSuccess, onDevMode }: OnboardingProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [translationId, setTranslationId] = useState('131');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDevKey, setShowDevKey] = useState(false);
  const [devKey, setDevKey] = useState('');

  const [isForgotMode, setIsForgotMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mockOtpMsg, setMockOtpMsg] = useState('');

  const translations = [
    { id: '85', name: 'English (Clear Quran)' },
    { id: '84', name: 'Urdu (Taqi Usmani)' },
    { id: '31', name: 'French (Muhammad Hamidullah)' },
    { id: '33', name: 'Indonesian (Ministry of Religious Affairs)' },
    { id: '83', name: 'Spanish (Muhammad Isa García)' },
    { id: '77', name: 'Turkish (Diyanet Isleri)' },
    { id: '161', name: 'Bengali (Taisirul Quran)' }
  ];

  const countries = [
    "United Kingdom", "United States", "Canada", "Australia", 
    "Pakistan", "India", "Bangladesh", "Indonesia", "Malaysia", 
    "Turkey", "Saudi Arabia", "United Arab Emirates", "Egypt", 
    "Morocco", "France", "Germany", "South Africa", "Nigeria"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isRegisterMode ? `${API_BASE}/api/auth/register` : `${API_BASE}/api/auth/login`;
    const body = isRegisterMode 
      ? { email, name: name || 'Believer', password }
      : { email, password };

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

      window.localStorage.setItem('user_country', country);
      window.localStorage.setItem('quran_translation_id', translationId);

      if (isRegisterMode) {
        setIsRegisterMode(false);
        setPassword('');
        setError('Registration successful! Please sign in.');
      } else {
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setMockOtpMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      
      setOtpSent(true);
      if (data.mockOtp) {
         setMockOtpMsg(`Test Mode OTP: ${data.mockOtp}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      
      setIsForgotMode(false);
      setOtpSent(false);
      setOtp('');
      setNewPassword('');
      setIsRegisterMode(false);
      setError('Password reset successfully. Please log in.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDevKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (devKey === 'adiyan123@!') {
      onDevMode();
    } else {
      setError('Invalid developer key');
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col justify-center items-center p-6 animate-fade-in relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-96 h-96 bg-gold/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary text-white border border-[#C5A059]/30 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25 animate-pulse-glow">
            <span className="text-4xl font-normal">🌿</span>
          </div>
          <h1 className="text-3xl font-serif italic font-bold text-primary dark:text-zinc-50 mb-2 tracking-tight">
            Deen Path
          </h1>
          <p className="text-xs font-bold text-[#C5A059] uppercase tracking-[0.2em]">
            Sign up required to continue
          </p>
        </div>

        <div className="bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[32px] p-6 shadow-xl shadow-slate-200/20 dark:shadow-none">
          {showDevKey ? (
            <form onSubmit={handleDevKeySubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Developer Key</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Enter developer key"
                    value={devKey}
                    onChange={(e) => setDevKey(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                </div>
              </div>

              {error && (
                <div className="text-xs px-4 py-3 rounded-2xl flex items-start gap-2 bg-red-50 text-red-500 dark:bg-red-950/20">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 mt-2 rounded-2xl text-sm font-bold text-white bg-slate-900 dark:bg-zinc-700 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Unlock Developer Mode
              </button>
            </form>
          ) : isForgotMode ? (
            <form onSubmit={otpSent ? handleForgotReset : handleForgotRequest} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Reset Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {otpSent ? 'Enter the OTP and your new password.' : 'Enter your email to receive a reset code.'}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  disabled={otpSent}
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all disabled:opacity-50"
                />
              </div>

              {otpSent && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">6-Digit OTP</label>
                    <input
                      type="text"
                      required
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all"
                    />
                  </div>
                </>
              )}

              {mockOtpMsg && (
                <div className="text-xs px-4 py-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                  <p className="font-mono font-bold text-center">{mockOtpMsg}</p>
                </div>
              )}

              {error && (
                <div className="text-xs px-4 py-3 rounded-2xl flex items-start gap-2 bg-red-50 text-red-500 dark:bg-red-950/20">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-2xl text-sm font-bold text-white bg-primary hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (otpSent ? 'Reset Password' : 'Send Code')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegisterMode && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abdullah"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all"
                    >
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Quran Translation</label>
                    <select
                      value={translationId}
                      onChange={(e) => setTranslationId(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all"
                    >
                      {translations.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  {!isRegisterMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(true);
                        setError(null);
                        setMockOtpMsg('');
                        setOtpSent(false);
                      }}
                      className="text-[10px] font-bold text-primary hover:opacity-80"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-slate-800 dark:text-zinc-100 transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                </div>
              </div>

              {error && (
                <div className={`text-xs px-4 py-3 rounded-2xl flex items-start gap-2 ${error.includes('successful') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-red-50 text-red-500 dark:bg-red-950/20'}`}>
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-2xl text-sm font-bold text-white bg-primary hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isRegisterMode ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-900/50 text-center flex flex-col gap-3">
            {!showDevKey && (
              <button
                onClick={() => {
                  if (isForgotMode) {
                    setIsForgotMode(false);
                  } else {
                    setIsRegisterMode(!isRegisterMode);
                  }
                  setError(null);
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-primary transition-colors"
              >
                {isForgotMode 
                  ? 'Back to Login'
                  : isRegisterMode 
                    ? 'Already have an account? Sign In' 
                    : "Don't have an account? Sign Up"}
              </button>
            )}
            
            <button
              onClick={() => {
                setShowDevKey(!showDevKey);
                setError(null);
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest mt-2"
            >
              {showDevKey ? 'Back to Login' : 'Developer Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
