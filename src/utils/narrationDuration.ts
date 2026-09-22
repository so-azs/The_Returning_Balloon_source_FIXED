/**
 * Narration Duration and Star Spacing Utility
 * Calculates the exact audio duration for Arabic poetic narration
 * and maps it to comfortable spatial distance and time intervals in the game.
 */

/**
 * Estimates duration in seconds for Arabic spoken text at deliberate, calm poetic tempo (rate ~0.88)
 * - Average Arabic speech rate: ~0.48 - 0.52 seconds per word
 * - Breathing pauses for punctuation marks (commas, periods, semicolons, question marks): ~0.35s each
 * - Acoustic reverb tail and gentle breath cushion: 1.2s
 * - Minimum duration guarantee: 5.0 seconds
 */
export function estimateNarrationDuration(text: string): number {
  if (!text) return 4.0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const pauses = (text.match(/[،,.؛!؟]/g) || []).length;
  const rawDuration = words * 0.48 + pauses * 0.35 + 1.2;
  return Math.max(5.0, Math.min(14.0, rawDuration));
}

/**
 * Calculates the required time interval and horizontal distance between two consecutive stars
 * @param text The narration text of the current star
 * @param speed Average horizontal player speed in px/s (default ~156 px/s at 60fps)
 * @param pauseAfterNarration Restful, contemplative pause in seconds between end of speech and next star (default 2.5s)
 */
export function calculateStarSpacing(
  text: string,
  speed: number = 156,
  pauseAfterNarration: number = 2.5
): {
  narrationDuration: number;
  pauseDuration: number;
  totalTimeInterval: number;
  distance: number;
} {
  const narrationDuration = estimateNarrationDuration(text);
  const totalTimeInterval = narrationDuration + pauseAfterNarration;
  // Round to nearest 10px for clean game coordinates
  const distance = Math.round((totalTimeInterval * speed) / 10) * 10;

  return {
    narrationDuration,
    pauseDuration: pauseAfterNarration,
    totalTimeInterval,
    distance,
  };
}
