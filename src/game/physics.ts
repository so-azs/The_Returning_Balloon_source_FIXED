import { Player, LevelData, Point, MemoryShard, Checkpoint, Obstacle, ObstacleType } from '../types';
import { soundEngine } from '../audio/soundEngine';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  type?: 'STAR' | 'SPARKLE' | 'AIR_MOTE' | 'DEFAULT';
  rotation?: number;
  vRot?: number;
}

export function createInitialPlayer(start: Point): Player {
  const nodes: Point[] = [];
  for (let i = 0; i < 9; i++) {
    nodes.push({ x: start.x - i * 5, y: start.y + 14 + i * 5 });
  }

  return {
    x: start.x,
    y: start.y,
    vx: 2.5,
    vy: 0,
    radius: 14,
    rotation: 0,
    wobbleAngle: 0,
    trail: [],
    stringNodes: nodes,
    isHolding: false,
    isInWind: false,
    windEffect: { x: 0, y: 0 },
    isDissolving: false,
    dissolveProgress: 0,
  };
}

export function updatePlayerPhysics(
  player: Player,
  level: LevelData,
  activeCheckpoint: Checkpoint,
  particles: Particle[],
  onShardCollected: (shard: MemoryShard) => void,
  onLevelComplete: () => void,
  onSoftRewind: () => void,
  deltaTime: number = 0.0166,
  onDefeat?: (obstacleType: ObstacleType, progressPercent: number) => void
): void {
  // Normalize delta time to 60fps baseline (1 frame = ~0.01666s)
  const dtScale = Math.min(Math.max((deltaTime || 0.0166) / 0.01666, 0.4), 2.5);

  // If dissolving during soft rewind
  if (player.isDissolving) {
    player.dissolveProgress += 0.035 * dtScale;
    if (player.dissolveProgress >= 1.0) {
      // Restore to last checkpoint
      player.x = activeCheckpoint.x;
      player.y = activeCheckpoint.y;
      player.vx = 2.5;
      player.vy = 0;
      player.isDissolving = false;
      player.dissolveProgress = 0;
      // Reset string
      for (let i = 0; i < player.stringNodes.length; i++) {
        player.stringNodes[i] = { x: player.x - i * 5, y: player.y + 14 + i * 5 };
      }
    }
    return;
  }

  // Check wind zones with smooth easing and boundary interpolation
  player.isInWind = false;
  let targetWindX = 0;
  let targetWindY = 0;

  for (const zone of level.windZones) {
    if (
      player.x >= zone.x &&
      player.x <= zone.x + zone.width &&
      player.y >= zone.y &&
      player.y <= zone.y + zone.height
    ) {
      player.isInWind = true;
      // Edge buffer for organic ease-in (balloon glides into wind instead of harsh snap)
      const distLeft = player.x - zone.x;
      const distRight = (zone.x + zone.width) - player.x;
      const distTop = player.y - zone.y;
      const distBottom = (zone.y + zone.height) - player.y;
      const edgeDist = Math.min(distLeft, distRight, distTop, distBottom);
      const edgeFactor = Math.min(1, Math.max(0.4, edgeDist / 35));
      const str = zone.strength * edgeFactor;

      if (zone.direction === 'UP') {
        targetWindY -= str * 0.52;
        targetWindX += 0.12; // subtle buoyant drift
      } else if (zone.direction === 'DOWN') {
        targetWindY += str * 0.52;
        targetWindX -= 0.05;
      } else if (zone.direction === 'FORWARD') {
        targetWindX += str * 0.95;
        targetWindY -= 0.10; // aerodynamic lift from forward airstream
      } else if (zone.direction === 'TURBULENT') {
        targetWindX += Math.sin(player.x * 0.03) * str * 0.5;
        targetWindY += Math.cos(player.y * 0.03) * str * 0.55;
      }
    }
  }

  // Smooth lerp of wind effect for fluid organic response
  player.windEffect = player.windEffect || { x: 0, y: 0 };
  const lerpFactor = Math.min(1, 0.12 * dtScale);
  player.windEffect.x += (targetWindX - player.windEffect.x) * lerpFactor;
  player.windEffect.y += (targetWindY - player.windEffect.y) * lerpFactor;

  // Base flight forces: Gravity vs Hold Lift with Sine Wave buoyant oscillation
  const gravity = 0.14; // Softened baseline gravity for a graceful drift
  const liftForce = -0.42;

  if (player.isHolding) {
    player.vy += liftForce * dtScale;
  } else {
    // Sine Wave Oscillation: creates undulating atmospheric buoyancy waves when released
    const sineOscillation = Math.sin(player.wobbleAngle * 1.6) * 0.28;
    player.vy += (gravity + sineOscillation) * dtScale;

    // Aerodynamic cushioning to prevent harsh vertical plunges
    player.vy *= Math.pow(0.965, dtScale);
  }

  // Add wind force
  player.vx = 2.6 + player.windEffect.x;
  player.vy += player.windEffect.y * dtScale;

  // Terminal velocities (cushioned descent when floating free, crisp lift when holding)
  const maxDownVy = player.isHolding ? 4.8 : 2.5;
  player.vy = Math.max(-5.2, Math.min(maxDownVy, player.vy));

  // Forward movement & smooth vertical movement
  player.x += player.vx * dtScale;
  player.y += player.vy * dtScale;

  // Boundary clamp (keep in sky bounds with soft bounce)
  if (player.y < 35) {
    player.y = 35;
    player.vy = 0.5;
  } else if (player.y > level.height - 45) {
    player.y = level.height - 45;
    player.vy = -0.5;
  }

  // Rotation and sway (reactive to wind forces)
  player.wobbleAngle += player.isInWind ? 0.08 : 0.06;
  const windTilt = player.windEffect.x * 0.10 - player.windEffect.y * 0.06;
  const targetRotation = (player.vy * 0.07) + Math.sin(player.wobbleAngle) * (player.isInWind ? 0.12 : 0.08) + windTilt;
  player.rotation += (targetRotation - player.rotation) * 0.12;

  // Ribbon / String simulation using relaxed distance constraints
  const stringOrigin: Point = {
    x: player.x - Math.sin(player.rotation) * 14,
    y: player.y + Math.cos(player.rotation) * 14,
  };

  const segmentLength = 5.5;
  player.stringNodes[0] = stringOrigin;

  for (let i = 1; i < player.stringNodes.length; i++) {
    const prev = player.stringNodes[i - 1];
    const curr = player.stringNodes[i];

    // Trailing wind + slight wave
    const wave = Math.sin(player.wobbleAngle - i * 0.4) * 1.5;
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Constrain distance
    const factor = (dist - segmentLength) / dist;
    curr.x -= dx * factor * 0.85;
    curr.y -= dy * factor * 0.85;

    // Wind push to the left as balloon moves right
    curr.x -= (player.vx * 0.4) - wave * 0.2;
    curr.y += 0.5; // slight gravity on ribbon tip
  }

  // Emit gentle trail particles behind the red balloon (stardust and swirling air motes)
  if (!player.isDissolving) {
    // 1. Stardust particle (sparkling golden/rose starlight)
    if (Math.random() > 0.25) {
      const isGold = Math.random() > 0.35;
      const starColors = ['#FEF08A', '#FDE047', '#FFFBEB', '#FBCFE8', '#FDE68A'];
      const chosenColor = starColors[Math.floor(Math.random() * starColors.length)];
      particles.push({
        x: player.x - 12 + (Math.random() * 6 - 3),
        y: player.y + 4 + (Math.random() * 8 - 4),
        vx: -player.vx * 0.45 + (Math.random() * 0.4 - 0.2),
        vy: (Math.random() * 0.6 - 0.3),
        color: chosenColor,
        size: 2.2 + Math.random() * 2.8,
        life: 0,
        maxLife: 24 + Math.floor(Math.random() * 22),
        alpha: 0.85,
        type: Math.random() > 0.4 ? 'STAR' : 'SPARKLE',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.09,
      });
    }

    // 2. Swirling air / wind draft motes (aerodynamic wake)
    if (Math.random() > 0.4) {
      const airColors = ['rgba(255, 255, 255, 0.45)', 'rgba(224, 242, 254, 0.4)', 'rgba(254, 242, 242, 0.35)'];
      particles.push({
        x: player.x - 15 + (Math.random() * 6 - 3),
        y: player.y + (Math.random() * 12 - 6),
        vx: -player.vx * 0.35 + (Math.random() * 0.5 - 0.25),
        vy: (player.isHolding ? 0.4 : -0.2) + (Math.random() * 0.6 - 0.3),
        color: airColors[Math.floor(Math.random() * airColors.length)],
        size: 3.5 + Math.random() * 3.0,
        life: 0,
        maxLife: 20 + Math.floor(Math.random() * 16),
        alpha: 0.5,
        type: 'AIR_MOTE',
      });
    }

    // 3. Extra lift draft when holding
    if (player.isHolding && Math.random() > 0.5) {
      particles.push({
        x: player.x - 6 + (Math.random() * 8 - 4),
        y: player.y + 14 + (Math.random() * 4),
        vx: -player.vx * 0.25,
        vy: 1.2 + Math.random() * 0.8,
        color: 'rgba(254, 240, 138, 0.6)',
        size: 2.0 + Math.random() * 2.0,
        life: 0,
        maxLife: 18 + Math.floor(Math.random() * 12),
        alpha: 0.7,
        type: 'SPARKLE',
        rotation: Math.random() * Math.PI * 2,
        vRot: 0.08,
      });
    }
  }

  // Update audio wind modulation with horizontal speed and vertical velocity pitch modulation
  soundEngine.updateWindIntensity(player.vx / 3.5, player.isInWind, player.vy);

  // Checkpoint activation
  for (const cp of level.checkpoints) {
    if (!cp.activated && Math.abs(player.x - cp.x) < 40) {
      cp.activated = true;
      soundEngine.playCheckpointSound();
      // Burst particles
      for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        particles.push({
          x: cp.x,
          y: cp.y,
          vx: Math.cos(angle) * (1.5 + Math.random() * 2),
          vy: Math.sin(angle) * (1.5 + Math.random() * 2),
          color: '#86EFAC',
          size: 3,
          life: 0,
          maxLife: 35,
          alpha: 1,
        });
      }
    }
  }

  // Check Memory Shards
  for (const shard of level.shards) {
    if (!shard.collected) {
      const dist = Math.hypot(player.x - shard.x, player.y - shard.y);
      if (dist < player.radius + 20) {
        shard.collected = true;
        soundEngine.playShardChime();
        onShardCollected(shard);

        // Burst of golden stardust
        for (let i = 0; i < 28; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.8 + Math.random() * 3.5;
          particles.push({
            x: shard.x,
            y: shard.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: Math.random() > 0.5 ? '#FBBF24' : '#FDE68A',
            size: 3 + Math.random() * 3,
            life: 0,
            maxLife: 45,
            alpha: 1,
          });
        }
      }
    }
  }

  // Check Obstacle Collisions (Forgiving radius)
  const hitRadius = player.radius * 0.72;
  for (const obs of level.obstacles) {
    if (checkObstacleCollision(player.x, player.y, hitRadius, obs, player.wobbleAngle)) {
      // Soft collision: Dissolve gracefully and rewind
      player.isDissolving = true;
      player.dissolveProgress = 0;
      soundEngine.playSoftRewindSound();

      const totalDist = Math.max(1, level.targetWindow.x - 120);
      const currentDist = Math.max(0, player.x - 120);
      const progressPercent = Math.min(100, Math.max(0, (currentDist / totalDist) * 100));

      if (onDefeat) {
        onDefeat(obs.type, progressPercent);
      } else {
        onSoftRewind();
      }

      // Burst of red petals
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 2.8;
        particles.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() > 0.3 ? '#EF4444' : '#FCA5A5',
          size: 4 + Math.random() * 3,
          life: 0,
          maxLife: 35,
          alpha: 1,
        });
      }
      break;
    }
  }

  // Check Destination (Window / Finish line)
  if (player.x >= level.targetWindow.x) {
    onLevelComplete();
  }
}

