export interface MissionResult {
  elapsedSeconds: number;
  errorCount: number;
  starCount: number;
  finalScore: number;
  choices: Record<string, string>;
}

export function calculateResult(seconds: number, errors: number, choices: Record<string, string> = {}): MissionResult {
  const elapsedSeconds = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
  const errorCount = Math.max(0, Math.floor(Number.isFinite(errors) ? errors : 0));
  return {
    elapsedSeconds, errorCount, choices: { ...choices },
    starCount: errorCount <= 2 ? 3 : errorCount <= 5 ? 2 : 1,
    finalScore: Math.max(300, 1000 - errorCount * 40),
  };
}
