import test from 'node:test';
import assert from 'node:assert/strict';
import { DEV_CONFIG, DEV_UNLOCK_ALL_LEVELS } from '../src/config/devConfig.ts';

test('DEV_CONFIG: DEV_UNLOCK_ALL_LEVELS switch must be false for production release', () => {
  assert.equal(typeof DEV_CONFIG.DEV_UNLOCK_ALL_LEVELS, 'boolean');
  assert.equal(DEV_CONFIG.DEV_UNLOCK_ALL_LEVELS, false);
  assert.equal(DEV_UNLOCK_ALL_LEVELS, false);
});

test('DEV_CONFIG: setting DEV_UNLOCK_ALL_LEVELS to false restores linear locking', () => {
  const original = DEV_CONFIG.DEV_UNLOCK_ALL_LEVELS;
  try {
    DEV_CONFIG.DEV_UNLOCK_ALL_LEVELS = false;
    assert.equal(DEV_CONFIG.DEV_UNLOCK_ALL_LEVELS, false);
  } finally {
    DEV_CONFIG.DEV_UNLOCK_ALL_LEVELS = original;
  }
});
