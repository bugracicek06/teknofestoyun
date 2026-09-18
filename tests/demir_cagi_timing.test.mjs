import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateHammerStrike,
  meterPixelToProgress,
  meterProgressToPixel,
  DEFAULT_SUCCESS_START,
  DEFAULT_SUCCESS_END,
  DEFAULT_TARGET_STRIKES,
} from '../src/game/systems/ironAgeTiming.ts';

test('Demir Çağı Timing: İbre yeşilin SOLUNDA -> vur -> BAŞARISIZ (ERKEN)', () => {
  const resultFarLeft = evaluateHammerStrike(0.15, 0.40, 0.60);
  assert.equal(resultFarLeft.isSuccess, false);
  assert.equal(resultFarLeft.feedback, 'EARLY');

  const resultJustBefore = evaluateHammerStrike(0.399, 0.40, 0.60);
  assert.equal(resultJustBefore.isSuccess, false);
  assert.equal(resultJustBefore.feedback, 'EARLY');
});

test('Demir Çağı Timing: İbre yeşilin sol SINIRINDA -> vur -> BAŞARILI (TAM İSABET)', () => {
  const resultLeftBoundary = evaluateHammerStrike(0.40, 0.40, 0.60);
  assert.equal(resultLeftBoundary.isSuccess, true);
  assert.equal(resultLeftBoundary.feedback, 'PERFECT');
});

test('Demir Çağı Timing: İbre yeşilin ORTASINDA -> vur -> BAŞARILI (TAM İSABET)', () => {
  const resultCenter = evaluateHammerStrike(0.50, 0.40, 0.60);
  assert.equal(resultCenter.isSuccess, true);
  assert.equal(resultCenter.feedback, 'PERFECT');

  const resultInside = evaluateHammerStrike(0.55, 0.40, 0.60);
  assert.equal(resultInside.isSuccess, true);
  assert.equal(resultInside.feedback, 'PERFECT');
});

test('Demir Çağı Timing: İbre yeşilin sağ SINIRINDA -> vur -> BAŞARILI (TAM İSABET)', () => {
  const resultRightBoundary = evaluateHammerStrike(0.60, 0.40, 0.60);
  assert.equal(resultRightBoundary.isSuccess, true);
  assert.equal(resultRightBoundary.feedback, 'PERFECT');
});

test('Demir Çağı Timing: İbre yeşilin SAĞINDA -> vur -> BAŞARISIZ (GEÇ)', () => {
  const resultJustAfter = evaluateHammerStrike(0.601, 0.40, 0.60);
  assert.equal(resultJustAfter.isSuccess, false);
  assert.equal(resultJustAfter.feedback, 'LATE');

  const resultFarRight = evaluateHammerStrike(0.85, 0.40, 0.60);
  assert.equal(resultFarRight.isSuccess, false);
  assert.equal(resultFarRight.feedback, 'LATE');
});

test('Demir Çağı Timing: Görsel piksel koordinatı ile matematiksel değerlendirme birebir örtüşmeli', () => {
  const trackWidth = 620;
  const trackLeft = 960 - trackWidth / 2; // 650
  const successStart = DEFAULT_SUCCESS_START; // 0.40
  const successEnd = DEFAULT_SUCCESS_END;     // 0.60

  const visualGreenStart = meterProgressToPixel(successStart, trackLeft, trackWidth); // 650 + 248 = 898
  const visualGreenEnd = meterProgressToPixel(successEnd, trackLeft, trackWidth);     // 650 + 372 = 1022

  // 1 pixel right before visual green
  const pxBefore = visualGreenStart - 1;
  const progressBefore = meterPixelToProgress(pxBefore, trackLeft, trackWidth);
  assert.equal(evaluateHammerStrike(progressBefore, successStart, successEnd).isSuccess, false);

  // Pixel exactly on visual green start
  const progressStart = meterPixelToProgress(visualGreenStart, trackLeft, trackWidth);
  assert.equal(evaluateHammerStrike(progressStart, successStart, successEnd).isSuccess, true);

  // Pixel exactly at center
  const progressCenter = meterPixelToProgress(960, trackLeft, trackWidth);
  assert.equal(evaluateHammerStrike(progressCenter, successStart, successEnd).isSuccess, true);

  // Pixel exactly on visual green end
  const progressEnd = meterPixelToProgress(visualGreenEnd, trackLeft, trackWidth);
  assert.equal(evaluateHammerStrike(progressEnd, successStart, successEnd).isSuccess, true);

  // 1 pixel right after visual green
  const pxAfter = visualGreenEnd + 1;
  const progressAfter = meterPixelToProgress(pxAfter, trackLeft, trackWidth);
  assert.equal(evaluateHammerStrike(progressAfter, successStart, successEnd).isSuccess, false);
});

test('Demir Çağı Timing: Hızlı art arda çift dokunuş duplicate vuruş tetiklememeli (Input Lock Simülasyonu)', () => {
  let isHammerStriking = false;
  let strikeCount = 0;
  let errorCount = 0;

  function simulateTouch(progress) {
    if (isHammerStriking) return 'LOCKED';
    isHammerStriking = true;

    const evalResult = evaluateHammerStrike(progress, 0.40, 0.60);
    if (evalResult.isSuccess) {
      strikeCount++;
    } else {
      errorCount++;
    }
    return 'PROCESSED';
  }

  // First tap in sweet spot
  const firstTap = simulateTouch(0.50);
  assert.equal(firstTap, 'PROCESSED');
  assert.equal(strikeCount, 1);

  // Immediate second tap while animation is active
  const rapidDuplicateTap = simulateTouch(0.50);
  assert.equal(rapidDuplicateTap, 'LOCKED');
  assert.equal(strikeCount, 1); // Has not incremented!

  // Animation finishes, unlocks input
  isHammerStriking = false;

  // Next valid tap
  const secondLegitimateTap = simulateTouch(0.50);
  assert.equal(secondLegitimateTap, 'PROCESSED');
  assert.equal(strikeCount, 2);
  assert.equal(errorCount, 0);
  assert.equal(DEFAULT_TARGET_STRIKES, 3);
});
