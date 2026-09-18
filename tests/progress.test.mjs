import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameStore } from '../src/game/state/GameStore.ts';
import { calculateResult } from '../src/game/systems/scoring.ts';
test('new visitor starts with exactly one unlocked mission', () => {
  GameStore.resetProgress();
  assert.deepEqual(GameStore.getState().unlockedModuleIds, ['gobeklitepe']);
  GameStore.completeModule('uzay_teknolojileri');
  assert.equal(GameStore.getState().completedModuleIds.length, 0);
});
test('completion unlocks exactly the next mission and replays do not duplicate it', () => {
  GameStore.resetProgress();
  GameStore.saveResult('gobeklitepe', calculateResult(42, 3));
  GameStore.completeModule('gobeklitepe');
  assert.deepEqual(GameStore.getState().completedModuleIds, ['gobeklitepe']);
  assert.deepEqual(GameStore.getState().unlockedModuleIds, ['gobeklitepe','demir_cagi']);
  assert.equal(GameStore.getState().results.gobeklitepe.starCount, 2);
  const snapshot=GameStore.getState();snapshot.results.gobeklitepe.finalScore=0;
  assert.equal(GameStore.getState().results.gobeklitepe.finalScore,880);
});
test('reset clears all player results but retains sound preference', () => {
  GameStore.setAudioMuted(true);GameStore.resetProgress();
  assert.deepEqual(GameStore.getState().results, {});
  assert.equal(GameStore.getState().isAudioMuted,true);
});
