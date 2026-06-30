import { useState, useEffect, useRef } from 'react';
import { Navigation, AlertCircle, Info, MapPin, Compass } from 'lucide-react';
import { motion } from 'motion/react';

// Calculate Qibla bearing from a given lat/lon toward Mecca (21.4225°N, 39.8262°E)
function calculateQibla(lat: number, lon: number): number {
  const meccaLat = 21.4225 * (Math.PI / 180);
  const meccaLon = 39.8262 * (Math.PI / 180);
  const userLat = lat * (Math.PI / 180);
  const userLon = lon * (Math.PI / 180);
  const dLon = meccaLon - userLon;
  const y = Math.sin(dLon) * Math.cos(meccaLat);
  const x = Math.cos(userLat) * Math.sin(meccaLat) - Math.sin(userLat) * Math.cos(meccaLat) * Math.cos(dLon);
  const bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

export default function Qibla() {
  const [heading, setHeading] = useState<number>(0);
  const [qiblaAngle, setQiblaAngle] = useState<number>(118);
  const [sensorState, setSensorState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const smoothHeading = useRef(0);

  // Get user location and compute precise Qibla bearing
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const bearing = calculateQibla(pos.coords.latitude, pos.coords.longitude);
        setQiblaAngle(bearing);
        setLocationState('ok');
      },
      () => setLocationState('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Smooth heading update via requestAnimationFrame to avoid jitter
  const applyHeading = (rawHeading: number) => {
    let current = smoothHeading.current;
    // Unwrap angle to avoid sudden 359→0 flips
    let delta = ((rawHeading - current + 540) % 360) - 180;
    const lerped = current + delta * 0.12;
    smoothHeading.current = (lerped + 360) % 360;
    setHeading(smoothHeading.current);
  };

  // Attach device orientation sensor
  useEffect(() => {
    let listenerAttached = false;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const webkitHeading = (event as any).webkitCompassHeading;
      if (webkitHeading != null && !isNaN(webkitHeading)) {
        // iOS: webkitCompassHeading is degrees clockwise from magnetic north
        applyHeading(webkitHeading);
        setSensorState('granted');
      } else if ((event as any).absolute && event.alpha != null) {
        // Android absolute orientation: alpha is degrees CCW from north → convert to CW
        applyHeading((360 - event.alpha) % 360);
        setSensorState('granted');
      } else if (event.alpha != null) {
        // Fallback relative orientation
        applyHeading((360 - event.alpha) % 360);
        setSensorState('granted');
      }
    };

    const attach = () => {
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientation as any);
        listenerAttached = true;
      } else if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
        listenerAttached = true;
      } else {
        setSensorState('unsupported');
      }
    };

    // iOS 13+ requires explicit permission request
    const requestFn = (DeviceOrientationEvent as any).requestPermission;
    if (typeof requestFn === 'function') {
      // Don't auto-attach on iOS — wait for button press
    } else {
      attach();
    }

    return () => {
      if (listenerAttached) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation as any);
        window.removeEventListener('deviceorientation', handleOrientation);
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const requestPermission = async () => {
    const requestFn = (DeviceOrientationEvent as any).requestPermission;
    if (typeof requestFn === 'function') {
      try {
        const result = await requestFn();
        if (result === 'granted') {
          setSensorState('granted');
          const handleOrientation = (event: DeviceOrientationEvent) => {
            const webkitHeading = (event as any).webkitCompassHeading;
            if (webkitHeading != null && !isNaN(webkitHeading)) {
              applyHeading(webkitHeading);
            } else if (event.alpha != null) {
              applyHeading((360 - event.alpha) % 360);
            }
          };
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setSensorState('denied');
        }
      } catch {
        setSensorState('denied');
      }
    } else {
      setSensorState('unsupported');
    }
  };

  // The needle angle on screen = qiblaAngle - deviceHeading
  // (the dial rotates -heading, so the needle which is OUTSIDE the dial needs the same correction)
  const needleAngle = (qiblaAngle - heading + 360) % 360;

  // Tolerance: within ±5° of Qibla
  const isAligned = needleAngle <= 5 || needleAngle >= 355;

  const headingDeg = Math.round(heading);
  const qiblaDeg = Math.round(qiblaAngle);

  return (
    <div className="animate-fade-in pb-24 text-center select-none">

      {/* Header Info Bar */}
      <section className="mb-6">
        <div className="bg-[#faf6ee] dark:bg-[#15231e] border border-[#C5A059]/20 rounded-[28px] p-5 shadow-sm">
          <h3 className="text-sm font-serif italic font-semibold text-[#064E3B] dark:text-[#dfc28d] uppercase tracking-wider">
            Live Qibla Compass
          </h3>
          <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              Qibla: <strong className="text-[#C5A059]">{qiblaDeg}°</strong>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              Heading: <strong className="text-[#064E3B] dark:text-[#dfc28d]">{headingDeg}°</strong>
            </span>
            {locationState === 'ok' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                <MapPin className="w-3 h-3" /> GPS Located
              </span>
            )}
            {locationState === 'loading' && (
              <span className="text-[10px] text-slate-400 animate-pulse">📍 Getting location…</span>
            )}
          </div>
        </div>
      </section>

      {/* Main Compass */}
      <section className="mb-6 flex justify-center py-2">
        <div className={`relative w-72 h-72 rounded-full flex items-center justify-center transition-all duration-700 ${
          isAligned
            ? 'ring-4 ring-[#C5A059] shadow-[0_0_60px_rgba(197,160,89,0.35)] bg-[#faf6ee] dark:bg-[#15231e]'
            : 'bg-white dark:bg-[#0f1513] border border-slate-200/50 dark:border-zinc-900/50 shadow-xl'
        }`}>

          {/* Rotating Compass Rose — rotates opposite to device heading so N always points to actual North */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-zinc-900/80"
            style={{ rotate: -heading }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          >
            {/* Cardinal Letters */}
            <span className="absolute top-2.5 left-1/2 -translate-x-1/2 font-bold text-sm text-red-500 font-mono">N</span>
            <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 font-bold text-sm text-slate-400 font-mono">S</span>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400 font-mono">E</span>
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400 font-mono">W</span>

            {/* Intercardinal */}
            <span className="absolute top-10 right-10 font-bold text-[9px] text-slate-300 font-mono">NE</span>
            <span className="absolute bottom-10 right-10 font-bold text-[9px] text-slate-300 font-mono">SE</span>
            <span className="absolute bottom-10 left-10 font-bold text-[9px] text-slate-300 font-mono">SW</span>
            <span className="absolute top-10 left-10 font-bold text-[9px] text-slate-300 font-mono">NW</span>

            {/* Degree tick marks */}
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                className={`absolute left-1/2 top-1/2 origin-bottom ${i % 3 === 0 ? 'w-0.5 h-3 bg-slate-300 dark:bg-zinc-600' : 'w-px h-2 bg-slate-200 dark:bg-zinc-800'}`}
                style={{ transform: `rotate(${i * 10}deg) translateX(-50%) translateY(-136px)` }}
              />
            ))}
          </motion.div>

          {/* Fixed Qibla Needle — always points toward Mecca in world space */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ rotate: needleAngle }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          >
            {/* The needle is centered, pointing upward from center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 w-0 h-0">
              {/* Arrowhead */}
              <div
                className="absolute"
                style={{
                  bottom: 4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderBottom: '22px solid #C5A059',
                  filter: 'drop-shadow(0 0 6px rgba(197,160,89,0.9))',
                }}
              />
              {/* Needle shaft */}
              <div
                className="absolute bg-[#C5A059]"
                style={{
                  top: 'auto',
                  bottom: -88,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 3,
                  height: 80,
                  background: 'linear-gradient(to bottom, #C5A059, #A08040)',
                  boxShadow: '0 0 8px rgba(197,160,89,0.5)',
                }}
              />
              {/* Kaaba label */}
              <div
                className="absolute left-1/2 -translate-x-1/2 text-[7px] text-[#C5A059] font-bold uppercase tracking-widest whitespace-nowrap"
                style={{ bottom: -106 }}
              >
                🕋 Kaaba
              </div>
            </div>
          </motion.div>

          {/* Center Core */}
          <div className="absolute w-20 h-20 rounded-full bg-[#faf6ee] dark:bg-[#121c19] shadow-inner flex flex-col items-center justify-center z-20 border border-[#C5A059]/20">
            {isAligned ? (
              <motion.div
                className="text-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                <span className="text-2xl">🕋</span>
                <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-widest mt-0.5">Aligned!</p>
              </motion.div>
            ) : (
              <div className="text-center">
                <Compass className="w-6 h-6 text-[#C5A059] mx-auto" />
                <p className="text-[10px] font-mono font-bold text-[#064E3B] dark:text-zinc-300 mt-1">
                  {Math.round(needleAngle)}° off
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Status / Permission Banner */}
      <section className="max-w-sm mx-auto space-y-3">
        {sensorState === 'prompt' && (
          <div className="bg-[#faf6ee] dark:bg-[#15231e] rounded-2xl p-4 border border-[#C5A059]/15 flex items-start gap-4 text-left">
            <AlertCircle className="w-5 h-5 text-[#C5A059] mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Enable Live Compass</h5>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Tap below to activate your device's compass sensor for automatic rotation.
              </p>
              <button
                onClick={requestPermission}
                className="mt-3 text-[10px] font-bold bg-[#064E3B] hover:bg-[#043427] text-white px-4 py-2 rounded-xl transition-all active:scale-95"
              >
                Enable Compass Sensor
              </button>
            </div>
          </div>
        )}

        {sensorState === 'granted' && (
          <div className="bg-[#064E3B]/10 dark:bg-[#15231e]/50 border border-[#064E3B]/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-left">
              <h5 className="text-xs font-bold text-[#064E3B] dark:text-[#dfc28d]">Live Sensor Active</h5>
              <p className="text-[11px] text-[#064E3B]/80 dark:text-[#dfc28d]/80 mt-0.5">
                Rotate your device — the compass will follow. Hold it flat for best accuracy.
              </p>
            </div>
          </div>
        )}

        {(sensorState === 'denied' || sensorState === 'unsupported') && (
          <div className="bg-[#faf6ee] dark:bg-[#15231e] border border-[#C5A059]/20 rounded-2xl p-4 flex items-start gap-4 text-left">
            <Info className="w-5 h-5 text-[#C5A059] mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-serif italic font-bold text-[#064E3B] dark:text-[#dfc28d]">
                {sensorState === 'unsupported' ? 'Sensor Unavailable' : 'Sensor Access Denied'}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {sensorState === 'unsupported'
                  ? 'Your browser/device does not support compass sensors. The Qibla direction is shown above based on your GPS location.'
                  : 'Compass permission was denied. Please allow Motion & Orientation access in your device settings and reload.'}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
