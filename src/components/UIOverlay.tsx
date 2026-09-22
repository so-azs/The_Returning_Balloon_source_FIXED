import React from 'react';
import { RotateCcw, Sparkles, Bell, BellOff, Mic, MicOff, Settings } from 'lucide-react';
import { LevelData } from '../types';

interface UIOverlayProps {
  currentLevel: LevelData;
  levelIndex: number;
  totalLevels: number;
  shardsCollected: number;
  totalShards: number;
  isSfxMuted: boolean;
  isNarratorMuted: boolean;
  isNarratorSpeaking?: boolean;
  onToggleSfx: () => void;
  onToggleNarrator: () => void;
  onRestartLevel: () => void;
  onOpenSettings: () => void;
  softNotification: string | null;
  isMusicMuted?: boolean;
  isWindMuted?: boolean;
  onToggleMusic?: () => void;
  onToggleWind?: () => void;
}

export function UIOverlay({
  currentLevel,
  levelIndex,
  totalLevels,
  shardsCollected,
  totalShards,
  isSfxMuted,
  isNarratorMuted,
  isNarratorSpeaking = false,
  onToggleSfx,
  onToggleNarrator,
  onRestartLevel,
  onOpenSettings,
  softNotification,
}: UIOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 md:p-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full">
        {/* Level Info */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white shadow-lg flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-slate-300 font-light">
                المستوى {levelIndex + 1} من {totalLevels}
              </span>
              <span className="font-bold text-base md:text-lg text-slate-50 font-['Tajawal',sans-serif]">
                {currentLevel.name}
              </span>
            </div>
          </div>

          {/* Shards Progress Badges */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-3.5 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalShards }).map((_, i) => {
                const isCollected = i < shardsCollected;
                return (
                  <div
                    key={i}
                    title={`قبسة ذكرى ${i + 1}`}
                    className={`w-3 h-3 rotate-45 transition-all duration-300 rounded-xs ${
                      isCollected
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] scale-110'
                        : 'bg-white/20 border border-white/30'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-xs text-amber-200/90 font-mono font-medium ml-1">
              {shardsCollected}/{totalShards}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* SFX (Unified Sound Effects & Wind Atmosphere) Toggle */}
          <button
            id="btn-toggle-sfx"
            type="button"
            onClick={onToggleSfx}
            aria-label={isSfxMuted ? 'تشغيل المؤثرات الصوتية والرياح' : 'كتم المؤثرات الصوتية والرياح'}
            title={isSfxMuted ? 'تشغيل المؤثرات والأصوات (SFX: مغلق)' : 'كتم المؤثرات والأصوات (SFX: مفعّل)'}
            className={`h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl backdrop-blur-md border transition-all active:scale-95 shadow-md flex items-center gap-1.5 text-xs font-medium ${
              isSfxMuted
                ? 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                : 'bg-amber-950/60 border-amber-400/30 text-amber-200 hover:bg-amber-900/70 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
            }`}
          >
            {isSfxMuted ? (
              <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            ) : (
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            )}
            <span className="font-mono">SFX</span>
          </button>

          {/* Voice / Narrator (التعليق الصوتي) Toggle */}
          <button
            id="btn-toggle-voice"
            type="button"
            onClick={onToggleNarrator}
            aria-label={isNarratorMuted ? 'تشغيل التعليق الصوتي للراوي' : 'كتم التعليق الصوتي للراوي'}
            title={isNarratorMuted ? 'تشغيل صوت الراوي (التعليق الصوتي: مغلق)' : 'كتم صوت الراوي (التعليق الصوتي: مفعّل)'}
            className={`h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl backdrop-blur-md border transition-all active:scale-95 shadow-md flex items-center gap-1.5 text-xs font-medium ${
              isNarratorMuted
                ? 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                : isNarratorSpeaking
                ? 'bg-emerald-900/80 border-emerald-400/60 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.4)] animate-pulse'
                : 'bg-emerald-950/60 border-emerald-400/30 text-emerald-200 hover:bg-emerald-900/70 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
            }`}
          >
            {isNarratorMuted ? (
              <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            ) : (
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
            )}
            <span className="font-mono">Voice</span>
          </button>

          {/* Settings & Pause Button */}
          <button
            id="btn-open-settings"
            type="button"
            onClick={onOpenSettings}
            aria-label="الإعدادات وإيقاف مؤقت"
            title="الإعدادات وإيقاف مؤقت (Esc)"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/15 hover:bg-slate-800/80 hover:border-sky-400/40 text-slate-200 hover:text-white flex items-center justify-center transition-colors active:scale-95 shadow-md cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Restart Level */}
          <button
            id="btn-restart-level"
            type="button"
            onClick={onRestartLevel}
            aria-label="إعادة المستوى"
            title="إعادة المستوى من البداية"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/15 hover:bg-slate-800/80 text-white flex items-center justify-center transition-colors active:scale-95 shadow-md cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>

      {/* Middle Hint / Soft notification */}
      {softNotification && (
        <div className="self-center bg-slate-900/80 backdrop-blur-sm border border-white/15 text-slate-200 text-sm px-4 py-2 rounded-full shadow-lg transition-all animate-fade-in">
          {softNotification}
        </div>
      )}

      {/* Bottom Controls Hint (especially prominent in level 1) */}
      <div className="flex justify-center items-center pb-2">
        {levelIndex === 0 && (
          <div className="bg-slate-950/50 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-slate-200 text-xs md:text-sm flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>اضغط مع الاستمرار (مسافة أو الفأرة أو اللمس) = يصعد</span>
            <span className="text-white/40">•</span>
            <span>أفلت = يهبط</span>
          </div>
        )}
      </div>
    </div>
  );
}
