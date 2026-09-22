import { LevelData, Player, Point, Checkpoint } from '../types';
import { Particle } from './physics';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 800;
  private height: number = 600;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  public render(
    player: Player,
    level: LevelData,
    activeCheckpoint: Checkpoint,
    particles: Particle[],
    cameraX: number,
    globalTime: number
  ) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sky Gradient
    this.renderSky(level);

    // 2. Stars (if night) or Sunbeams (if dawn/clear)
    if (level.theme.weatherType === 'STARRY') {
      this.renderStars(level, cameraX, globalTime);
    } else if (level.theme.weatherType === 'GOLDEN_DAWN') {
      this.renderDawnGaze(globalTime);
    }

    // 3. Parallax Deep & Mid Cloud Layers (Slow & Medium drift)
    this.renderFarCloudLayers(level, cameraX, globalTime);

    // 4. Parallax Mid Scenery (Hills, Silhouettes, Buildings, Trees)
    this.renderMidScenery(level, cameraX);

    // 5. Parallax Near Cloud Layer (Faster drift, foreground depth)
    this.renderNearCloudLayer(level, cameraX, globalTime);

    // 6. Wind Zones Visuals
    this.renderWindZones(level, cameraX, globalTime);

    // 6. Rain / Storm Effect (Level 3)
    if (level.theme.weatherType === 'RAIN_STORM') {
      this.renderRain(cameraX, globalTime);
    }

    // 7. Checkpoints
    this.renderCheckpoints(level, cameraX, globalTime);

    // 8. Obstacles
    this.renderObstacles(level, cameraX, globalTime);

    // 9. Memory Shards
    this.renderShards(level, cameraX, globalTime);

    // 10. Destination (Goal Window)
    this.renderDestination(level, cameraX, globalTime, player);

    // 11. Particles (Stardust, Petals, Splashes)
    this.renderParticles(particles, cameraX);

    // 12. Player (Red Balloon / Keepsake)
    this.renderPlayer(player, cameraX, globalTime);

    // 13. Vignette & Atmospheric Glow
    this.renderVignette(level);
  }

  private renderSky(level: LevelData) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, level.theme.skyTop);
    grad.addColorStop(1, level.theme.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private renderStars(level: LevelData, cameraX: number, time: number) {
    const ctx = this.ctx;
    const stars = level.sceneryElements.stars || [];
    ctx.fillStyle = '#FEF08A';

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      // Parallax wrap
      const screenX = ((s.x - cameraX * 0.15) % (this.width + 200) + this.width + 200) % (this.width + 200) - 100;
      const twinkle = 0.5 + Math.sin(time * 3 + i) * 0.4;
      ctx.globalAlpha = s.opacity * twinkle;
      ctx.beginPath();
      ctx.arc(screenX, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private renderDawnGaze(time: number) {
    const ctx = this.ctx;
    ctx.save();
    const grad = ctx.createRadialGradient(
      this.width * 0.85, this.height * 0.25, 10,
      this.width * 0.85, this.height * 0.25, this.width * 0.7
    );
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    grad.addColorStop(0.5, 'rgba(251, 113, 133, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  /**
   * Layer 1 & 2: Distant & Mid-Altitude Cloud Layers (Background depth)
   */
  private renderFarCloudLayers(level: LevelData, cameraX: number, time: number) {
    const ctx = this.ctx;

    // ----------------------------------------------------
    // LAYER 1: Deep Stratosphere Cirrus Streamers (Slowest & Furthest)
    // Parallax factor: 0.06 (shifts subtly when camera moves right), Wind drift: 3px/s
    // ----------------------------------------------------
    ctx.save();
    const deepParallax = cameraX * 0.06 + time * 3.0;
    const deepWrap = this.width + 500;
    const deepSpacing = 360;
    const deepCount = Math.ceil(deepWrap / deepSpacing) + 2;

    ctx.globalAlpha = 0.38;
    for (let i = -1; i < deepCount; i++) {
      const baseX = i * deepSpacing;
      const screenX = ((baseX - deepParallax) % deepWrap + deepWrap) % deepWrap - 250;
      const swayY = Math.sin(time * 0.35 + i * 1.5) * 5;
      const cy = 50 + ((i * 47) % 60) + swayY;
      const width = 180 + ((i * 31) % 80);
      const height = 40 + ((i * 19) % 22);

      this.drawWispyCloud(ctx, screenX, cy, width, height, level);
    }
    ctx.restore();

    // ----------------------------------------------------
    // LAYER 2: Distant Horizon Cumulus Banks
    // Parallax factor: 0.14, Wind drift: 6.5px/s
    // ----------------------------------------------------
    ctx.save();
    const distantParallax = cameraX * 0.14 + time * 6.5;
    const distantWrap = this.width + 460;
    const distantSpacing = 320;
    const distantCount = Math.ceil(distantWrap / distantSpacing) + 2;

    ctx.globalAlpha = 0.62;
    for (let i = -1; i < distantCount; i++) {
      const baseX = i * distantSpacing;
      const screenX = ((baseX - distantParallax) % distantWrap + distantWrap) % distantWrap - 230;
      const swayY = Math.sin(time * 0.55 + i * 1.7) * 7;
      const cy = 85 + ((i * 53) % 75) + swayY;
      const radius = 48 + ((i * 29) % 24);

      this.drawLayeredPuffyCloud(
        ctx,
        screenX,
        cy,
        radius,
        level,
        false
      );
    }
    ctx.restore();

    // ----------------------------------------------------
    // LAYER 3: Mid-Sky Puffy Cumulus Clouds (Medium depth)
    // Parallax factor: 0.26, Wind drift: 12px/s
    // ----------------------------------------------------
    ctx.save();
    const midParallax = cameraX * 0.26 + time * 12.0;
    const midWrap = this.width + 420;
    const midSpacing = 280;
    const midCount = Math.ceil(midWrap / midSpacing) + 2;

    ctx.globalAlpha = 0.88;
    for (let i = -1; i < midCount; i++) {
      const baseX = i * midSpacing;
      const screenX = ((baseX - midParallax) % midWrap + midWrap) % midWrap - 210;
      const swayY = Math.sin(time * 0.85 + i * 2.0) * 8;
      const cy = 115 + ((i * 61) % 95) + swayY;
      const radius = 64 + ((i * 37) % 32);

      this.drawLayeredPuffyCloud(
        ctx,
        screenX,
        cy,
        radius,
        level,
        true
      );
    }
    ctx.restore();
  }

  /**
   * LAYER 4: Near-Altitude Ambient Clouds & Wisps (Foreground depth)
   * Parallax factor: 0.52, Wind drift: 28px/s
   * Drifts rapidly across the sky in front of distant hills & structures
   * creating a vivid optical parallax velocity difference when moving right
   */
  private renderNearCloudLayer(level: LevelData, cameraX: number, time: number) {
    const ctx = this.ctx;
    ctx.save();

    const nearParallax = cameraX * 0.52 + time * 28.0;
    const nearWrap = this.width + 440;
    const nearSpacing = 340;
    const nearCount = Math.ceil(nearWrap / nearSpacing) + 2;

    ctx.globalAlpha = 0.52;
    for (let i = -1; i < nearCount; i++) {
      const baseX = i * nearSpacing;
      const screenX = ((baseX - nearParallax) % nearWrap + nearWrap) % nearWrap - 220;
      const swayY = Math.sin(time * 1.4 + i * 2.4) * 8;
      const cy = 165 + ((i * 73) % 130) + swayY;

      if (i % 2 === 0) {
        // Fast-drifting elongated wisp with gradient edges
        this.drawWispyCloud(
          ctx,
          screenX,
          cy,
          200 + ((i * 41) % 65),
          42 + ((i * 23) % 20),
          level
        );
      } else {
        // Soft airy low cloud puff with feathered gradient perimeter
        this.drawLayeredPuffyCloud(
          ctx,
          screenX,
          cy,
          56 + ((i * 29) % 26),
          level,
          false
        );
      }
    }

    ctx.restore();
  }

  /**
   * Draws a multi-lobed organic fluffy cloud with soft gradient feathering at edges
   * harmonized with the current level sky theme.
   */
  private drawLayeredPuffyCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    level: LevelData,
    highlight: boolean = true
  ) {
    const { cloudColor, cloudShadow, skyTop, skyBottom } = level.theme;

    // Helper to draw a puff lobe with soft radial gradient feathering at the boundaries
    const drawGradientLobe = (cx: number, cy: number, radius: number, isShadow: boolean = false) => {
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius);
      if (isShadow) {
        grad.addColorStop(0, cloudShadow);
        grad.addColorStop(0.65, cloudShadow);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        grad.addColorStop(0, cloudColor);
        grad.addColorStop(0.72, cloudColor);
        // Fade the outer edge toward transparent sky tones for feathering
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    // 1. Soft underside atmospheric shadow with feathered edges
    if (highlight && cloudShadow) {
      drawGradientLobe(x, y + 8, r * 0.68, true);
      drawGradientLobe(x + r * 0.55, y + 8 - r * 0.15, r * 0.54, true);
      drawGradientLobe(x + r * 1.1, y + 8 + r * 0.08, r * 0.46, true);
      drawGradientLobe(x - r * 0.5, y + 8 + r * 0.12, r * 0.44, true);
    }

    // 2. Primary cloud cumulus lobes with radial falloff
    drawGradientLobe(x, y, r * 0.68);
    drawGradientLobe(x + r * 0.55, y - r * 0.2, r * 0.52);
    drawGradientLobe(x + r * 1.1, y + r * 0.05, r * 0.46);
    drawGradientLobe(x - r * 0.5, y + r * 0.1, r * 0.42);
    drawGradientLobe(x + r * 0.25, y + r * 0.12, r * 0.52);

    // 3. Overall ambient sky-tinted edge gradient across the cloud bounds
    // Gives the perimeter an organic airy blend with the level's sky
    const totalW = r * 2.2;
    const totalH = r * 1.3;
    const edgeGradient = ctx.createRadialGradient(
      x + r * 0.3,
      y,
      r * 0.2,
      x + r * 0.3,
      y,
      r * 1.25
    );
    edgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    edgeGradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.06)');
    edgeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = edgeGradient;
    ctx.beginPath();
    ctx.ellipse(x + r * 0.3, y, totalW * 0.5, totalH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Soft sunlight rim highlight on upper domes
    if (highlight) {
      const rimGrad = ctx.createLinearGradient(x, y - r * 0.7, x, y);
      rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
      rimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(x + r * 0.54, y - r * 0.23, r * 0.4, Math.PI * 1.15, Math.PI * 1.85);
      ctx.arc(x, y - r * 0.08, r * 0.5, Math.PI * 1.2, Math.PI * 1.8);
      ctx.fill();
    }
  }

  /**
   * Draws an aerodynamic, wind-blown wispy cloud streak with feathered gradient edges
   * matched to the ambient sky hue.
   */
  private drawWispyCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    level: LevelData
  ) {
    const { cloudColor, weatherType } = level.theme;

    // Outer edge feathering gradient along horizontal elongation
    const gradX = ctx.createLinearGradient(x - w * 0.55, y, x + w * 0.55, y);
    gradX.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradX.addColorStop(0.2, cloudColor);
    gradX.addColorStop(0.8, cloudColor);
    gradX.addColorStop(1, 'rgba(255, 255, 255, 0)');

    // Vertical softness gradient (transparent at top & bottom borders)
    const gradY = ctx.createLinearGradient(x, y - h * 0.6, x, y + h * 0.6);
    gradY.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradY.addColorStop(0.35, cloudColor);
    gradY.addColorStop(0.65, cloudColor);
    gradY.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradX;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.5, h * 0.35, 0, 0, Math.PI * 2);
    ctx.ellipse(x - w * 0.24, y - h * 0.14, w * 0.36, h * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.26, y + h * 0.1, w * 0.34, h * 0.34, 0, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.52, y + h * 0.04, w * 0.2, h * 0.22, 0, 0, Math.PI * 2);
    ctx.ellipse(x - w * 0.5, y + h * 0.02, w * 0.18, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Second soft pass for vertical gradient blend
    ctx.fillStyle = gradY;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.45, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderMidScenery(level: LevelData, cameraX: number) {
    const ctx = this.ctx;

    // Hills in Garden level
    if (level.sceneryElements.hills) {
      for (const h of level.sceneryElements.hills) {
        const screenX = h.x - cameraX * 0.4;
        if (screenX + h.width < -100 || screenX > this.width + 100) continue;
        ctx.fillStyle = h.color;
        ctx.beginPath();
        ctx.moveTo(screenX - 100, this.height);
        ctx.quadraticCurveTo(screenX + h.width * 0.5, this.height - h.height, screenX + h.width + 100, this.height);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Buildings in Street level & Window level
    if (level.sceneryElements.buildings) {
      for (const b of level.sceneryElements.buildings) {
        const screenX = b.x - cameraX * 0.7;
        if (screenX + b.width < -50 || screenX > this.width + 50) continue;
        ctx.fillStyle = b.color;
        ctx.fillRect(screenX, b.y, b.width, b.height);

        // Windows
        if (b.windows) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
          const rows = 4;
          const cols = Math.floor(b.width / 45);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              ctx.fillRect(screenX + 16 + c * 40, b.y + 20 + r * 45, 20, 26);
            }
          }
        }
      }
    }

    // Trees in Garden level
    if (level.sceneryElements.trees) {
      for (const t of level.sceneryElements.trees) {
        const screenX = t.x - cameraX * 0.85;
        if (screenX < -100 || screenX > this.width + 100) continue;

        // Trunk
        ctx.fillStyle = '#78350F';
        ctx.fillRect(screenX - 8, t.y, 16, t.height);

        // Foliage
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(screenX, t.y - 10, 48, 0, Math.PI * 2);
        ctx.arc(screenX - 25, t.y - 30, 36, 0, Math.PI * 2);
        ctx.arc(screenX + 25, t.y - 30, 36, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderWindZones(level: LevelData, cameraX: number, time: number) {
    const ctx = this.ctx;

    for (const zone of level.windZones) {
      const screenX = zone.x - cameraX;
      // Skip if offscreen
      if (screenX + zone.width < -80 || screenX > this.width + 80) continue;

      ctx.save();

      // 1. Soft atmospheric background tint indicating the air column/draft
      const bgAlpha = 0.09 + Math.sin(time * 2 + zone.x * 0.01) * 0.02;
      const zoneBg = zone.direction === 'UP'
        ? `rgba(186, 230, 253, ${bgAlpha + 0.03})`
        : zone.direction === 'DOWN'
        ? `rgba(224, 231, 255, ${bgAlpha + 0.03})`
        : zone.direction === 'FORWARD'
        ? `rgba(254, 240, 138, ${bgAlpha})`
        : `rgba(243, 232, 255, ${bgAlpha})`;

      ctx.fillStyle = zoneBg;
      ctx.beginPath();
      ctx.roundRect(screenX, zone.y, zone.width, zone.height, 12);
      ctx.fill();

      // 2. Subtle soft dashed atmospheric boundary so the player sees the zone edge
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 8]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Clip inside zone so streamlines flow cleanly within the draft boundaries
      ctx.beginPath();
      ctx.roundRect(screenX, zone.y, zone.width, zone.height, 12);
      ctx.clip();

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 3. Animated transparent white streamlines with directional cues
      if (zone.direction === 'UP') {
        const colSpacing = 38;
        const colCount = Math.floor(zone.width / colSpacing);
        const speed = (65 * zone.strength + 30);

        for (let c = 0; c <= colCount; c++) {
          const colX = screenX + 16 + c * colSpacing;
          const colOffset = (c * 73) % zone.height;
          const segmentCount = 2;

          for (let s = 0; s < segmentCount; s++) {
            const segOffset = (s * (zone.height / segmentCount));
            const progress = (zone.height - ((time * speed + colOffset + segOffset) % zone.height));
            const headY = zone.y + progress;
            const streakLen = 45 + ((c + s) % 3) * 15;
            const tailY = Math.min(zone.y + zone.height, headY + streakLen);

            if (tailY <= zone.y) continue;

            // Streamline curve (transparent white gradient / stroke)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();

            const steps = 8;
            for (let st = 0; st <= steps; st++) {
              const curY = headY + (st / steps) * (tailY - headY);
              const waveX = Math.sin(curY * 0.025 + time * 3.5 + c) * 6;
              if (st === 0) {
                ctx.moveTo(colX + waveX, curY);
              } else {
                ctx.lineTo(colX + waveX, curY);
              }
            }
            ctx.stroke();

            // Aerodynamic upward chevron (^) at the leading head of the stream
            const headWaveX = Math.sin(headY * 0.025 + time * 3.5 + c) * 6;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(colX + headWaveX - 4.5, headY + 5.5);
            ctx.lineTo(colX + headWaveX, headY);
            ctx.lineTo(colX + headWaveX + 4.5, headY + 5.5);
            ctx.stroke();

            // Glowing air mote at chevron tip
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(colX + headWaveX, headY, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (zone.direction === 'DOWN') {
        const colSpacing = 38;
        const colCount = Math.floor(zone.width / colSpacing);
        const speed = (65 * zone.strength + 30);

        for (let c = 0; c <= colCount; c++) {
          const colX = screenX + 16 + c * colSpacing;
          const colOffset = (c * 73) % zone.height;
          const segmentCount = 2;

          for (let s = 0; s < segmentCount; s++) {
            const segOffset = (s * (zone.height / segmentCount));
            const progress = (time * speed + colOffset + segOffset) % zone.height;
            const headY = zone.y + progress;
            const streakLen = 45 + ((c + s) % 3) * 15;
            const tailY = Math.max(zone.y, headY - streakLen);

            if (tailY >= zone.y + zone.height) continue;

            // Streamline curve flowing downwards
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();

            const steps = 8;
            for (let st = 0; st <= steps; st++) {
              const curY = headY - (st / steps) * (headY - tailY);
              const waveX = Math.sin(curY * 0.025 + time * 3.5 + c) * 6;
              if (st === 0) {
                ctx.moveTo(colX + waveX, curY);
              } else {
                ctx.lineTo(colX + waveX, curY);
              }
            }
            ctx.stroke();

            // Aerodynamic downward chevron (v) at leading head of stream
            const headWaveX = Math.sin(headY * 0.025 + time * 3.5 + c) * 6;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(colX + headWaveX - 4.5, headY - 5.5);
            ctx.lineTo(colX + headWaveX, headY);
            ctx.lineTo(colX + headWaveX + 4.5, headY - 5.5);
            ctx.stroke();

            // Glowing air mote at tip
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(colX + headWaveX, headY, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (zone.direction === 'FORWARD') {
        const rowSpacing = 34;
        const rowCount = Math.floor(zone.height / rowSpacing);
        const speed = (95 * zone.strength + 35);

        for (let r = 0; r <= rowCount; r++) {
          const rowY = zone.y + 16 + r * rowSpacing;
          const rowOffset = (r * 67) % zone.width;
          const segmentCount = 2;

          for (let s = 0; s < segmentCount; s++) {
            const segOffset = (s * (zone.width / segmentCount));
            const progress = (time * speed + rowOffset + segOffset) % zone.width;
            const headX = screenX + progress;
            const streakLen = 50 + ((r + s) % 3) * 18;
            const tailX = Math.max(screenX, headX - streakLen);

            if (tailX >= screenX + zone.width) continue;

            // Horizontal undulating streamline
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();

            const steps = 8;
            for (let st = 0; st <= steps; st++) {
              const curX = headX - (st / steps) * (headX - tailX);
              const waveY = Math.sin(curX * 0.022 + time * 4.0 + r) * 6;
              if (st === 0) {
                ctx.moveTo(curX, rowY + waveY);
              } else {
                ctx.lineTo(curX, rowY + waveY);
              }
            }
            ctx.stroke();

            // Aerodynamic rightward chevron (>) at leading head
            const headWaveY = Math.sin(headX * 0.022 + time * 4.0 + r) * 6;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(headX - 5.5, rowY + headWaveY - 4.5);
            ctx.lineTo(headX, rowY + headWaveY);
            ctx.lineTo(headX - 5.5, rowY + headWaveY + 4.5);
            ctx.stroke();

            // Luminous speck at tip
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(headX, rowY + headWaveY, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        // TURBULENT (Swirling vortices)
        const vortexCenterX = screenX + zone.width * 0.5;
        const vortexCenterY = zone.y + zone.height * 0.5;
        const radius = Math.min(zone.width, zone.height) * 0.38;

        for (let ring = 1; ring <= 3; ring++) {
          const rRadius = radius * (ring / 3);
          const spinSpeed = time * (2.2 / ring) * zone.strength;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(vortexCenterX, vortexCenterY, rRadius, spinSpeed, spinSpeed + Math.PI * 1.3);
          ctx.stroke();

          // Rotating chevron on vortex perimeter
          const tipAngle = spinSpeed + Math.PI * 1.3;
          const tipX = vortexCenterX + Math.cos(tipAngle) * rRadius;
          const tipY = vortexCenterY + Math.sin(tipAngle) * rRadius;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(tipX, tipY, 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  private renderRain(cameraX: number, time: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.lineWidth = 1.5;

    const drops = 90;
    for (let i = 0; i < drops; i++) {
      const rx = (i * 37 + time * 120) % this.width;
      const ry = (i * 53 + time * 450) % this.height;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 8, ry + 22);
      ctx.stroke();
    }

    // Occasional lightning flash
    if (Math.sin(time * 1.8) > 0.985) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.restore();
  }

  private renderCheckpoints(level: LevelData, cameraX: number, time: number) {
    const ctx = this.ctx;

    for (const cp of level.checkpoints) {
      const screenX = cp.x - cameraX;
      if (screenX < -50 || screenX > this.width + 50) continue;

      ctx.save();
      // Glowing aura
      const pulse = 0.5 + Math.sin(time * 3) * 0.3;
      ctx.fillStyle = cp.activated ? 'rgba(74, 222, 128, 0.35)' : 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(screenX, cp.y, 22 + pulse * 6, 0, Math.PI * 2);
      ctx.fill();

      // Pin / Ribbon post
      ctx.strokeStyle = cp.activated ? '#4ADE80' : '#E2E8F0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(screenX, cp.y - 20);
      ctx.lineTo(screenX, cp.y + 20);
      ctx.stroke();

      // Little fluttering flag
      ctx.fillStyle = cp.activated ? '#22C55E' : '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(screenX, cp.y - 20);
      ctx.lineTo(screenX + 16, cp.y - 12 + Math.sin(time * 4) * 3);
      ctx.lineTo(screenX, cp.y - 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  private renderObstacles(level: LevelData, cameraX: number, time: number) {
    const ctx = this.ctx;

    for (const obs of level.obstacles) {
      const screenX = obs.x - cameraX;
      if (screenX + obs.width < -60 || screenX > this.width + 60) continue;

      ctx.save();

      if (obs.type === 'BRANCH') {
        // Delicate tree branch
        ctx.strokeStyle = '#573312';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(screenX, obs.y + obs.height);
        ctx.quadraticCurveTo(screenX + obs.width * 0.5, obs.y + obs.height * 0.4, screenX + obs.width, obs.y);
        ctx.stroke();

        // Leaves
        ctx.fillStyle = '#4ADE80';
        for (let i = 0; i < 4; i++) {
          const lx = screenX + (obs.width / 4) * (i + 1);
          const ly = obs.y + (obs.height / 4) * (4 - i);
          ctx.beginPath();
          ctx.ellipse(lx, ly, 11, 6, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (obs.type === 'BIRD') {
        // Flying bird silhouette
        const birdY = obs.y + Math.sin(time * 4 + (obs.animOffset || 0)) * 25;
        const wingFlap = Math.sin(time * 8 + (obs.animOffset || 0)) * 14;

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Left wing
        ctx.moveTo(screenX - 14, birdY - wingFlap);
        ctx.quadraticCurveTo(screenX - 7, birdY - 5, screenX, birdY);
        // Right wing
        ctx.quadraticCurveTo(screenX + 7, birdY - 5, screenX + 14, birdY - wingFlap);
        ctx.stroke();
      } else if (obs.type === 'POWER_LINE') {
        // Power line with natural sag
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(screenX, obs.y);
        ctx.quadraticCurveTo(screenX + obs.width * 0.5, obs.y + 12, screenX + obs.width, obs.y);
        ctx.stroke();

        // Insulator cups at endpoints
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(screenX - 4, obs.y - 6, 8, 12);
        ctx.fillRect(screenX + obs.width - 4, obs.y - 6, 8, 12);
      } else if (obs.type === 'CHIMNEY') {
        // Terracotta chimney with soft smoke
        ctx.fillStyle = '#B45309';
        ctx.fillRect(screenX, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(screenX - 4, obs.y, obs.width + 8, 10);

        // Smoke puffs
        ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
        for (let i = 0; i < 3; i++) {
          const sy = obs.y - 18 - i * 16 - ((time * 20) % 16);
          const sx = screenX + obs.width * 0.5 + Math.sin(time * 2 + i) * 8;
          ctx.beginPath();
          ctx.arc(sx, sy, 8 + i * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (obs.type === 'STORM_CLOUD') {
        // Storm cloud obstacle
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(screenX + 40, obs.y + 40, 36, 0, Math.PI * 2);
        ctx.arc(screenX + 80, obs.y + 30, 42, 0, Math.PI * 2);
        ctx.arc(screenX + 120, obs.y + 45, 34, 0, Math.PI * 2);
        ctx.fill();

        // Dark underbelly
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.fillRect(screenX + 10, obs.y + 50, obs.width - 20, 25);
      } else if (obs.type === 'LIGHTNING_NODE') {
        // Pulsing electric node
        const pulse = 1.0 + Math.sin(time * 12) * 0.2;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX + 25, obs.y + 25, 26 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(screenX + 25, obs.y + 25, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(screenX + 25, obs.y + 25, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'KITE') {
        // Floating paper kite
        const kiteY = obs.y + Math.sin(time * 2 + (obs.animOffset || 0)) * 18;
        const kiteTilt = Math.sin(time * 1.5 + (obs.animOffset || 0)) * 0.2;

        ctx.translate(screenX + obs.width * 0.5, kiteY + obs.height * 0.5);
        ctx.rotate(kiteTilt);

        // Diamond body
        ctx.fillStyle = '#C084FC';
        ctx.beginPath();
        ctx.moveTo(0, -obs.height * 0.5);
        ctx.lineTo(obs.width * 0.5, 0);
        ctx.lineTo(0, obs.height * 0.5);
        ctx.lineTo(-obs.width * 0.5, 0);
        ctx.closePath();
        ctx.fill();

        // Cross spars
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -obs.height * 0.5);
        ctx.lineTo(0, obs.height * 0.5);
        ctx.moveTo(-obs.width * 0.5, 0);
        ctx.lineTo(obs.width * 0.5, 0);
        ctx.stroke();

        // Kite tail with bows
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, obs.height * 0.5);
        ctx.quadraticCurveTo(
          Math.sin(time * 3) * 15,
          obs.height * 0.5 + 25,
          Math.sin(time * 4) * 20,
          obs.height * 0.5 + 50
        );
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderShards(level: LevelData, cameraX: number, time: number) {
    const ctx = this.ctx;

    for (const shard of level.shards) {
      if (shard.collected) continue;

      const screenX = shard.x - cameraX;
      if (screenX < -40 || screenX > this.width + 40) continue;

      ctx.save();
      const floatY = shard.y + Math.sin(time * 3 + shard.order) * 7;

      // Pulsing outer halo
      const pulse = 0.5 + Math.sin(time * 4 + shard.order) * 0.5;
      const grad = ctx.createRadialGradient(screenX, floatY, 2, screenX, floatY, 26 + pulse * 6);
      grad.addColorStop(0, 'rgba(253, 224, 71, 0.8)');
      grad.addColorStop(0.6, 'rgba(251, 191, 36, 0.35)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(screenX, floatY, 32, 0, Math.PI * 2);
      ctx.fill();

      // Golden origami 4-point crystal
      ctx.translate(screenX, floatY);
      ctx.rotate(time * 1.2 + shard.order);

      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(4, -4);
      ctx.lineTo(14, 0);
      ctx.lineTo(4, 4);
      ctx.lineTo(0, 14);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-4, -4);
      ctx.closePath();
      ctx.fill();

      // Inner white star highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderDestination(level: LevelData, cameraX: number, time: number, player: Player) {
    const ctx = this.ctx;
    const dest = level.targetWindow;
    const screenX = dest.x - cameraX;
    if (screenX < -150 || screenX > this.width + 150) return;

    ctx.save();

    if (level.id === 5) {
      // Calculate balloon distance to the window person (dest.x, dest.y)
      const distToBalloon = Math.hypot(player.x - dest.x, player.y - dest.y);
      // reachFactor: 0 when far (> 380px), interpolates smoothly to 1 when close (< 120px)
      const reachFactor = Math.max(0, Math.min(1, (380 - distToBalloon) / 260));

      // The Grand Emotional Window (Final Level)
      // Brick attic wall
      ctx.fillStyle = '#FBCFE8';
      ctx.fillRect(screenX, dest.y - 140, 180, 280);

      // Window frame (Arched warm window)
      ctx.fillStyle = '#78350F';
      ctx.fillRect(screenX + 16, dest.y - 110, 130, 190);

      // Warm glowing yellow interior
      const interiorGrad = ctx.createRadialGradient(
        screenX + 80, dest.y - 20, 10,
        screenX + 80, dest.y - 20, 90
      );
      interiorGrad.addColorStop(0, '#FEF08A');
      interiorGrad.addColorStop(0.7, '#FDE047');
      interiorGrad.addColorStop(1, '#F59E0B');
      ctx.fillStyle = interiorGrad;
      ctx.fillRect(screenX + 24, dest.y - 100, 114, 172);

      // Curtains fluttering
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const flutter = Math.sin(time * 3) * 6;
      // Left curtain
      ctx.beginPath();
      ctx.moveTo(screenX + 24, dest.y - 100);
      ctx.quadraticCurveTo(screenX + 50 + flutter, dest.y, screenX + 36, dest.y + 72);
      ctx.lineTo(screenX + 24, dest.y + 72);
      ctx.closePath();
      ctx.fill();

      // Right curtain
      ctx.beginPath();
      ctx.moveTo(screenX + 138, dest.y - 100);
      ctx.quadraticCurveTo(screenX + 112 - flutter, dest.y, screenX + 126, dest.y + 72);
      ctx.lineTo(screenX + 138, dest.y + 72);
      ctx.closePath();
      ctx.fill();

      // Person silhouette standing in the window:
      ctx.fillStyle = '#3F2C2C';
      ctx.strokeStyle = '#3F2C2C';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Head
      ctx.beginPath();
      ctx.arc(screenX + 80, dest.y - 30, 16, 0, Math.PI * 2);
      ctx.fill();

      // Torso / Shoulders
      ctx.beginPath();
      ctx.roundRect(screenX + 62, dest.y - 12, 36, 46, 6);
      ctx.fill();

      // Subtle dynamic breathing and welcoming wave
      const breathe = Math.sin(time * 2.5) * 2;
      const reachWave = Math.sin(time * 4) * (4 * reachFactor);

      // Left Arm (facing left towards the approaching balloon):
      // When reachFactor is 0: arm hangs straight down by side
      // When reachFactor is 1: arm extends forward and upwards welcoming the balloon
      const leftShoulderX = screenX + 64;
      const leftShoulderY = dest.y - 4;
      // Rest position (down along side): elbow at (62, dest.y + 16), hand at (60, dest.y + 34)
      // Extended position (reaching towards balloon): elbow at (42, dest.y - 8), hand at (14, dest.y - 14 + reachWave)
      const leftElbowX = leftShoulderX - 2 - reachFactor * 20;
      const leftElbowY = leftShoulderY + 20 - reachFactor * 24;
      const leftHandX = leftShoulderX - 4 - reachFactor * 46;
      const leftHandY = leftShoulderY + 38 - reachFactor * 48 + reachWave;

      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(leftShoulderX, leftShoulderY);
      ctx.quadraticCurveTo(leftElbowX, leftElbowY, leftHandX, leftHandY);
      ctx.stroke();

      // Left hand
      ctx.beginPath();
      ctx.arc(leftHandX, leftHandY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Right Arm:
      // When reachFactor is 0: arm hangs straight down by side
      // When reachFactor is 1: arm also extends towards the balloon warmly
      const rightShoulderX = screenX + 96;
      const rightShoulderY = dest.y - 4;
      const rightElbowX = rightShoulderX + 2 - reachFactor * 28;
      const rightElbowY = rightShoulderY + 20 - reachFactor * 22;
      const rightHandX = rightShoulderX + 4 - reachFactor * 54;
      const rightHandY = rightShoulderY + 38 - reachFactor * 42 + reachWave * 0.7;

      ctx.beginPath();
      ctx.moveTo(rightShoulderX, rightShoulderY);
      ctx.quadraticCurveTo(rightElbowX, rightElbowY, rightHandX, rightHandY);
      ctx.stroke();

      // Right hand
      ctx.beginPath();
      ctx.arc(rightHandX, rightHandY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Wooden windowsill ledge
      ctx.fillStyle = '#92400E';
      ctx.beginPath();
      ctx.roundRect(screenX + 16, dest.y + 68, 130, 14, 3);
      ctx.fill();

      // Welcome aura / sparkles when the balloon gets close
      if (reachFactor > 0.3) {
        ctx.fillStyle = '#FEF08A';
        ctx.globalAlpha = reachFactor * 0.85;
        for (let s = 0; s < 4; s++) {
          const sparkX = screenX + 30 + Math.sin(time * 3 + s * 1.5) * 40;
          const sparkY = dest.y - 30 + Math.cos(time * 2.5 + s * 1.8) * 35;
          const sparkSize = 2 + Math.sin(time * 5 + s) * 1.5;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, Math.max(1, sparkSize), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      // Gentle white doves flying alongside
      for (let d = 0; d < 3; d++) {
        const doveX = screenX - 60 - d * 40 + Math.sin(time * 2 + d) * 15;
        const doveY = dest.y - 70 - d * 25 + Math.sin(time * 3 + d) * 10;
        const doveWing = Math.sin(time * 6 + d) * 8;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(doveX, doveY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(doveX, doveY);
        ctx.lineTo(doveX - 6, doveY - doveWing);
        ctx.lineTo(doveX + 4, doveY);
        ctx.fill();
      }

      // Warm glow beam radiating outwards
      const beamGrad = ctx.createLinearGradient(screenX + 24, dest.y, screenX - 120, dest.y);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(screenX + 24, dest.y - 80);
      ctx.lineTo(screenX - 120, dest.y - 130);
      ctx.lineTo(screenX - 120, dest.y + 110);
      ctx.lineTo(screenX + 24, dest.y + 60);
      ctx.closePath();
      ctx.fill();
    } else {
      // Level transition rectangular gateway / portal (levels 1 to 4)
      const pulse = 0.5 + Math.sin(time * 3.5) * 0.5;
      const rectW = 64;
      const rectH = 150;
      const rx = screenX - rectW * 0.5;
      const ry = dest.y - rectH * 0.5;

      // Outer soft rectangular glow halo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.roundRect(rx - 14 - pulse * 4, ry - 14 - pulse * 4, rectW + 28 + pulse * 8, rectH + 28 + pulse * 8, 18);
      ctx.fill();

      // Outer glowing frame (themed color)
      ctx.fillStyle = level.theme.accentColor;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.roundRect(rx - 6, ry - 6, rectW + 12, rectH + 12, 14);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Main inner rectangular portal door
      const innerGrad = ctx.createLinearGradient(rx, ry, rx + rectW, ry + rectH);
      innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      innerGrad.addColorStop(0.5, level.theme.cloudColor || 'rgba(255, 255, 255, 0.8)');
      innerGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.roundRect(rx, ry, rectW, rectH, 10);
      ctx.fill();

      // Border highlight
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(rx, ry, rectW, rectH, 10);
      ctx.stroke();

      // Sparkling corner accents on the rectangle
      ctx.fillStyle = '#FFFFFF';
      const starSize = 3 + pulse * 2;
      // Top-left
      ctx.fillRect(rx - 2, ry - 2, starSize, starSize);
      // Top-right
      ctx.fillRect(rx + rectW - starSize + 2, ry - 2, starSize, starSize);
      // Bottom-left
      ctx.fillRect(rx - 2, ry + rectH - starSize + 2, starSize, starSize);
      // Bottom-right
      ctx.fillRect(rx + rectW - starSize + 2, ry + rectH - starSize + 2, starSize, starSize);
    }

    ctx.restore();
  }

  private renderParticles(particles: Particle[], cameraX: number) {
    const ctx = this.ctx;

    for (const p of particles) {
      const screenX = p.x - cameraX;
      if (screenX < -30 || screenX > this.width + 30) continue;

      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'STAR' || p.type === 'SPARKLE') {
        // Delicate 4-point stardust starlet / diamond twinkle
        ctx.translate(screenX, p.y);
        if (p.rotation !== undefined) {
          ctx.rotate(p.rotation);
        }
        const s = p.size;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.closePath();
        ctx.fill();

        // Tiny luminous center core
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.6, s * 0.28), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'AIR_MOTE') {
        // Soft atmospheric air mote / slipstream wisp
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Soft faint perimeter wisp
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else {
        // Standard particle (shards, bursts, checkpoint confetti)
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderPlayer(player: Player, cameraX: number, time: number) {
    const ctx = this.ctx;
    const screenX = player.x - cameraX;
    const screenY = player.y;

    if (player.isDissolving) {
      // Dissolving into floating red petals on soft rewind
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - player.dissolveProgress);
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(screenX, screenY, player.radius * (1 - player.dissolveProgress * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();

    // 1. Draw physics trailing string (Ribbon)
    ctx.strokeStyle = 'rgba(254, 242, 242, 0.92)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    if (player.stringNodes && player.stringNodes.length > 0) {
      ctx.moveTo(player.stringNodes[0].x - cameraX, player.stringNodes[0].y);
      for (let i = 1; i < player.stringNodes.length; i++) {
        const nx = player.stringNodes[i].x - cameraX;
        const ny = player.stringNodes[i].y;
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();

      // Ribbon knot/bow at the tail
      const tailNode = player.stringNodes[player.stringNodes.length - 1];
      ctx.fillStyle = '#FCA5A5';
      ctx.beginPath();
      ctx.arc(tailNode.x - cameraX, tailNode.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Red Keepsake (Red Balloon with emotional heart-teardrop shape)
    ctx.translate(screenX, screenY);
    ctx.rotate(player.rotation);

    // Warm soft red outer glow
    const glowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, player.radius + 10);
    glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
    glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 10, 0, Math.PI * 2);
    ctx.fill();

    // Balloon body (Real spherical inflated balloon with subtle bottom pinch towards knot)
    const balloonGrad = ctx.createRadialGradient(
      -player.radius * 0.35, -player.radius * 0.35, player.radius * 0.1,
      0, 0, player.radius * 1.05
    );
    balloonGrad.addColorStop(0, '#FFA4A4'); // Highlight soft peach/red
    balloonGrad.addColorStop(0.3, '#EF4444'); // Vivid scarlet
    balloonGrad.addColorStop(0.75, '#DC2626'); // Deep warm crimson
    balloonGrad.addColorStop(1, '#991B1B'); // Dark curved rim
    ctx.fillStyle = balloonGrad;

    ctx.beginPath();
    // Complete round circular curvature around top and sides, converging only at the very bottom knot
    ctx.moveTo(0, player.radius * 0.98);
    ctx.bezierCurveTo(-player.radius * 1.02, player.radius * 0.85, -player.radius * 1.05, -player.radius * 0.9, 0, -player.radius * 1.0);
    ctx.bezierCurveTo(player.radius * 1.05, -player.radius * 0.9, player.radius * 1.02, player.radius * 0.85, 0, player.radius * 0.98);
    ctx.fill();

    // Little knot and tied lip at bottom of balloon
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.moveTo(-4, player.radius * 0.96);
    ctx.lineTo(4, player.radius * 0.96);
    ctx.lineTo(2, player.radius * 0.96 + 5);
    ctx.lineTo(-2, player.radius * 0.96 + 5);
    ctx.closePath();
    ctx.fill();

    // Specular shine highlight (giving that realistic glossy latex balloon feel)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-player.radius * 0.38, -player.radius * 0.42, player.radius * 0.32, player.radius * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Secondary subtle glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(-player.radius * 0.52, -player.radius * 0.22, player.radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderVignette(level: LevelData) {
    const ctx = this.ctx;
    ctx.save();
    const grad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.5, this.width * 0.35,
      this.width * 0.5, this.height * 0.5, this.width * 0.72
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}
