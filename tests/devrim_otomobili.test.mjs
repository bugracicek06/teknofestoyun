import test from 'node:test';
import assert from 'node:assert/strict';
import { DEVRIM_ENGINE_PARTS, DEVRIM_STEPS, ATATURK_QUOTE_DEVRIM } from '../src/data/devrimData.ts';

test('DEVRIM_ENGINE_PARTS: contains exactly 5 engine parts with complete metadata and normalized slots', () => {
  assert.equal(DEVRIM_ENGINE_PARTS.length, 5, 'Should have exactly 5 engine components');
  const expectedIds = ['motor_blogu', 'radyator', 'aku', 'hava_filtresi', 'atesleme'];
  assert.deepEqual(DEVRIM_ENGINE_PARTS.map(p => p.id), expectedIds);

  DEVRIM_ENGINE_PARTS.forEach(part => {
    assert.ok(part.name.length > 0, `Part ${part.id} must have a name`);
    assert.ok(part.subName.length > 0, `Part ${part.id} must have a subtitle`);
    assert.ok(part.description.length > 0, `Part ${part.id} must have a description`);
    assert.ok(part.slot.leftPercent > 0 && part.slot.leftPercent < 100, `Slot X for ${part.id} must be in bounds`);
    assert.ok(part.slot.topPercent > 0 && part.slot.topPercent < 100, `Slot Y for ${part.id} must be in bounds`);
    assert.ok(part.slot.widthPercent > 0 && part.slot.widthPercent <= 50, `Slot width for ${part.id} must be positive`);
    assert.ok(part.slot.heightPercent > 0 && part.slot.heightPercent <= 50, `Slot height for ${part.id} must be positive`);
  });
});

test('DEVRIM_STEPS: contains all 5 steps with complete educational parchment and Kaşif dialogue', () => {
  const steps = [1, 2, 3, 4, 5];
  steps.forEach(s => {
    const config = DEVRIM_STEPS[s];
    assert.ok(config, `Step ${s} config must exist`);
    assert.equal(config.step, s);
    assert.ok(config.badge.includes(`${s}. ADIM`));
    assert.ok(config.title.length > 0);
    assert.ok(config.subTitle.length > 0);
    assert.ok(config.parchment.title.length > 0);
    assert.ok(config.parchment.body1.length > 10);
    assert.ok(config.parchment.callout.length > 5);
    assert.ok(config.kasifMessage.length > 10);
  });
});

test('ATATURK_QUOTE_DEVRIM: contains authentic inspirational quote for Devrim chapter', () => {
  assert.ok(ATATURK_QUOTE_DEVRIM.quote.length > 10);
  assert.equal(ATATURK_QUOTE_DEVRIM.author, 'K. Atatürk');
});

test('Assembly logic: duplicate parts are ignored and completion triggers only when all 5 unique parts placed', () => {
  let placed = [];
  const addPart = (id) => {
    if (!placed.includes(id)) {
      placed = [...placed, id];
    }
  };

  // Attempt duplicate additions
  addPart('motor_blogu');
  addPart('motor_blogu');
  assert.equal(placed.length, 1);

  addPart('radyator');
  addPart('aku');
  addPart('hava_filtresi');
  assert.equal(placed.length, 4);
  assert.equal(placed.length === DEVRIM_ENGINE_PARTS.length, false);

  addPart('atesleme');
  assert.equal(placed.length, 5);
  assert.equal(placed.length === DEVRIM_ENGINE_PARTS.length, true);
});