function checkObstacleCollision(px: number, py: number, r: number, obs: Obstacle, animTime: number): boolean {
  if (obs.type === 'BIRD') {
    // Dynamic flying bird
    const birdY = obs.y + Math.sin(animTime * 2 + (obs.animOffset || 0)) * 25;
    const birdX = obs.x - Math.cos(animTime * 0.5) * 15;
    return Math.hypot(px - birdX, py - birdY) < r + 14;
  }

  if (obs.type === 'LIGHTNING_NODE') {
    return Math.hypot(px - obs.x, py - obs.y) < r + 18;
  }

  if (obs.type === 'KITE') {
    const kiteY = obs.y + Math.sin(animTime * 1.5 + (obs.animOffset || 0)) * 18;
    return Math.hypot(px - obs.x, py - kiteY) < r + 16;
  }

  if (obs.type === 'POWER_LINE') {
    // Horizontal line segment
    const withinX = px >= obs.x && px <= obs.x + obs.width;
    const closeY = Math.abs(py - obs.y) < r + 4;
    return withinX && closeY;
  }

  // Rectangular obstacles (BRANCH, CHIMNEY, STORM_CLOUD)
  const closestX = Math.max(obs.x, Math.min(px, obs.x + obs.width));
  const closestY = Math.max(obs.y, Math.min(py, obs.y + obs.height));
  const distanceX = px - closestX;
  const distanceY = py - closestY;
  return (distanceX * distanceX + distanceY * distanceY) < (r * r);
}

export function updateParticles(particles: Particle[], deltaTime: number = 0.0166): void {
  const dtScale = Math.min(Math.max((deltaTime || 0.0166) / 0.01666, 0.4), 2.5);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dtScale;
    p.y += p.vy * dtScale;

    // Gentle atmospheric drag
    const drag = Math.pow(0.97, dtScale);
    p.vx *= drag;
    p.vy *= drag;

    if (p.type === 'AIR_MOTE') {
      p.size += 0.04 * dtScale;
      p.vy -= 0.015 * dtScale;
    }

    if (p.type === 'STAR' || p.type === 'SPARKLE') {
      p.rotation = (p.rotation || 0) + (p.vRot || 0.04) * dtScale;
    }

    p.life += dtScale;
    p.alpha = Math.max(0, 1 - p.life / p.maxLife);

    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
    }
  }
}
