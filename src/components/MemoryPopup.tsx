import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, VolumeX, Mic } from 'lucide-react';

interface MemoryPopupProps {
  memoryText: string | null;
  shardOrder: number;
  isSpeaking?: boolean;
  isMuted?: boolean;
  onReplay?: () => void;
}

export function MemoryPopup({
  memoryText,
  shardOrder,
  isSpeaking = false,
  isMuted = false,
  onReplay,
}: MemoryPopupProps) {
  return (
    <AnimatePresence>
      {memoryText && (
        <motion.div
          key={memoryText}
          initial={{ opacity: 0, y: 25, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[92%] pointer-events-none"
        >
          <div className="bg-slate-900/90 backdrop-blur-md border border-amber-300/40 text-amber-100 px-5 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-right justify-between relative overflow-hidden">
            {/* Ambient gold glow on top border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            {/* Left/Content area */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-300/30 flex items-center justify-center shrink-0 text-amber-300 shadow-inner">
                {isSpeaking ? (
                  <div className="flex items-center justify-center gap-0.5 h-4">
                    <span className="w-1 h-3 bg-amber-300 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-2.5 bg-amber-300 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                ) : (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-amber-300/80 mb-0.5 tracking-wider font-sans">
                  <span>قبسة ذكرى #{shardOrder}</span>
                  {isSpeaking && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 font-mono">
                      <Mic className="w-2.5 h-2.5 animate-pulse text-amber-300" />
                      صوت الراوي: شاكر
                    </span>
                  )}
                </div>
                <div className="text-base sm:text-lg font-['Amiri',serif] font-bold text-amber-50 drop-shadow-sm leading-relaxed">
                  "{memoryText}"
                </div>
              </div>
            </div>

            {/* Replay voice button */}
            {onReplay && !isMuted && (
              <button
                id="btn-replay-memory-voice"
                type="button"
                onClick={onReplay}
                aria-label="إعادة الاستماع للتعليق الصوتي"
                title="إعادة الاستماع للتعليق الصوتي للذكرى"
                className="pointer-events-auto shrink-0 h-9 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 hover:text-amber-100 flex items-center gap-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse text-amber-300' : ''}`} />
                <span className="font-['Tajawal',sans-serif]">استمع</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
