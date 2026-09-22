import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  RotateCcw,
  Home,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Wind,
  Mic,
  MicOff,
  Sparkles,
  X,
} from 'lucide-react';
import { LevelData } from '../types';

interface PauseSettingsModalProps {
  currentLevel: LevelData;
  levelIndex: number;
  totalLevels: number;
  onResume: () => void;
  onRestartLevel: () => void;
  onGoToMainMenu: () => void;
  masterVolume: number; // 0.0 - 1.0
  sfxVolume: number; // 0.0 - 1.0
  narratorVolume: number; // 0.0 - 1.0
  isMasterMuted: boolean;
  isSfxMuted: boolean;
  isNarratorMuted: boolean;
  onChangeMasterVolume: (val: number) => void;
  onChangeSfxVolume: (val: number) => void;
  onChangeNarratorVolume: (val: number) => void;
  onToggleMasterMute: () => void;
  onToggleSfxMute: () => void;
  onToggleNarratorMute: () => void;
}

export function PauseSettingsModal({
  currentLevel,
  levelIndex,
  totalLevels,
  onResume,
  onRestartLevel,
  onGoToMainMenu,
  masterVolume,
  sfxVolume,
  narratorVolume,
  isMasterMuted,
  isSfxMuted,
  isNarratorMuted,
  onChangeMasterVolume,
  onChangeSfxVolume,
  onChangeNarratorVolume,
  onToggleMasterMute,
  onToggleSfxMute,
  onToggleNarratorMute,
}: PauseSettingsModalProps) {
  // Handle ESC key to resume game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume]);

  const masterPercent = isMasterMuted ? 0 : Math.round(masterVolume * 100);
  const sfxPercent = isSfxMuted ? 0 : Math.round(sfxVolume * 100);
  const narratorPercent = isNarratorMuted ? 0 : Math.round(narratorVolume * 100);

  return (
    <div
      id="pause-settings-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative text-white"
      >
        {/* Close / Resume Top-Left Button */}
        <button
          id="btn-close-settings-modal"
          type="button"
          onClick={onResume}
          title="استئناف اللعب (Esc)"
          aria-label="إغلاق الإعدادات واستئناف اللعب"
          className="absolute top-5 left-5 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/20 text-sky-300 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
            <SlidersHorizontal className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold font-['Tajawal',sans-serif] text-slate-50 tracking-tight">
            الإعدادات والإيقاف المؤقت
          </h2>

          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span>المستوى {levelIndex + 1} من {totalLevels}:</span>
            <span className="text-amber-300 font-medium">{currentLevel.name}</span>
            <span className="text-white/30">•</span>
            <span className="font-['Amiri',serif] italic">{currentLevel.theme.subtitle}</span>
          </div>
        </div>

        {/* Audio Sliders Section */}
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 space-y-4">
          <div className="text-xs font-semibold tracking-wider text-slate-300 flex items-center gap-1.5 pb-1 border-b border-white/5">
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            <span>التحكم بمستوى الصوت</span>
          </div>

          {/* 1. Master Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <button
                  type="button"
                  onClick={onToggleMasterMute}
                  title={isMasterMuted ? 'إلغاء كتم الصوت العام' : 'كتم الصوت العام'}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-300 transition-colors"
                >
                  {isMasterMuted || masterVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-sky-300" />
                  )}
                </button>
                <span className="font-medium">الصوت العام (Master)</span>
              </div>
              <span className="font-mono text-slate-300 font-medium">{masterPercent}%</span>
            </div>
            <div className="relative flex items-center">
              <input
                id="slider-master-volume"
                type="range"
                min="0"
                max="100"
                value={masterPercent}
                onChange={(e) => onChangeMasterVolume(Number(e.target.value) / 100)}
                className="w-full h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. SFX & Wind Ambience Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <button
                  type="button"
                  onClick={onToggleSfxMute}
                  title={isSfxMuted ? 'إلغاء كتم المؤثرات والرياح' : 'كتم المؤثرات والرياح'}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-300 transition-colors"
                >
                  {isSfxMuted || sfxVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Wind className="w-4 h-4 text-amber-300" />
                  )}
                </button>
                <span className="font-medium">المؤثرات الصوتية والرياح (SFX)</span>
              </div>
              <span className="font-mono text-slate-300 font-medium">{sfxPercent}%</span>
            </div>
            <div className="relative flex items-center">
              <input
                id="slider-sfx-volume"
                type="range"
                min="0"
                max="100"
                value={sfxPercent}
                onChange={(e) => onChangeSfxVolume(Number(e.target.value) / 100)}
                className="w-full h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Narrator Voice Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <button
                  type="button"
                  onClick={onToggleNarratorMute}
                  title={isNarratorMuted ? 'إلغاء كتم صوت الراوي' : 'كتم صوت الراوي'}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-300 transition-colors"
                >
                  {isNarratorMuted || narratorVolume === 0 ? (
                    <MicOff className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Mic className="w-4 h-4 text-emerald-300" />
                  )}
                </button>
                <span className="font-medium">صوت الراوي الشاعري (Voice)</span>
              </div>
              <span className="font-mono text-slate-300 font-medium">{narratorPercent}%</span>
            </div>
            <div className="relative flex items-center">
              <input
                id="slider-narrator-volume"
                type="range"
                min="0"
                max="100"
                value={narratorPercent}
                onChange={(e) => onChangeNarratorVolume(Number(e.target.value) / 100)}
                className="w-full h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons: Resume, Restart, Main Menu */}
        <div className="flex flex-col gap-2.5">
          {/* 1. Resume Game Button (Primary Hero Action - Single Unified Color) */}
          <button
            id="btn-resume-game"
            type="button"
            onClick={onResume}
            className="w-full py-3.5 px-5 rounded-2xl bg-orange-700 hover:bg-orange-600 active:bg-orange-800 text-white font-bold text-base shadow-[0_0_20px_rgba(194,65,12,0.35)] flex items-center justify-center gap-2.5 transition-all active:scale-98 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>استئناف اللعب</span>
          </button>

          {/* 2. Restart Level Button */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              id="btn-restart-level-from-modal"
              type="button"
              onClick={onRestartLevel}
              className="py-3 px-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-amber-400/30 text-slate-200 hover:text-amber-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4 text-amber-300" />
              <span>إعادة المرحلة</span>
            </button>

            {/* 3. Return to Main Home Screen */}
            <button
              id="btn-main-menu-from-modal"
              type="button"
              onClick={onGoToMainMenu}
              className="py-3 px-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-sky-400/30 text-slate-200 hover:text-sky-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Home className="w-4 h-4 text-sky-300" />
              <span>الصفحة الرئيسية</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
