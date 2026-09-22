import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Sparkles, Compass } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface LoadingScreenProps {
  onLoaded: () => void;
}

const LOADING_STEPS = [
  { threshold: 0, text: 'تهيئة مسارات الرياح وتيارات السحاب...' },
  { threshold: 25, text: 'استدعاء قبسات الذكرى والألحان الشجية...' },
  { threshold: 55, text: 'دوزنة أوتار الصوت ...' },
  { threshold: 80, text: '   تجهيز ...' },
  { threshold: 98, text: 'اكتملت الاستعدادات.. استعد' },
];

export function LoadingScreen({ onLoaded }: LoadingScreenProps) {
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>(LOADING_STEPS[0].text);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  useEffect(() => {
    // Try to silently pre-initialize audio context if possible
    try {
      soundEngine.init();
    } catch {
      // Audio might require user interaction; handled gracefully
    }

    let currentProgress = 0;
    const interval = setInterval(() => {
      // Natural organic easing speed
      const increment = currentProgress < 60 ? Math.random() * 5 + 3 : Math.random() * 3 + 2;
      currentProgress = Math.min(100, currentProgress + increment);
      const rounded = Math.floor(currentProgress);
      setProgress(rounded);

      // Update poetic status text based on progress
      for (let i = LOADING_STEPS.length - 1; i >= 0; i--) {
        if (rounded >= LOADING_STEPS[i].threshold) {
          setStatusText(LOADING_STEPS[i].text);
          break;
        }
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsFinishing(true);
        // Calm breath pause before switching to Start Screen
        const timer = setTimeout(() => {
          onLoaded();
        }, 500);
        return () => clearTimeout(timer);
      }
    }, 55);

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <motion.div
      id="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 text-white select-none overflow-hidden"
    >
      {/* Background Ambience: Subtle drifting mist & stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Ambient Bottom Warmth */}
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Drifting Clouds in Background */}
        <motion.div
          animate={{ x: [-80, 80, -80], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -left-20 w-96 h-40 bg-white/5 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ x: [80, -80, 80], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/3 -right-20 w-96 h-48 bg-sky-300/5 rounded-full blur-3xl"
        />

        {/* Scattered Soft Shimmering Stars */}
        {[
          { x: '15%', y: '20%', size: 2, delay: 0 },
          { x: '80%', y: '18%', size: 3, delay: 0.7 },
          { x: '25%', y: '65%', size: 2.5, delay: 1.2 },
          { x: '75%', y: '70%', size: 2, delay: 0.4 },
          { x: '50%', y: '12%', size: 3, delay: 1.5 },
          { x: '88%', y: '45%', size: 2, delay: 0.9 },
        ].map((star, idx) => (
          <motion.div
            key={idx}
            style={{ left: star.x, top: star.y, width: star.size, height: star.size }}
            animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
            className="absolute rounded-full bg-amber-200/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
          />
        ))}
      </div>

      {/* Center Content Box */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
        {/* Floating Glowing Balloon */}
        <div className="relative mb-6">
          <motion.div
            animate={{
              y: [0, -12, 0],
              rotate: [-2, 3, -2],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-20 h-28 relative flex flex-col items-center"
          >
            {/* Ambient Red Glow */}
            <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-xl scale-125 pointer-events-none" />

            {/* Balloon 3D Sphere SVG */}
            <svg viewBox="0 0 100 112" className="w-full h-full drop-shadow-[0_8px_20px_rgba(220,38,38,0.5)] overflow-visible">
              <defs>
                <radialGradient id="loadingBalloonGrad" cx="35%" cy="32%" r="68%">
                  <stop offset="0%" stopColor="#FFA4A4" />
                  <stop offset="25%" stopColor="#FF4D4D" />
                  <stop offset="65%" stopColor="#DC2626" />
                  <stop offset="90%" stopColor="#991B1B" />
                  <stop offset="100%" stopColor="#580D0D" />
                </radialGradient>
              </defs>

              {/* Main Sphere */}
              <path
                d="M 50 10 C 26 10, 10 28, 10 52 C 10 74, 32 94, 47 103 L 53 103 C 68 94, 90 74, 90 52 C 90 28, 74 10, 50 10 Z"
                fill="url(#loadingBalloonGrad)"
              />
              {/* Highlight curve */}
              <ellipse cx="36" cy="34" rx="14" ry="9" fill="#FFFFFF" fillOpacity="0.35" transform="rotate(-28 36 34)" />
              {/* Bottom knot */}
              <polygon points="45,103 55,103 53,109 47,109" fill="#991B1B" />
              {/* Waving thread */}
              <path
                d="M 50 109 Q 44 118, 52 126 T 47 140"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        </div>

        {/* Game Title & Brand */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-sky-200 mb-3 backdrop-blur-sm">
            <Wind className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
            <span>رحلة عبور شاعرية</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm font-['Tajawal',sans-serif]">
           البالون العائد 
          </h1>

          <p className="mt-2 text-sm text-slate-400 font-light">
            الذكريات
          </p>
        </motion.div>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-900/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
          {/* Progress Bar Track */}
          <div className="relative w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
            <motion.div
              className="h-full bg-sky-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.7)] transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
            {/* Subtle glow highlight on moving head */}
            <div
              className="absolute top-0 bottom-0 w-8 bg-white/40 blur-sm rounded-full pointer-events-none transition-all duration-150"
              style={{ left: `calc(${progress}% - 16px)` }}
            />
          </div>

          {/* Percentage and Dynamic Poetic Status */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-mono text-amber-300 font-semibold text-sm">
              {progress}%
            </span>
            <div className="flex items-center gap-1.5 text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap max-w-[280px]">
              <Sparkles className="w-3.5 h-3.5 text-sky-300 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
              <AnimatePresence mode="wait">
                <motion.span
                  key={statusText}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="font-light text-slate-200 truncate"
                >
                  {statusText}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Instant Skip Button */}
        <div className="mt-6 flex items-center justify-center">
          <button
            id="btn-skip-loading"
            type="button"
            onClick={onLoaded}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 px-3 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 active:scale-95"
          >
            تخطي التحميل
          </button>
        </div>
      </div>
    </motion.div>
  );
}
