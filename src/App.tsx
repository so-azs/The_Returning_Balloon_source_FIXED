/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, LevelData, MemoryShard, DefeatInfo, ObstacleType } from './types';
import { LEVELS_DATA } from './game/levelsData';
import { soundEngine } from './audio/soundEngine';
import { narrator } from './audio/narratorEngine';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { LoadingScreen } from './components/LoadingScreen';
import { StartScreen } from './components/StartScreen';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { EndingScreen } from './components/EndingScreen';
import { MemoryPopup } from './components/MemoryPopup';
import { PauseSettingsModal } from './components/PauseSettingsModal';
import { DefeatModal } from './components/DefeatModal';

// Poetic story intro narration text for Shakir voice
const STORY_INTRO_TEXT = 'في يومٍ صيفي باغتته الرياح، انفلت من يد صاحبه، ليمضي في رحلة عبور ملحمية بين الآفاق وتيارات السحاب. رافق الخيط في مساره، واجمع قبسات الذكرى المضيئة، ليعود إلى حيث بدأ العهد وتستقر الطمأنينة.';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('LOADING');
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [levels, setLevels] = useState<LevelData[]>(() => JSON.parse(JSON.stringify(LEVELS_DATA)));
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(() => soundEngine.getSfxMuted());
  const [isNarratorMuted, setIsNarratorMuted] = useState<boolean>(() => narrator.getMuted());
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(() => soundEngine.getMuted());
  const [masterVolume, setMasterVolume] = useState<number>(() => soundEngine.getMasterVolume());
  const [sfxVolume, setSfxVolume] = useState<number>(() => soundEngine.getSfxVolume());
  const [narratorVolume, setNarratorVolume] = useState<number>(() => narrator.getVolume());
  const [isNarratorSpeaking, setIsNarratorSpeaking] = useState<boolean>(false);
  const [defeatInfo, setDefeatInfo] = useState<DefeatInfo | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);
  const hasAutoPlayedIntroRef = useRef<boolean>(
    typeof window !== 'undefined' && sessionStorage.getItem('cloud_path_intro_autoplayed') === 'true'
  );

  // Keyboard shortcut to toggle pause/settings with Escape or P key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED' && e.key === 'Escape') {
          setGameState('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Auto-play story intro narration immediately when the first page appears (RUNS ONCE ONLY)
  useEffect(() => {
    if (gameState !== 'START' || hasAutoPlayedIntroRef.current) return;

    let isDisposed = false;

    const markAutoPlayed = () => {
      hasAutoPlayedIntroRef.current = true;
      try {
        sessionStorage.setItem('cloud_path_intro_autoplayed', 'true');
      } catch {
        // ignore
      }
    };

    const tryPlayNarration = async () => {
      if (isDisposed || hasAutoPlayedIntroRef.current || narrator.getIsSpeaking() || narrator.getMuted()) return;
      markAutoPlayed();
      removeGestureListeners();

      soundEngine.init();
      await soundEngine.resume();
      await narrator.speak(STORY_INTRO_TEXT);
    };

    // 1. Immediate attempt (fires right after the first page appears)
    const autoTimer = window.setTimeout(() => {
      tryPlayNarration();
    }, 150);

    // 2. User gesture fallback: if browser autoplay policy blocks unprompted audio,
    // the very first click, tap, or key press immediately plays the story intro once.
    const handleUserGesture = () => {
      tryPlayNarration();
    };

    const removeGestureListeners = () => {
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
    };

    window.addEventListener('pointerdown', handleUserGesture, { passive: true, once: true });
    window.addEventListener('touchstart', handleUserGesture, { passive: true, once: true });
    window.addEventListener('click', handleUserGesture, { passive: true, once: true });
    window.addEventListener('keydown', handleUserGesture, { passive: true, once: true });

    return () => {
      isDisposed = true;
      clearTimeout(autoTimer);
      removeGestureListeners();
    };
  }, [gameState]);

  // Subscribe to Narrator speaking state
  useEffect(() => {
    const unsubscribe = narrator.subscribe((state) => {
      setIsNarratorSpeaking(state.isSpeaking);
    });
    return () => {
      unsubscribe();
      narrator.stop();
    };
  }, []);

  // Memory presentation popup
  const [activeMemoryText, setActiveMemoryText] = useState<string | null>(null);
  const [activeMemoryOrder, setActiveMemoryOrder] = useState<number>(1);
  const memoryTimeoutRef = useRef<number | null>(null);

  // Soft notifications (e.g. gentle rewinds)
  const [softNotification, setSoftNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<number | null>(null);

  // All collected memories for album
  const [collectedMemories, setCollectedMemories] = useState<{ levelId: number; text: string; order: number }[]>([]);

  const currentLevel = levels[currentLevelIndex] || levels[0];

  // Start the journey
  const handleStart = useCallback((levelIdx = 0) => {
    hasAutoPlayedIntroRef.current = true;
    try {
      sessionStorage.setItem('cloud_path_intro_autoplayed', 'true');
    } catch {
      // ignore
    }
    soundEngine.init();
    soundEngine.resume();
    narrator.stop();
    setCurrentLevelIndex(levelIdx);
    setGameState('PLAYING');
  }, []);

  // Shard collection
  const handleShardCollected = useCallback((shard: MemoryShard) => {
    // If narrator is not speaking right now, show immediately;
    // if queued, onStart will transition the card cleanly when this shard's voice begins
    if (!narrator.getIsSpeaking()) {
      setActiveMemoryText(shard.text);
      setActiveMemoryOrder(shard.order);
    }

    // Trigger Voice-over narration with sequential queue and pacing
    narrator.speak(shard.text, {
      enqueue: true,
      onStart: () => {
        setActiveMemoryText(shard.text);
        setActiveMemoryOrder(shard.order);
        if (memoryTimeoutRef.current) {
          clearTimeout(memoryTimeoutRef.current);
          memoryTimeoutRef.current = null;
        }
      },
      onEnd: () => {
        if (memoryTimeoutRef.current) {
          clearTimeout(memoryTimeoutRef.current);
        }
        memoryTimeoutRef.current = window.setTimeout(() => {
          setActiveMemoryText(null);
        }, 1800);
      },
    });

    setCollectedMemories((prev) => {
      // Avoid duplicate texts
      if (prev.some((m) => m.text === shard.text)) return prev;
      return [...prev, { levelId: currentLevel.id, text: shard.text, order: shard.order }];
    });
  }, [currentLevel.id]);

  // Soft rewind notice (No harsh death)
  const handleSoftRewind = useCallback(() => {
    setSoftNotification('نسيمٌ عليل يعيدك لآخر مسار آمن...');
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = window.setTimeout(() => {
      setSoftNotification(null);
    }, 2500);
  }, []);

  // Level Complete
  const handleLevelComplete = useCallback(() => {
    if (currentLevelIndex >= levels.length - 1) {
      // Reached the final window!
      narrator.stop();
      setGameState('ENDING');
    } else {
      setGameState('LEVEL_TRANSITION');
      // Gentle voice announcement of chapter completion
      narrator.speak(`اكتمل الفصل: ${currentLevel.name}. ${currentLevel.theme.subtitle}`);
    }
  }, [currentLevelIndex, levels.length, currentLevel.name, currentLevel.theme.subtitle]);

  // Next level
  const handleContinueNextLevel = useCallback(() => {
    narrator.stop();
    const nextIdx = currentLevelIndex + 1;
    if (nextIdx < levels.length) {
      setCurrentLevelIndex(nextIdx);
      setGameState('PLAYING');
    } else {
      setGameState('ENDING');
    }
  }, [currentLevelIndex, levels.length]);

  // Restart current level
  const handleRestartLevel = useCallback(() => {
    narrator.stop();
    setLevels((prev) => {
      const cloned: LevelData[] = JSON.parse(JSON.stringify(prev));
      const targetLvl = cloned[currentLevelIndex];
      // Reset shards and checkpoints in current level
      targetLvl.shards.forEach((s) => (s.collected = false));
      targetLvl.checkpoints.forEach((cp, idx) => (cp.activated = idx === 0));
      return cloned;
    });

    setSoftNotification('أُعيدَ المستوى من البداية');
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = window.setTimeout(() => {
      setSoftNotification(null);
    }, 2000);
  }, [currentLevelIndex]);

  // Replay entire game
  const handleRestartGame = useCallback(() => {
    narrator.stop();
    setLevels(JSON.parse(JSON.stringify(LEVELS_DATA)));
    setCollectedMemories([]);
    setCurrentLevelIndex(0);
    setGameState('PLAYING');
  }, []);

  // Unified SFX (sound effects + wind & weather) toggle
  const handleToggleSfx = useCallback(() => {
    const muted = soundEngine.toggleSfx();
    setIsSfxMuted(muted);
  }, []);

  // Narrator (Voiceover) toggle
  const handleToggleNarrator = useCallback(() => {
    const muted = narrator.toggleMute();
    setIsNarratorMuted(muted);
  }, []);

  // Master Volume Toggle
  const handleToggleMasterMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMasterMuted(muted);
  }, []);

  // Volume slider changers
  const handleChangeMasterVolume = useCallback((val: number) => {
    soundEngine.setMasterVolume(val);
    setMasterVolume(val);
    if (val > 0 && soundEngine.getMuted()) {
      soundEngine.setMuted(false);
      setIsMasterMuted(false);
    }
  }, []);

  const handleChangeSfxVolume = useCallback((val: number) => {
    soundEngine.setSfxVolume(val);
    setSfxVolume(val);
    if (val > 0 && soundEngine.getSfxMuted()) {
      soundEngine.setSfxMuted(false);
      setIsSfxMuted(false);
    }
  }, []);

  const handleChangeNarratorVolume = useCallback((val: number) => {
    narrator.setVolume(val);
    setNarratorVolume(val);
    if (val > 0 && narrator.getMuted()) {
      narrator.setMuted(false);
      setIsNarratorMuted(false);
    }
  }, []);

  // Modal navigation actions
  const handleOpenSettings = useCallback(() => {
    setGameState('PAUSED');
  }, []);

  const handleResumeGame = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleRestartLevelFromPause = useCallback(() => {
    handleRestartLevel();
    setGameState('PLAYING');
  }, [handleRestartLevel]);

  const handleGoToMainMenu = useCallback(() => {
    narrator.stop();
    setGameState('START');
  }, []);

  // Defeat / Collision Handler
  const handleDefeat = useCallback((obstacleType: ObstacleType, progressPercent: number) => {
    soundEngine.playDefeatSound();

    const shardsCollected = currentLevel.shards.filter((s) => s.collected).length;
    const totalShards = currentLevel.shards.length;
    const hasCheckpoint = currentLevel.checkpoints.some(
      (cp) => cp.activated && cp.id !== 'cp_0' && cp.x > currentLevel.playerStart.x + 40
    );

    setDefeatInfo({
      obstacleType,
      progressPercent,
      levelName: currentLevel.theme.name,
      levelIndex: currentLevelIndex,
      shardsCollected,
      totalShards,
      hasCheckpoint,
    });

    setGameState('GAME_OVER');
  }, [currentLevel, currentLevelIndex]);

  const handleRetryFromDefeat = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
    soundEngine.playWindGustSound();
    setGameState('PLAYING');
  }, []);

  const handleRestartLevelFromDefeat = useCallback(() => {
    handleRestartLevel();
    setGameState('PLAYING');
  }, [handleRestartLevel]);

  const handlePlayEncouragement = useCallback(async () => {
    soundEngine.init();
    await soundEngine.resume();
    if (isNarratorSpeaking) {
      narrator.stop();
    } else {
      await narrator.speak('لا تيأس.. فكل عاصفة تعقبها نسمات طمأنينة، وخيط الذكرى لا ينقطع ما دمت تحاول.');
    }
  }, [isNarratorSpeaking]);

  // Narrate Story Intro in Start Screen (Manual listen / stop button)
  const handleNarrateStoryIntro = useCallback(async () => {
    hasAutoPlayedIntroRef.current = true;
    try {
      sessionStorage.setItem('cloud_path_intro_autoplayed', 'true');
    } catch {
      // ignore
    }
    soundEngine.init();
    await soundEngine.resume();
    if (isNarratorSpeaking) {
      narrator.stop();
    } else {
      await narrator.speak(STORY_INTRO_TEXT);
    }
  }, [isNarratorSpeaking]);

  const shardsCollectedInCurrentLevel = currentLevel.shards.filter((s) => s.collected).length;

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-slate-950 font-['Tajawal',sans-serif]">
      <div className="relative aspect-[16/9] h-screen w-screen max-h-screen max-w-screen overflow-hidden bg-slate-950">
        {/* 2D Interactive Physics & Canvas Viewport */}
        <GameCanvas
          level={currentLevel}
          onShardCollected={handleShardCollected}
          onLevelComplete={handleLevelComplete}
          onSoftRewind={handleSoftRewind}
          onDefeat={handleDefeat}
          retryTrigger={retryTrigger}
          isPaused={gameState !== 'PLAYING'}
        />
      </div>

      {/* In-Game UI Overlay (Active during gameplay & pause) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <UIOverlay
          currentLevel={currentLevel}
          levelIndex={currentLevelIndex}
          totalLevels={levels.length}
          shardsCollected={shardsCollectedInCurrentLevel}
          totalShards={currentLevel.shards.length}
          isSfxMuted={isSfxMuted}
          isNarratorMuted={isNarratorMuted}
          isNarratorSpeaking={isNarratorSpeaking}
          onToggleSfx={handleToggleSfx}
          onToggleNarrator={handleToggleNarrator}
          onRestartLevel={handleRestartLevel}
          onOpenSettings={handleOpenSettings}
          softNotification={softNotification}
        />
      )}

      {/* In-Game Pause & Settings Panel */}
      {gameState === 'PAUSED' && (
        <PauseSettingsModal
          currentLevel={currentLevel}
          levelIndex={currentLevelIndex}
          totalLevels={levels.length}
          onResume={handleResumeGame}
          onRestartLevel={handleRestartLevelFromPause}
          onGoToMainMenu={handleGoToMainMenu}
          masterVolume={masterVolume}
          sfxVolume={sfxVolume}
          narratorVolume={narratorVolume}
          isMasterMuted={isMasterMuted}
          isSfxMuted={isSfxMuted}
          isNarratorMuted={isNarratorMuted}
          onChangeMasterVolume={handleChangeMasterVolume}
          onChangeSfxVolume={handleChangeSfxVolume}
          onChangeNarratorVolume={handleChangeNarratorVolume}
          onToggleMasterMute={handleToggleMasterMute}
          onToggleSfxMute={handleToggleSfx}
          onToggleNarratorMute={handleToggleNarrator}
        />
      )}

      {/* Defeat / Loss Panel (بانل الخسارة الاحترافي) */}
      {gameState === 'GAME_OVER' && defeatInfo && (
        <DefeatModal
          defeatInfo={defeatInfo}
          onRetry={handleRetryFromDefeat}
          onRestartLevel={handleRestartLevelFromDefeat}
          onGoToMainMenu={handleGoToMainMenu}
          isNarratorSpeaking={isNarratorSpeaking}
          onPlayEncouragement={handlePlayEncouragement}
        />
      )}

      {/* Poetic Memory Fragment Notification Toast with Voiceover */}
      <MemoryPopup
        memoryText={activeMemoryText}
        shardOrder={activeMemoryOrder}
        isSpeaking={isNarratorSpeaking}
        isMuted={isNarratorMuted}
        onReplay={() => {
          if (activeMemoryText) {
            narrator.speak(activeMemoryText);
          }
        }}
      />

      {/* Loading Screen */}
      {gameState === 'LOADING' && (
        <LoadingScreen onLoaded={() => setGameState('START')} />
      )}

      {/* Start Screen */}
      {gameState === 'START' && (
        <StartScreen
          onStart={handleStart}
          levels={levels}
          isSfxMuted={isSfxMuted}
          isNarratorMuted={isNarratorMuted}
          isNarratorSpeaking={isNarratorSpeaking}
          onToggleSfx={handleToggleSfx}
          onToggleNarrator={handleToggleNarrator}
          onNarrateStory={handleNarrateStoryIntro}
        />
      )}

      {/* Level Transition Modal */}
      {gameState === 'LEVEL_TRANSITION' && (
        <LevelCompleteModal
          level={currentLevel}
          nextLevelName={levels[currentLevelIndex + 1]?.name}
          collectedShards={shardsCollectedInCurrentLevel}
          totalShards={currentLevel.shards.length}
          onContinue={handleContinueNextLevel}
          isNarratorSpeaking={isNarratorSpeaking}
          onReplayVoice={() => {
            narrator.speak(`اكتمل الفصل: ${currentLevel.name}. ${currentLevel.theme.subtitle}`);
          }}
        />
      )}

      {/* Final Reunion Ending Screen */}
      {gameState === 'ENDING' && (
        <EndingScreen
          collectedMemories={collectedMemories}
          onRestartGame={handleRestartGame}
        />
      )}
    </main>
  );
}
