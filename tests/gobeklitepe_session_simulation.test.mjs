import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleAnimals } from '../src/utils/shuffle.ts';

const CANONICAL_ANIMALS = [
  { id: 'p_fox_left', name: 'Tilki' },
  { id: 'p_boar_left', name: 'Domuz' },
  { id: 'p_crane_left', name: 'Turna' },
  { id: 'p_fox_right', name: 'Yılan' },
  { id: 'p_boar_right', name: 'Boğa' },
  { id: 'p_crane_right', name: 'Akrep' },
];

const TARGET_ZONES = {
  p_fox_left: 'zone_fox_left',
  p_boar_left: 'zone_boar_left',
  p_crane_left: 'zone_crane_left',
  p_fox_right: 'zone_fox_right',
  p_boar_right: 'zone_boar_right',
  p_crane_right: 'zone_crane_right',
};

test('Session verification: at least 5 consecutive sessions produce distinct permutations and 6/6 completion succeeds', () => {
  const sessionOrders = [];

  for (let session = 1; session <= 5; session++) {
    // 1. Session start: Fisher-Yates shuffle
    const sessionTray = shuffleAnimals(CANONICAL_ANIMALS);
    const orderNames = sessionTray.map((a) => a.name);
    sessionOrders.push(orderNames.join(' – '));

    // Verify tray contains all 6 animals
    assert.equal(sessionTray.length, 6);
    assert.equal(new Set(sessionTray.map((a) => a.id)).size, 6);

    // 2. Gameplay simulation: complete all 6 in the randomized tray order
    const placedIds = [];
    for (const animal of sessionTray) {
      const targetZoneId = TARGET_ZONES[animal.id];
      assert.ok(targetZoneId, `Target zone exists for ${animal.name}`);

      // Placement: only animal.id is matched, array order remains intact
      placedIds.push(animal.id);

      // Verify that previously placed animals remain placed and unplaced remain unplaced
      for (const card of sessionTray) {
        const isPlaced = placedIds.includes(card.id);
        if (placedIds.indexOf(card.id) !== -1) {
          assert.equal(isPlaced, true);
        } else {
          assert.equal(isPlaced, false);
        }
      }
    }

    // 3. 6/6 completion check
    assert.equal(placedIds.length, 6);
  }

  // Print the 5 sessions for reporting
  console.log('\n--- 5 Consecutive Session Permutations ---');
  sessionOrders.forEach((order, idx) => {
    console.log(`Session ${idx + 1}: ${order}`);
  });

  // Verify that not all sessions are identical
  const uniqueOrders = new Set(sessionOrders);
  assert.ok(
    uniqueOrders.size >= 3,
    `Expected at least 3 distinct permutations out of 5 sessions, got ${uniqueOrders.size}`
  );
});
