import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, CheckCircle2, Volume2, Mic } from 'lucide-react';
import { LevelData } from '../types';

interface LevelCompleteModalProps {
  level: LevelData;
  nextLevelName?: string;
  collectedShards: number;
  totalShards: number;
  onContinue: () => void;
  isNarratorSpeaking?: boolean;
  onReplayVoice?: () => void;
}

export function LevelCompleteModal({
  level,
  nextLevelName,
  collectedShards,
  totalShards,
  onContinue,
  isNarratorSpeaking = false,
  onReplayVoice,
}: LevelCompleteModalProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-slate-900/90 border border-amber-300/30 rounded-3xl p-6 md:p-8 text-center shadow-2xl relative"
      >
        <div className="w-16 h-16 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 mx-auto flex items-center justify-center mb-4 relative">
          <Sparkles className="w-8 h-8 animate-pulse" />
          {onReplayVoice && (
            <button
              id="btn-level-complete-voice"
              type="button"
              onClick={onReplayVoice}
              title="الاستماع للتعليق الصوتي للفصل"
              className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                isNarratorSpeaking
                  ? 'bg-emerald-600 border-emerald-300 text-white animate-pulse'
                  : 'bg-slate-800 border-amber-400/40 text-amber-300 hover:bg-slate-700'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs tracking-widest text-amber-300/80 mb-1">اكتمل الفصل</div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-50 font-['Tajawal',sans-serif] mb-1">
          {level.name}
        </h2>
        <p className="text-sm text-slate-300 mb-6 font-['Amiri',serif]">
          {level.theme.subtitle}
        </p>

        {/* Shards report */}
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 mb-6 flex items-center justify-around">
          <div className="text-right">
            <div className="text-xs text-slate-400">قبسات الذكرى</div>
            <div className="text-lg font-bold text-amber-300">
              {collectedShards} من {totalShards}
            </div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: totalShards }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rotate-45 rounded-xs ${
                  i < collectedShards
                    ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                    : 'bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Next level button */}
        <button
          id="btn-continue-next-level"
          type="button"
          onClick={onContinue}
          className="w-full py-4 bg-orange-700 hover:bg-orange-600 active:bg-orange-800 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer"
        >
          <span>المتابعة إلى {nextLevelName || 'المستوى التالي'}</span>
          <ArrowLeft className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}
