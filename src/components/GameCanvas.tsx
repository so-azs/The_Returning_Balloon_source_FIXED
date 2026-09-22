import React, { useEffect, useRef } from 'react';
import { LevelData, Player, Point, Checkpoint, MemoryShard, ObstacleType } from '../types';
import { createInitialPlayer, updatePlayerPhysics, updateParticles, Particle } from '../game/physics';
import { GameRenderer } from '../game/renderer';
import { soundEngine } from '../audio/soundEngine';
import { narrator } from '../audio/narratorEngine';

interface GameCanvasProps {
  level: LevelData;
  onShardCollected: (shard: MemoryShard) => void;
  onLevelComplete: () => void;
  onSoftRewind: () => void;
  onDefeat: (obstacleType: ObstacleType, progressPercent: number) => void;
  isPaused: boolean;
  retryTrigger?: number;
}

export function GameCanvas({
  level,
  onShardCollected,
  onLevelComplete,
  onSoftRewind,
  onDefeat,
  isPaused,
  retryTrigger,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mutable game state held in refs for 60fps loop performance
  const playerRef = useRef<Player>(createInitialPlayer(level.playerStart));
  const activeCheckpointRef = useRef<Checkpoint>(level.checkpoints[0] || { id: 'cp_0', x: 100, y: 350, activated: true });
  const particlesRef = useRef<Particle[]>([]);
  const cameraXRef = useRef<number>(0);
  const rendererRef = useRef<GameRenderer | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const isInputDownRef = useRef<boolean>(false);
  const hasCompletedLevelRef = useRef<boolean>(false);

  // Initialize or reset level state when level prop changes
  useEffect(() => {
    playerRef.current = createInitialPlayer(level.playerStart);
    activeCheckpointRef.current = level.checkpoints[0] || { id: 'cp_0', x: level.playerStart.x, y: level.playerStart.y, activated: true };
    particlesRef.current = [];
    cameraXRef.current = 0;
    hasCompletedLevelRef.current = false;

    // Reset weather audio
    soundEngine.setWeather(level.theme.weatherType === 'RAIN_STORM');
  }, [level]);

  // Handle retry trigger to restore player to active checkpoint
  useEffect(() => {
    if (retryTrigger === undefined || retryTrigger === 0) return;
    const cp = activeCheckpointRef.current;
    const player = playerRef.current;
    if (player && cp) {
      player.x = cp.x;
      player.y = cp.y;
      player.vx = 2.5;
      player.vy = 0;
      player.isDissolving = false;
      player.dissolveProgress = 0;
      for (let i = 0; i < player.stringNodes.length; i++) {
        player.stringNodes[i] = { x: player.x - i * 5, y: player.y + 14 + i * 5 };
      }
      cameraXRef.current = Math.max(0, cp.x - 220);
    }
  }, [retryTrigger]);

  // Canvas resize and render setup
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    rendererRef.current = new GameRenderer(ctx);

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rendererRef.current?.setSize(rect.width, rect.height);
    };

    updateSize();

    const ro = new ResizeObserver(() => {
      updateSize();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  }, []);

  // Main 60fps Game Loop
  useEffect(() => {
    let lastTime = performance.now();
    let globalTime = 0;

    const loop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      globalTime += deltaTime;

      const player = playerRef.current;
      const renderer = rendererRef.current;

      if (!isPaused && player && renderer) {
        // Apply input state to player
        player.isHolding = isInputDownRef.current;

        // Physics update
        updatePlayerPhysics(
          player,
          level,
          activeCheckpointRef.current,
          particlesRef.current,
          onShardCollected,
          () => {
            if (!hasCompletedLevelRef.current) {
              hasCompletedLevelRef.current = true;
              onLevelComplete();
            }
          },
          onSoftRewind,
          deltaTime,
          (obstacleType, progressPercent) => {
            // Brief moment for petals burst before bringing up Defeat panel
            window.setTimeout(() => {
              onDefeat(obstacleType, progressPercent);
            }, 300);
          }
        );

        // Particle updates
        updateParticles(particlesRef.current, deltaTime);

        // Smooth Camera follow (keeping player ~25% from left edge)
        const targetCameraX = Math.max(0, player.x - 220);
        cameraXRef.current += (targetCameraX - cameraXRef.current) * 0.1;

        // Render Frame
        renderer.render(
          player,
          level,
          activeCheckpointRef.current,
          particlesRef.current,
          cameraXRef.current,
          globalTime
        );
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [level, isPaused, onShardCollected, onLevelComplete, onSoftRewind]);

  // Input Handlers (Keyboard, Mouse, Touch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        isInputDownRef.current = true;
        soundEngine.resume();
        narrator.unlock();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        isInputDownRef.current = false;
      }
    };

    const handleGlobalPointerRelease = () => {
      isInputDownRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerup', handleGlobalPointerRelease);
    window.addEventListener('pointercancel', handleGlobalPointerRelease);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerup', handleGlobalPointerRelease);
      window.removeEventListener('pointercancel', handleGlobalPointerRelease);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if unsupported
    }
    isInputDownRef.current = true;
    soundEngine.resume();
    narrator.unlock();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }
    isInputDownRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-full cursor-pointer select-none overflow-hidden touch-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
