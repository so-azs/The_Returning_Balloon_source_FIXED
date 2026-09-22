import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import {
  RotateCcw,
  RefreshCw,
  Home,
  Sparkles,
  Wind,
  Volume2,
  MapPin,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { DefeatInfo, ObstacleType } from '../types';

interface DefeatModalProps {
  defeatInfo: DefeatInfo;
  onRetry: () => void;
  onRestartLevel: () => void;
  onGoToMainMenu: () => void;
  isNarratorSpeaking?: boolean;
  onPlayEncouragement?: () => void;
}

function getObstacleDetails(type: ObstacleType): { title: string; desc: string } {
  switch (type) {
    case 'BIRD':
      return {
        title: 'اصطدام بسرب طيور',
        desc: 'باغتت الطيور المهاجرة مسار البالون الرقيق فتفرقت ذراته في الهواء.',
      };
    case 'POWER_LINE':
      return {
        title: 'ملامسة أسلاك معلقة',
        desc: 'لامس خيط البالون أسلاك الكهرباء المشدودة في فضاء المدينة.',
      };
    case 'BRANCH':
      return {
        title: 'تشابك بأغصان الأشجار',
        desc: 'علق البالون بين التواءات الأغصان العالية وأوراق الشجر الكثيفة.',
      };
    case 'STORM_CLOUD':
      return {
        title: 'تيار عاصف ركامي',
        desc: 'سحب تيار السحابة الرعدية البالون نحو دوامة هوائية مضطربة.',
      };
    case 'LIGHTNING_NODE':
      return {
        title: 'شحنة صاعقة رعدية',
        desc: 'عصفت الصاعقة بمسار الطيران الرقيق فبددت توازنه.',
      };
    case 'CHIMNEY':
      return {
        title: 'اصطدام بمدخنة حجرية',
        desc: 'حجبت المداخن الحجرية مجرى النسيم واعتدت على مسار الصعود.',
      };
    case 'BUILDING_ROOF':
      return {
        title: 'الاقتراب من أسطح المباني',
        desc: 'اصطدم البالون بزوايا القرميد والأسطح الحجرية.',
      };
    case 'KITE':
      return {
        title: 'تشابك مع طائرة ورقية',
        desc: 'تداخل خيط البالون مع خيوط طائرة ورقية تائهة بين السحب.',
      };
    default:
      return {
        title: 'تعثر في مهب الرياح',
        desc: 'باغتت التيارات الهوائية العاتية خيط البالون الرقيق فتعثر مساره.',
      };
  }
}

export function DefeatModal({
  defeatInfo,
  onRetry,
  onRestartLevel,
  onGoToMainMenu,
  isNarratorSpeaking = false,
  onPlayEncouragement,
}: DefeatModalProps) {
  const obstacleDetails = getObstacleDetails(defeatInfo.obstacleType);
  const progressPercent = Math.max(0, Math.min(100, Math.round(defeatInfo.progressPercent)));

  // Listen to keyboard shortcuts: Enter / Space / R to retry immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Enter' || e.key === ' ' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRetry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRetry]);

  return (
    <div
      id="defeat-modal-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 select-none overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-orange-500/25 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.7)] relative text-white"
      >
        {/* Soft atmospheric red / amber glow behind top badge */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-orange-500/15 blur-2xl pointer-events-none rounded-full" />

        {/* Top Header Avatar */}
        <div className="flex flex-col items-center text-center mb-5 relative">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-400/30 text-orange-300 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(251,146,60,0.2)] relative">
            <Wind className="w-7 h-7 animate-pulse" />
            {onPlayEncouragement && (
              <button
                id="btn-defeat-voice-replay"
                type="button"
                onClick={onPlayEncouragement}
                title="الاستماع لصوت الراوي المشجع"
                aria-label="الاستماع لكلمات الراوي المشجعة"
                className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  isNarratorSpeaking
                    ? 'bg-orange-700 border-orange-300 text-white animate-pulse'
                    : 'bg-slate-800 border-orange-400/40 text-orange-200 hover:bg-slate-700'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs font-semibold tracking-widest text-orange-300/90 uppercase mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>تعثر المسار</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-['Tajawal',sans-serif] text-slate-50 mb-1">
            تمزق الخيط في مهب الرياح
          </h2>

          <div className="text-xs text-slate-400">
            <span>المستوى {defeatInfo.levelIndex + 1}: </span>
            <span className="text-amber-300 font-medium">{defeatInfo.levelName}</span>
          </div>
        </div>

        {/* Cause of Defeat Banner */}
        <div className="bg-orange-950/30 border border-orange-500/20 rounded-2xl p-3.5 mb-4 text-center">
          <div className="text-xs font-bold text-orange-200 mb-0.5">
            {obstacleDetails.title}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-['Amiri',serif]">
            {obstacleDetails.desc}
          </p>
        </div>

        {/* Progress & Stats Card */}
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 mb-5 space-y-3">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>المسافة المقطوعة نحو النافذة:</span>
              </span>
              <span className="font-mono text-sky-300 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-700/80 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]"
              />
            </div>
          </div>

          {/* Stats Grid: Shards & Checkpoint */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
            <div className="bg-slate-900/40 rounded-xl p-2.5 text-center">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>القبسات المجمعة</span>
              </div>
              <div className="text-sm font-bold text-amber-300 font-mono">
                {defeatInfo.shardsCollected} من {defeatInfo.totalShards}
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-xl p-2.5 text-center">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>نقطة الاستئناف</span>
              </div>
              <div className="text-xs font-semibold text-emerald-300">
                {defeatInfo.hasCheckpoint ? 'آخر نقطة أمان' : 'بداية المرحلة'}
              </div>
            </div>
          </div>
        </div>

        {/* Poetic Encouragement Quote */}
        <p className="text-xs sm:text-sm text-slate-300/90 text-center font-['Amiri',serif] italic mb-5 leading-relaxed">
          «لا تيأس.. فكل عاصفةٍ تعقبها نسمات طمأنينة، وخيط الذكرى لا ينقطع ما دمت تحاول.»
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* 1. Retry Button (Hero Primary Action - Single Unified Color) */}
          <button
            id="btn-retry-from-defeat"
            type="button"
            onClick={onRetry}
            className="w-full py-3.5 px-5 rounded-2xl bg-orange-700 hover:bg-orange-600 active:bg-orange-800 text-white font-bold text-base shadow-[0_0_20px_rgba(194,65,12,0.4)] flex items-center justify-center gap-2.5 transition-all active:scale-98 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-white stroke-[2.5]" />
            <span>المحاولة مجدداً</span>
            <span className="text-xs font-mono font-normal opacity-80 px-2 py-0.5 rounded-md bg-black/20">
              Enter
            </span>
          </button>

          {/* 2. Secondary Actions Grid: Restart Level & Main Menu */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              id="btn-restart-level-from-defeat"
              type="button"
              onClick={onRestartLevel}
              className="py-3 px-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-amber-400/30 text-slate-200 hover:text-amber-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4 text-amber-300" />
              <span>إعادة المستوى</span>
            </button>

            <button
              id="btn-main-menu-from-defeat"
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
