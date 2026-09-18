export interface StrikeEvaluationResult {
  isSuccess: boolean;
  feedback: 'EARLY' | 'PERFECT' | 'LATE';
  strikeProgress: number;
}

export const DEFAULT_SUCCESS_START = 0.40;
export const DEFAULT_SUCCESS_END = 0.60;
export const DEFAULT_TARGET_STRIKES = 3;

/**
 * Pure evaluation function for anvil hammer strike timing.
 * Evaluates whether normalized needleProgress falls strictly within [successStart, successEnd].
 * Boundary values are inclusive: [successStart, successEnd]
 */
export function evaluateHammerStrike(
  strikeProgress: number,
  successStart = DEFAULT_SUCCESS_START,
  successEnd = DEFAULT_SUCCESS_END
): StrikeEvaluationResult {
  const isSuccess = strikeProgress >= successStart && strikeProgress <= successEnd;
  let feedback: 'EARLY' | 'PERFECT' | 'LATE' = 'PERFECT';
  if (strikeProgress < successStart) {
    feedback = 'EARLY';
  } else if (strikeProgress > successEnd) {
    feedback = 'LATE';
  }
  return { isSuccess, feedback, strikeProgress };
}

/**
 * Converts a horizontal pixel X coordinate along the meter track to normalized progress [0.0, 1.0].
 */
export function meterPixelToProgress(pixelX: number, trackLeft: number, trackWidth: number): number {
  if (trackWidth <= 0) return 0;
  return (pixelX - trackLeft) / trackWidth;
}

/**
 * Converts normalized progress [0.0, 1.0] to a horizontal pixel X coordinate along the meter track.
 */
export function meterProgressToPixel(progress: number, trackLeft: number, trackWidth: number): number {
  return trackLeft + progress * trackWidth;
}
