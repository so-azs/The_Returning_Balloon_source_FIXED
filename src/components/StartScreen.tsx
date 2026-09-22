import React from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, Wind, Compass, Bell, BellOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { LevelData } from '../types';

interface StartScreenProps {
  onStart: (levelIndex?: number) => void;
  levels: LevelData[];
  isSfxMuted?: boolean;
  isNarratorMuted?: boolean;
  isNarratorSpeaking?: boolean;
  onToggleSfx?: () => void;
  onToggleNarrator?: () => void;
  onNarrateStory?: () => void;
  isMusicMuted?: boolean;
  isWindMuted?: boolean;
  onToggleMusic?: () => void;
  onToggleWind?: () => void;
}

export function StartScreen({
  onStart,
  levels,
  isSfxMuted = false,
  isNarratorMuted = false,
  isNarratorSpeaking = false,
  onToggleSfx,
  onToggleNarrator,
  onNarrateStory,
}: StartScreenProps) {
  const [showChapters, setShowChapters] = React.useState(false);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-sky-900/90 via-slate-900/95 to-slate-950/98 backdrop-blur-md p-6 overflow-hidden">
      {/* Top Controls on Start Screen */}
      {(onToggleSfx || onToggleNarrator) && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 z-50">
          {onToggleSfx && (
            <button
              id="btn-start-toggle-sfx"
              type="button"
              onClick={onToggleSfx}
              aria-label={isSfxMuted ? 'تشغيل المؤثرات والأصوات' : 'كتم المؤثرات والأصوات'}
              title={isSfxMuted ? 'تشغيل المؤثرات والرياح (SFX: مغلق)' : 'كتم المؤثرات والرياح (SFX: مفعّل)'}
              className={`h-9 px-3 rounded-xl backdrop-blur-md border transition-all active:scale-95 shadow-md flex items-center gap-1.5 text-xs font-medium ${
                isSfxMuted
                  ? 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                  : 'bg-amber-950/60 border-amber-400/30 text-amber-200 hover:bg-amber-900/70'
              }`}
            >
              {isSfxMuted ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5 text-amber-300" />}
              <span className="font-mono">SFX</span>
            </button>
          )}

          {onToggleNarrator && (
            <button
              id="btn-start-toggle-voice"
              type="button"
              onClick={onToggleNarrator}
              aria-label={isNarratorMuted ? 'تشغيل التعليق الصوتي' : 'كتم التعليق الصوتي'}
              title={isNarratorMuted ? 'تشغيل التعليق الصوتي للراوي (مغلق)' : 'كتم التعليق الصوتي للراوي (مفعّل)'}
              className={`h-9 px-3 rounded-xl backdrop-blur-md border transition-all active:scale-95 shadow-md flex items-center gap-1.5 text-xs font-medium ${
                isNarratorMuted
                  ? 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                  : isNarratorSpeaking
                  ? 'bg-emerald-900/80 border-emerald-400/60 text-emerald-200 animate-pulse'
                  : 'bg-emerald-950/60 border-emerald-400/30 text-emerald-200 hover:bg-emerald-900/70'
              }`}
            >
              {isNarratorMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-300" />}
              <span className="font-mono">Voice</span>
            </button>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-xl w-full text-center flex flex-col items-center relative py-6"
      >
        {/* Floating Red Balloon Icon Preview */}
        <div className="relative mb-6">
          <motion.div
            animate={{
              y: [0, -14, 0],
              rotate: [-3, 4, -3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-24 h-32 relative flex flex-col items-center"
          >
            {/* Real Spherical Balloon Body (Circular 3D Sphere with bottom taper) */}
            <div className="relative w-20 h-22 flex items-center justify-center">
              {/* Outer soft ambient glow */}
              <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-xl scale-125 pointer-events-none" />

              {/* True Spherical Balloon SVG with realistic radial gradient & specular curves */}
              <svg viewBox="0 0 100 112" className="w-full h-full drop-shadow-[0_8px_24px_rgba(220,38,38,0.55)] overflow-visible">
                <defs>
                  {/* Spherical volume lighting: Highlight top-left, rich red body, darker curved rim */}
                  <radialGradient id="balloonSphericalLight" cx="35%" cy="32%" r="68%">
                    <stop offset="0%" stopColor="#FFA4A4" />
                    <stop offset="25%" stopColor="#FF4D4D" />
                    <stop offset="65%" stopColor="#DC2626" />
                    <stop offset="90%" stopColor="#991B1B" />
                    <stop offset="100%" stopColor="#7F1D1D" />
                  </radialGradient>

                  {/* Soft bottom rim reflected bounce light */}
                  <radialGradient id="balloonRimBounce" cx="60%" cy="85%" r="45%">
                    <stop offset="0%" stopColor="rgba(254, 202, 202, 0.4)" />
                    <stop offset="100%" stopColor="rgba(220, 38, 38, 0)" />
                  </radialGradient>

                  {/* Glossy specular curved highlight */}
                  <linearGradient id="specularGlint" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
                    <stop offset="60%" stopColor="rgba(255, 255, 255, 0.25)" />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                  </linearGradient>
                </defs>

                {/* Spherical Balloon Body - Completely round top and sides with authentic slight bottom pinch towards the neck knot */}
                <path
                  d="M 50,2 
                     C 77,2 98,23 98,51 
                     C 98,74 80,95 56,101 
                     L 54,103 
                     L 50,103.5 
                     L 46,103 
                     L 44,101 
                     C 20,95 2,74 2,51 
                     C 2,23 23,2 50,2 Z"
                  fill="url(#balloonSphericalLight)"
                />

                {/* Subtle bottom bounced ambient light */}
                <path
                  d="M 50,2 
                     C 77,2 98,23 98,51 
                     C 98,74 80,95 56,101 
                     L 54,103 
                     L 50,103.5 
                     L 46,103 
                     L 44,101 
                     C 20,95 2,74 2,51 
                     C 2,23 23,2 50,2 Z"
                  fill="url(#balloonRimBounce)"
                />

                {/* Primary curved glossy reflection (realistic elliptical curved sheen) */}
                <ellipse
                  cx="34"
                  cy="28"
                  rx="14"
                  ry="8"
                  transform="rotate(-38 34 28)"
                  fill="url(#specularGlint)"
                />

                {/* Secondary pin-point glint */}
                <circle cx="23" cy="38" r="2.5" fill="rgba(255,255,255,0.6)" />

                {/* Realistic Balloon Knot and Tied Flare */}
                <path
                  d="M 46,102 
                     C 47,105 45,108 43,110 
                     C 48,111 52,111 57,110 
                     C 55,108 53,105 54,102 
                     Z"
                  fill="#991B1B"
                />
                {/* Knot band wrap */}
                <ellipse cx="50" cy="103" rx="4.5" ry="1.8" fill="#7F1D1D" />
              </svg>
            </div>

            {/* Trailing Silk Ribbon String */}
            <svg width="32" height="48" className="overflow-visible -mt-1">
              <motion.path
                animate={{
                  d: [
                    "M16,0 Q10,16 20,28 T14,48",
                    "M16,0 Q22,14 12,26 T18,48",
                    "M16,0 Q10,16 20,28 T14,48",
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                fill="none"
                stroke="rgba(254, 202, 202, 0.9)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-['Tajawal',sans-serif] text-white drop-shadow-md mb-2">
         البالون العائد 
        </h1>
        <div className="text-sm md:text-base font-light tracking-wide text-sky-200/80 mb-6 font-['Amiri',serif] italic">
          The Returning Balloon
        </div>

        {/* Story Intro */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 mb-8 text-slate-200 leading-relaxed text-sm md:text-base font-['Tajawal',sans-serif] text-right shadow-inner relative overflow-hidden group">
          <p className="mb-3">
            في يومٍ صيفي باغتته الرياح، انفلت من يد صاحبه، ليمضي في رحلة عبور ملحمية بين الآفاق وتيارات السحاب.
          </p>
          <p className="text-amber-200/90 font-medium mb-4">
            رافق الخيط في مساره، واجمع قبسات الذكرى المضيئة، ليعود إلى حيث بدأ.
          </p>

          {/* Voice Narrator Button for Story - Shakir Male Voice */}
          {onNarrateStory && (
            <div className="pt-3.5 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 flex items-center gap-1.5 font-sans">
                  <Mic className="w-3.5 h-3.5 text-sky-400" />
                  صوت الراوي:
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-400/40 text-sky-200 text-xs font-medium font-sans">
                  شاكر (رخيم)
                </span>
              </div>

              <button
                id="btn-listen-story-narration"
                type="button"
                onClick={onNarrateStory}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                  isNarratorSpeaking
                    ? 'bg-sky-600 border-sky-400 text-white shadow-[0_0_20px_rgba(2,132,199,0.5)] animate-pulse'
                    : 'bg-sky-950/80 hover:bg-sky-900/90 border-sky-400/40 text-sky-200'
                }`}
              >
                <Volume2 className={`w-4 h-4 ${isNarratorSpeaking ? 'animate-bounce text-white' : 'text-sky-300'}`} />
                <span>
                  {isNarratorSpeaking
                    ? 'جارٍ الإلقاء بصوت شاكر... (اضغط للإيقاف)'
                    : 'استمع لمقدمة القصة بصوت شاكر (رخيم)'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* One-Button Controls Notice */}
        <div className="grid grid-cols-2 gap-3 w-full mb-8 text-xs md:text-sm">
          <div className="bg-slate-800/60 border border-white/10 p-3 rounded-xl flex items-center gap-3 text-right">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center shrink-0">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100">اضغط مع الاستمرار</div>
              <div className="text-slate-400 text-xs">زر المسافة أو الفأرة أو اللمس للصعود</div>
            </div>
          </div>
          <div className="bg-slate-800/60 border border-white/10 p-3 rounded-xl flex items-center gap-3 text-right">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100">أفلت للنزول</div>
              <div className="text-slate-400 text-xs">الانجراف لليمين تلقائي وناعم</div>
            </div>
          </div>
        </div>

        {/* Start Game Buttons */}
        {!showChapters ? (
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              id="btn-start-game"
              type="button"
              onClick={() => onStart(0)}
              className="px-8 py-4 bg-orange-700 hover:bg-orange-600 active:bg-orange-800 text-white font-bold text-lg rounded-2xl shadow-[0_4px_25px_rgba(234,88,12,0.4)] flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>ابدأ الرحلة</span>
            </button>

            <button
              id="btn-show-chapters"
              type="button"
              onClick={() => setShowChapters(true)}
              className="px-6 py-4 bg-slate-800/80 hover:bg-slate-700/80 border border-white/15 text-slate-200 font-medium rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Compass className="w-5 h-5 text-amber-300" />
              <span>فصول الرحلة</span>
            </button>
          </div>
        ) : (
          <div className="w-full">
            <div className="text-sm text-slate-300 mb-3 flex items-center justify-between">
              <span>اختر فصلاً للبدء منه:</span>
              <button
                type="button"
                onClick={() => setShowChapters(false)}
                className="text-xs text-amber-300 hover:underline"
              >
                رجوع
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              {levels.map((lvl, index) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => onStart(index)}
                  className="p-3.5 bg-slate-800/80 hover:bg-slate-700/90 border border-white/10 rounded-xl text-right transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                      {lvl.id}. {lvl.name}
                    </div>
                    <div className="text-xs text-slate-400">{lvl.theme.subtitle}</div>
                  </div>
                  <Play className="w-4 h-4 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-[-2px] transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 text-xs text-slate-400 font-medium tracking-wide">
          <span>Twrni Game Jam 7</span>
        </div>
      </motion.div>
    </div>
  );
}
