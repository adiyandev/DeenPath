import { useState, useEffect } from 'react';
import { Compass, ShieldAlert, Navigation, ArrowUp, RefreshCw, AlertCircle, Heart, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function Qibla() {
  const [rotation, setRotation] = useState<number>(0); // User-selected compass heading
  const [heading, setHeading] = useState<number | null>(null); // Hardware sensor heading
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  
  const qiblaAngle = 118; // Kaaba angle from North in London/Europe is roughly 118 degrees (South-East)
  
  // Calculate relative angle to Kaaba
  const relativeAngle = qiblaAngle - rotation;
  const isAligned = Math.abs((relativeAngle % 360)) <= 5 || Math.abs((relativeAngle % 360)) >= 355;

  // Attempt to listen to hardware compass device orientation
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // webkitCompassHeading is supported on iOS safari
      const compassHeading = (event as any).webkitCompassHeading;
      if (compassHeading !== undefined) {
        setHeading(compassHeading);
        setRotation(compassHeading);
        setPermissionState('granted');
      } else if (event.alpha !== null) {
        // Standard absolute orientation
        setHeading(360 - event.alpha);
        setRotation(360 - event.alpha);
        setPermissionState('granted');
      }
    };

    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation as any);
    } else if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      setPermissionState('unsupported');
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const requestPermission = async () => {
    const requestPermissionFn = (DeviceOrientationEvent as any).requestPermission;
    if (typeof requestPermissionFn === 'function') {
      try {
        const permission = await requestPermissionFn();
        if (permission === 'granted') {
          setPermissionState('granted');
        } else {
          setPermissionState('denied');
        }
      } catch (err) {
        console.error('Compass permission failed', err);
        setPermissionState('denied');
      }
    } else {
      // Permission not required or not supported directly
      setPermissionState('unsupported');
    }
  };

  return (
    <div className="animate-fade-in pb-24 text-center">
      {/* Dynamic Header */}
      <section className="mb-6">
        <div className="bg-[#faf6ee] dark:bg-[#15231e] border border-[#C5A059]/20 rounded-[28px] p-5 shadow-sm">
          <h3 className="text-sm font-serif italic font-semibold text-[#064E3B] dark:text-[#dfc28d] uppercase tracking-wider">
            Mathematical Compass
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Rotate the dial to align with the Kaaba at <strong className="text-[#C5A059] dark:text-[#dfc28d]">118° SE</strong>
          </p>
        </div>
      </section>

      {/* Main Interactive Compass Dial Card */}
      <section className="mb-6 flex justify-center py-4">
        <div className={`relative w-72 h-72 rounded-full p-2 flex items-center justify-center transition-all duration-700 ${
          isAligned 
            ? 'bg-[#faf6ee] dark:bg-[#15231e] ring-4 ring-[#C5A059] shadow-[0_0_50px_rgba(197,160,89,0.25)] animate-pulse-glow' 
            : 'bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 shadow-lg'
        }`}>
          
          {/* Compass Dial Outer Ring */}
          <div 
            className="w-full h-full rounded-full border-4 border-slate-100 dark:border-zinc-900/80 relative flex items-center justify-center transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${-rotation}deg)` }}
          >
            {/* Cardinal Markers */}
            <span className="absolute top-3 font-bold text-sm text-red-500 font-mono select-none">N</span>
            <span className="absolute bottom-3 font-bold text-sm text-[#064E3B] dark:text-[#dfc28d] font-mono select-none">S</span>
            <span className="absolute right-3 font-bold text-sm text-slate-400 font-mono select-none">E</span>
            <span className="absolute left-3 font-bold text-sm text-slate-400 font-mono select-none">W</span>
            
            <span className="absolute top-12 right-12 font-bold text-[9px] text-slate-300 font-mono select-none">NE</span>
            <span className="absolute bottom-12 right-12 font-bold text-[9px] text-slate-300 font-mono select-none">SE</span>
            <span className="absolute bottom-12 left-12 font-bold text-[9px] text-slate-300 font-mono select-none">SW</span>
            <span className="absolute top-12 left-12 font-bold text-[9px] text-slate-300 font-mono select-none">NW</span>
 
            {/* Little degree markers */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-2 bg-slate-200 dark:bg-zinc-800"
                style={{ transform: `rotate(${i * 30}deg) translateY(-120px)` }}
              />
            ))}

            {/* Glowing Golden Needle to Kaaba */}
            <div 
              className="absolute w-1.5 h-32 origin-center flex flex-col items-center justify-start"
              style={{ transform: `rotate(${qiblaAngle}deg)` }}
            >
              {/* Arrow pointer */}
              <div className="w-4 h-4 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-[#C5A059] drop-shadow-[0_0_5px_rgba(197,160,89,0.8)]" />
              <div className="w-1 h-14 bg-[#C5A059] drop-shadow-[0_0_3px_rgba(197,160,89,0.5)]" />
              <span className="text-[7px] text-[#C5A059] font-bold uppercase tracking-widest mt-1">Kaaba</span>
            </div>
          </div>

          {/* Compass Center Core */}
          <div className="absolute w-24 h-24 rounded-full bg-[#faf6ee] dark:bg-[#121c19] shadow-inner flex flex-col items-center justify-center z-10 select-none border border-[#C5A059]/10">
            {isAligned ? (
              <div className="text-center animate-bounce">
                <span className="text-xl">🕋</span>
                <p className="text-[9px] font-bold text-[#C5A059] dark:text-[#dfc28d] uppercase tracking-widest mt-1">
                  Aligned!
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Navigation className="w-6 h-6 text-[#C5A059] mx-auto transform rotate-45" />
                <p className="text-xs font-mono font-bold text-[#064E3B] dark:text-zinc-300 mt-1">
                  {Math.round(rotation)}°
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Manual Alignment Controller */}
      <section className="mb-6 bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 rounded-[28px] p-5 shadow-sm max-w-sm mx-auto">
        <h4 className="text-xs font-serif italic font-semibold text-slate-800 dark:text-zinc-200 mb-4 select-none">
          Tactile Alignment Slider
        </h4>
        
        <input 
          type="range"
          min="0"
          max="360"
          value={Math.round(rotation)}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-full h-2 bg-[#faf6ee] dark:bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#064E3B] dark:accent-[#C5A059] focus:outline-none"
        />
        
        <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <span>0° North</span>
          <span className="text-[#064E3B] dark:text-[#dfc28d]">Heading</span>
          <span>360°</span>
        </div>
      </section>

      {/* Geolocation Permissions / Informative Guidance */}
      <section className="max-w-sm mx-auto">
        {permissionState === 'prompt' && (
          <div className="bg-[#faf6ee] dark:bg-[#15231e] rounded-2xl p-4 border border-[#C5A059]/15 flex items-start gap-4 text-left">
            <AlertCircle className="w-5 h-5 text-[#C5A059] mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Hardware Compass Sensors
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                If you are on a real mobile device, allow access to your built-in gyroscopes for a live hardware-guided Qibla direction.
              </p>
              <button 
                onClick={requestPermission}
                className="mt-3 text-[10px] font-bold bg-[#064E3B] hover:bg-[#043427] text-white px-4 py-2 rounded-xl transition-all active:scale-95"
              >
                Access Compass Sensor
              </button>
            </div>
          </div>
        )}

        {permissionState === 'granted' && (
          <div className="bg-[#064E3B]/10 dark:bg-[#15231e]/50 border border-[#064E3B]/20 rounded-2xl p-4 flex items-start gap-4 text-left">
            <Navigation className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-[#064E3B] dark:text-[#dfc28d]">
                Live Sensor Tracking Enabled
              </h5>
              <p className="text-[11px] text-[#064E3B]/80 dark:text-[#dfc28d]/80 mt-1 leading-relaxed">
                Compass is now reading live gyroscope values from your device. Tilt the device flat on your hand for maximum accuracy.
              </p>
            </div>
          </div>
        )}

        {(permissionState === 'denied' || permissionState === 'unsupported') && (
          <div className="bg-[#faf6ee] dark:bg-[#15231e] border border-[#C5A059]/20 rounded-2xl p-4 flex items-start gap-4 text-left select-none">
            <Info className="w-5 h-5 text-[#C5A059] mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-serif italic font-bold text-[#064E3B] dark:text-[#dfc28d]">
                Tactile Calibration Active
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed italic">
                Hardware orientation sensor is blocked inside this browser iframe preview, which is standard. Use the **Tactile Slider** above to simulate real rotation.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
