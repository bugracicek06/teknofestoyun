import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateResult } from '../src/game/systems/scoring.ts';
import { createLocalCertificate } from '../src/game/systems/certificate.ts';

test('stars reflect retries, not speed', () => {
  assert.equal(calculateResult(999, 2).starCount, 3);
  assert.equal(calculateResult(1, 3).starCount, 2);
  assert.equal(calculateResult(1, 6).starCount, 1);
  assert.equal(calculateResult(10, 100).finalScore, 300);
});
test('invalid metrics are normalized and choices are copied', () => {
  const choices = { material: 'wood' };
  const result = calculateResult(NaN, -3, choices);
  choices.material = 'metal';
  assert.equal(result.elapsedSeconds, 0);
  assert.equal(result.errorCount, 0);
  assert.equal(result.choices.material, 'wood');
});
test('local certificates are unique, sanitize aliases and isolate results', () => {
  const results = { craft: calculateResult(40, 1) };
  const a = createLocalCertificate('<Ada>\u0001', results);
  const b = createLocalCertificate('', results);
  assert.equal(a.nickname, 'Ada'); assert.equal(b.nickname, 'Genç Kâşif');
  assert.notEqual(a.id, b.id); assert.ok(Number.isFinite(Date.parse(a.issuedAt)));
  results.craft.finalScore = 0; assert.equal(a.results.craft.finalScore, 960);
  assert.equal('url' in a, false);
});
