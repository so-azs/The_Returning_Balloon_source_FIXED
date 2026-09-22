import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Heart, BookOpen, Sparkles, X, Volume2, Mic } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { narrator } from '../audio/narratorEngine';

interface EndingScreenProps {
  collectedMemories: { levelId: number; text: string; order: number }[];
  onRestartGame: () => void;
}

export function EndingScreen({ collectedMemories, onRestartGame }: EndingScreenProps) {
  const [showAlbum, setShowAlbum] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Play warm reunion melody and laughter harmonics
    soundEngine.playReunionMelody();

    // Subscribe to narrator state
    const unsubscribe = narrator.subscribe((state) => {
      setIsSpeaking(state.isSpeaking);
    });

    // Speak the poetic ending closing line after a brief emotional beat
    const timer = setTimeout(() => {
      narrator.speak('عُدْتُ.. طول مسير، فغدت كل سحابةٍ عَبَرْناها ذكرى محفورة في صفحة الوفاء.');
    }, 1400);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const handleSpeakEndingLine = () => {
    narrator.speak('عُدْتُ.. طول مسير، فغدت كل سحابةٍ عَبَرْناها ذكرى محفورة في صفحة الوفاء.');
  };

  const handleSpeakMemory = (text: string) => {
    narrator.speak(text);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-amber-950/80 via-slate-950/95 to-slate-950 p-4 md:p-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="max-w-xl w-full text-center flex flex-col items-center py-6"
      >
        {/* Step 1: The Child at the Window opening it & The Vintage Polaroid Photo */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="bg-amber-50 p-4 pb-7 rounded-lg shadow-2xl border border-amber-200/50 max-w-xs md:max-w-sm w-full mb-8 relative transform hover:rotate-0 transition-transform"
        >
          {/* Subtle tape at top */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-100/60 backdrop-blur-xs border-y border-amber-200/50 rotate-1 shadow-xs" />

          {/* Polaroid Image Canvas / Artwork */}
          <div className="w-full aspect-[4/3] rounded overflow-hidden relative border border-amber-200/60 bg-sky-100 shadow-inner">
            <svg
              viewBox="0 0 360 270"
              className="w-full h-full block select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Sky Gradient */}
                <linearGradient id="morningSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#BAE6FD" />
                  <stop offset="45%" stopColor="#FEF3C7" />
                  <stop offset="85%" stopColor="#FED7AA" />
                  <stop offset="100%" stopColor="#FEE2E2" />
                </linearGradient>

                {/* Sun Glow */}
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
                  <stop offset="40%" stopColor="#FDE68A" stopOpacity="0.9" />
                  <stop offset="75%" stopColor="#FBBF24" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>

                {/* Balloon Radial Gradient */}
                <radialGradient id="balloonGrad" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#FDA4AF" />
                  <stop offset="25%" stopColor="#F43F5E" />
                  <stop offset="70%" stopColor="#E11D48" />
                  <stop offset="100%" stopColor="#9F1239" />
                </radialGradient>

                {/* Soft Shadow Filter */}
                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.2" />
                </filter>
              </defs>

              {/* Sky Background */}
              <rect x="0" y="0" width="360" height="270" fill="url(#morningSky)" />

              {/* Radiant Sun in the Morning Sky */}
              <circle cx="300" cy="55" r="55" fill="url(#sunGlow)" />
              <circle cx="300" cy="55" r="24" fill="#FEF08A" opacity="0.9" />

              {/* Distant Hills / Trees */}
              <path
                d="M 0 210 Q 80 170 180 190 T 360 180 L 360 270 L 0 270 Z"
                fill="#86EFAC"
                opacity="0.5"
              />
              <path
                d="M 0 225 Q 120 190 240 215 T 360 205 L 360 270 L 0 270 Z"
                fill="#4ADE80"
                opacity="0.6"
              />

              {/* Open Window Arch Frame */}
              <path
                d="M 20 0 L 20 270 M 340 0 L 340 270"
                stroke="#78350F"
                strokeWidth="12"
                opacity="0.8"
              />
              {/* Fluttering White Curtain on the Left */}
              <path
                d="M 20 0 C 65 50, 35 130, 60 230 L 20 230 Z"
                fill="#FFFFFF"
                opacity="0.8"
              />

              {/* Wooden Windowsill Ledge at Bottom */}
              <rect x="0" y="226" width="360" height="44" fill="#92400E" rx="3" />
              <rect x="0" y="226" width="360" height="8" fill="#B45309" />
              <rect x="0" y="224" width="360" height="3" fill="#D97706" />

              {/* Floating Reunion Sparkles between Player and Balloon */}
              <g fill="#F59E0B" opacity="0.85">
                <path d="M 188 115 Q 192 115 192 111 Q 192 115 196 115 Q 192 115 192 119 Q 192 115 188 115 Z" />
                <path d="M 198 140 Q 201 140 201 137 Q 201 140 204 140 Q 201 140 201 143 Q 201 140 198 140 Z" />
                <path d="M 175 90 Q 178 90 178 87 Q 178 90 181 90 Q 178 90 178 93 Q 178 90 175 90 Z" />
              </g>

              {/* ================================================== */}
              {/* THE PLAYER (CHILD) - Positioned on the Left-Center */}
              {/* ================================================== */}
              <g id="player-character" filter="url(#softShadow)">
                {/* Child Body / Blue Sweater */}
                <path
                  d="M 98 178 Q 130 172 162 178 L 168 228 L 92 228 Z"
                  fill="#38BDF8"
                />
                {/* Sweater Collar */}
                <path
                  d="M 118 175 Q 130 186 142 175"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Left arm resting on windowsill */}
                <path
                  d="M 98 184 Q 85 204 90 226"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                <circle cx="90" cy="226" r="6.5" fill="#FDE68A" />

                {/* Right arm resting comfortably on windowsill */}
                <path
                  d="M 154 184 Q 170 204 165 226"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                <circle cx="165" cy="226" r="6.5" fill="#FDE68A" />

                {/* Neck */}
                <rect x="125" y="163" width="10" height="15" fill="#FDE68A" rx="2" />

                {/* Head */}
                <circle cx="130" cy="140" r="23" fill="#FDE68A" />

                {/* Hair */}
                <path
                  d="M 107 140 C 107 112, 153 112, 153 140 C 147 127, 134 122, 120 125 C 114 127, 109 133, 107 140 Z"
                  fill="#78350F"
                />
                <path
                  d="M 112 128 Q 118 120 126 126"
                  fill="none"
                  stroke="#92400E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Smiling Closed Eyes */}
                <path
                  d="M 116 138 Q 120 134 124 138"
                  fill="none"
                  stroke="#78350F"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 136 138 Q 140 134 144 138"
                  fill="none"
                  stroke="#78350F"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* Rosy Cheeks */}
                <circle cx="117" cy="145" r="4.5" fill="#F43F5E" opacity="0.35" />
                <circle cx="143" cy="145" r="4.5" fill="#F43F5E" opacity="0.35" />

                {/* Joyful Smile */}
                <path
                  d="M 124 148 Q 130 156 136 148"
                  fill="none"
                  stroke="#78350F"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </g>

              {/* ================================================== */}
              {/* THE BALLOON - Floating freely beside the Person!   */}
              {/* Beside him at X=242, Y=130 (Head level side-by-side) */}
              {/* ================================================== */}
              <g id="red-balloon" filter="url(#softShadow)">
                {/* Balloon Knot at bottom */}
                <polygon points="238,168 246,168 242,161" fill="#9F1239" />

                {/* Balloon Body (Classic Egg-oval balloon shape) */}
                <path
                  d="M 242 94 C 265 94, 276 112, 272 138 C 268 156, 251 164, 242 164 C 233 164, 216 156, 212 138 C 208 112, 219 94, 242 94 Z"
                  fill="url(#balloonGrad)"
                />

                {/* Glossy Curved Highlight */}
                <ellipse
                  cx="230"
                  cy="114"
                  rx="6"
                  ry="12"
                  transform="rotate(-24 230 114)"
                  fill="#FFFFFF"
                  opacity="0.65"
                />
                <circle cx="225" cy="132" r="2.5" fill="#FFFFFF" opacity="0.6" />
              </g>
            </svg>

            {/* Vintage Sepia/Film grain subtle overlay */}
            <div className="absolute inset-0 bg-amber-500/8 pointer-events-none mix-blend-color" />
          </div>

          {/* Handwritten Polaroid Caption */}
          <div className="mt-4 font-['Amiri',serif] text-slate-700 text-lg font-bold text-center">
            "معًا من جديد.. في بهاء الصباح"
          </div>
          <div className="text-[10px] text-slate-400 font-sans tracking-widest mt-0.5">
            • عودة المسافر
          </div>
        </motion.div>

        {/* Step 2: The Final Poetic Word: "عُدْتُ" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8 }}
          className="mb-8"
        >
          <div className="text-6xl md:text-7xl lg:text-8xl font-black font-['Amiri',serif] text-amber-200 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
            عُدْتُ.
          </div>
          <p className="text-slate-300 text-base md:text-lg font-['Tajawal',sans-serif] mt-3 max-w-md mx-auto leading-relaxed">
            .. طول مسير، فغدت كل سحابةٍ عَبَرْناها ذكرى محفورة في صفحة الوفاء.
          </p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              id="btn-ending-listen-voice"
              type="button"
              onClick={handleSpeakEndingLine}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                isSpeaking
                  ? 'bg-amber-500/30 border-amber-300 text-amber-200 animate-pulse'
                  : 'bg-white/10 hover:bg-white/15 border-white/20 text-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeaking ? 'جارٍ الإلقاء الصوتي...' : 'استمع لصوت الراوي'}</span>
            </button>
          </div>
        </motion.div>

        {/* Shards summary and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-sm"
        >
          {/* View Memories Album */}
          <button
            id="btn-view-memories"
            type="button"
            onClick={() => setShowAlbum(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/90 hover:bg-slate-700 border border-amber-300/30 text-amber-200 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <BookOpen className="w-5 h-5 text-amber-300" />
            <span>قبسات الذكرى ({collectedMemories.length})</span>
          </button>

          {/* Replay */}
          <button
            id="btn-replay-game"
            type="button"
            onClick={onRestartGame}
            className="w-full sm:w-auto px-6 py-3.5 bg-orange-700 hover:bg-orange-600 active:bg-orange-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            <span>خوض الرحلة ثانية</span>
          </button>
        </motion.div>
      </motion.div>

      {/* Memory Album Modal */}
      {showAlbum && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-amber-300/30 max-w-lg w-full max-h-[85vh] rounded-3xl p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-amber-300">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-lg font-['Tajawal',sans-serif]">ألبوم قبسات الذكرى</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAlbum(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 text-right">
              {collectedMemories.length > 0 ? (
                collectedMemories.map((mem, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-800/60 border border-amber-300/15 rounded-xl flex items-start gap-3 justify-between"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-slate-100 font-['Amiri',serif] text-base leading-relaxed">
                        "{mem.text}"
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeakMemory(mem.text)}
                      className="shrink-0 p-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/30 text-amber-300 hover:text-amber-100 transition-all active:scale-95 cursor-pointer"
                      title="الاستماع لهذه الذكرى بصوت الراوي"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center py-8">
                  لم يتم جمع قبسات بعد.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => setShowAlbum(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium cursor-pointer"
              >
                إغلاق الألبوم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
