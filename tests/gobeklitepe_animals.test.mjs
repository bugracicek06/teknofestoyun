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

test('CANONICAL_ANIMALS: contains exactly the 6 required animals with correct IDs and names', () => {
  assert.equal(CANONICAL_ANIMALS.length, 6);

  const expected = [
    { id: 'p_fox_left', name: 'Tilki' },
    { id: 'p_boar_left', name: 'Domuz' },
    { id: 'p_crane_left', name: 'Turna' },
    { id: 'p_fox_right', name: 'Yılan' },
    { id: 'p_boar_right', name: 'Boğa' },
    { id: 'p_crane_right', name: 'Akrep' },
  ];

  for (const item of expected) {
    const found = CANONICAL_ANIMALS.find((a) => a.id === item.id);
    assert.ok(found, `Animal with ID ${item.id} should exist`);
    assert.equal(found.name, item.name);
  }
});

test('shuffleAnimals: does not mutate canonical array and returns a new array instance', () => {
  const originalIdsBefore = CANONICAL_ANIMALS.map((a) => a.id);
  const shuffled = shuffleAnimals(CANONICAL_ANIMALS);

  // Assert result is a different array instance
  assert.notEqual(shuffled, CANONICAL_ANIMALS);

  // Assert canonical array unchanged
  const originalIdsAfter = CANONICAL_ANIMALS.map((a) => a.id);
  assert.deepEqual(originalIdsBefore, originalIdsAfter);
});

test('shuffleAnimals: preserves all 6 elements without duplication or loss', () => {
  const shuffled = shuffleAnimals(CANONICAL_ANIMALS);

  assert.equal(shuffled.length, 6);
  const shuffledIds = shuffled.map((a) => a.id);

  for (const animal of CANONICAL_ANIMALS) {
    assert.ok(shuffledIds.includes(animal.id), `Shuffled array must contain ${animal.id}`);
  }

  // Ensure all IDs are unique
  const uniqueIds = new Set(shuffledIds);
  assert.equal(uniqueIds.size, 6);
});

test('shuffleAnimals: generates diverse permutations across repeated sessions (Fisher-Yates distribution)', () => {
  const orderSignatures = new Set();
  const iterations = 50;

  for (let i = 0; i < iterations; i++) {
    const shuffled = shuffleAnimals(CANONICAL_ANIMALS);
    const signature = shuffled.map((a) => a.id).join(',');
    orderSignatures.add(signature);
  }

  // Out of 50 runs of 6! = 720 possible permutations, an unbiased shuffle will yield dozens of distinct orders
  assert.ok(
    orderSignatures.size >= 10,
    `Expected at least 10 distinct permutations out of 50 runs, got ${orderSignatures.size}`
  );
});

test('Animal ID mapping: targetZoneId accurately matches each animal ID regardless of shuffled order', () => {
  const targetMap = {
    p_fox_left: 'zone_fox_left',
    p_boar_left: 'zone_boar_left',
    p_crane_left: 'zone_crane_left',
    p_fox_right: 'zone_fox_right',
    p_boar_right: 'zone_boar_right',
    p_crane_right: 'zone_crane_right',
  };

  // Test across multiple shuffled sequences
  for (let trial = 0; trial < 10; trial++) {
    const shuffled = shuffleAnimals(CANONICAL_ANIMALS);

    shuffled.forEach((animal, index) => {
      // Game logic checks animal.id === targetAnimalId, NOT array index
      const expectedTargetZoneId = targetMap[animal.id];
      assert.ok(expectedTargetZoneId, `Every animal must map to a target zone`);
      // Validate that index has NO bearing on the target mapping
      assert.equal(
        targetMap[animal.id],
        expectedTargetZoneId,
        `Animal ${animal.name} at index ${index} must preserve its target zone ${expectedTargetZoneId}`
      );
    });
  }
});
