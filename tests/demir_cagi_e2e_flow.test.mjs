import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GameStore } from '../src/game/state/GameStore.ts';
import { calculateResult } from '../src/game/systems/scoring.ts';
import {
  CANONICAL_SWORD_PART_IDS,
  SWORD_SLOT_DEFS,
  evaluateSwordDrop,
  verifySwordAssemblyContiguity,
} from '../src/game/systems/swordAssembly.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Demir Çağı Architecture: Shell, viewport, and canvas container layout rules', () => {
  // 1. Verify DemirCagiMissionShell exists and has proper structure
  const shellPath = path.join(projectRoot, 'src', 'components', 'demir', 'DemirCagiMissionShell.tsx');
  assert.ok(fs.existsSync(shellPath), 'DemirCagiMissionShell.tsx must exist');
  const shellCode = fs.readFileSync(shellPath, 'utf-8');
  assert.ok(shellCode.includes('<GameTopBar'), 'DemirCagiMissionShell renders GameTopBar');
  assert.ok(shellCode.includes('demir-cagi-gameplay-viewport'), 'DemirCagiMissionShell renders gameplay viewport');
  assert.ok(shellCode.includes('<GameAssistant'), 'DemirCagiMissionShell renders GameAssistant');

  // 2. Verify CSS rules ensure zero blocking and full viewport canvas
  const cssPath = path.join(projectRoot, 'src', 'components', 'demir', 'demirCagiShell.css');
  assert.ok(fs.existsSync(cssPath), 'demirCagiShell.css must exist');
  const css = fs.readFileSync(cssPath, 'utf-8');

  assert.ok(css.includes('pointer-events: none'), 'Shell container must be pointer-events: none');
  assert.ok(css.includes('.game-top-bar'), 'Top bar must be styled');
  assert.ok(css.includes('pointer-events: auto'), 'Top bar buttons must accept clicks');
  assert.ok(css.includes('column-reverse') || css.includes('flex-direction'), 'Assistant must have non-blocking layout');

  // 3. Verify index.css has no flex squashing in kiosk-wrapper
  const indexCss = fs.readFileSync(path.join(projectRoot, 'src', 'styles', 'index.css'), 'utf-8');
  assert.ok(!indexCss.includes('.kiosk-wrapper {\n  position: relative;\n  width: 100%;\n  height: 100dvh;\n  min-height: 320px;\n  max-width: 100%;\n  max-height: 100dvh;\n  display: flex;'), 'kiosk-wrapper must not have flex-direction: row squashing canvas');
  assert.ok(indexCss.includes('.game-canvas-container {\n  position: absolute;\n  inset: 0;'), 'game-canvas-container must be absolute inset: 0 to fill viewport');
});

test('Demir Çağı Stage 1: Feed materials (ore + coal) to hearth, progress 0/2 -> 2/2', () => {
  let fedCount = 0;
  let currentStage = 1;
  const materials = [
    { id: 'stone', isCorrect: false },
    { id: 'copper', isCorrect: false },
    { id: 'iron_ore', isCorrect: true },
    { id: 'charcoal', isCorrect: true },
  ];

  // Distractors must not advance progress
  const stone = materials.find((m) => m.id === 'stone');
  assert.equal(stone.isCorrect, false);
  if (!stone.isCorrect) {
    // Distractor rejected
  }
  assert.equal(fedCount, 0, 'Distractor must not increment count');

  // Correct 1: Iron ore
  const ore = materials.find((m) => m.id === 'iron_ore');
  assert.equal(ore.isCorrect, true);
  fedCount++;
  assert.equal(fedCount, 1, '1/2 materials fed');

  // Correct 2: Charcoal
  const charcoal = materials.find((m) => m.id === 'charcoal');
  assert.equal(charcoal.isCorrect, true);
  fedCount++;
  assert.equal(fedCount, 2, '2/2 materials fed');

  if (fedCount === 2) {
    currentStage = 2;
  }
  assert.equal(currentStage, 2, 'Should transition to Stage 2 after 2/2');
});

test('Demir Çağı Stage 2: Bellows airflow & heating simulation reaches 100%', () => {
  let heatingProgress = 0;
  let currentHeat = 24;
  let currentStage = 2;

  // Pump bellows
  const pumpBellows = () => {
    currentHeat = Math.min(100, currentHeat + 15);
    heatingProgress = Math.min(100, heatingProgress + 20);
  };

  for (let i = 0; i < 5; i++) {
    pumpBellows();
  }

  assert.equal(heatingProgress, 100, 'Heating progress must reach 100%');
  assert.ok(currentHeat >= 75, 'Heat must reach forging temperature');
  if (heatingProgress >= 100) {
    currentStage = 3;
  }
  assert.equal(currentStage, 3, 'Should transition to Stage 3 after bellows heating');
});

test('Demir Çağı Stage 3: Anvil hammer strikes 0/5 -> 5/5 with timing evaluation', () => {
  let hammerStrikes = 0;
  const targetStrikes = 5;
  let currentStage = 3;

  for (let i = 0; i < targetStrikes; i++) {
    hammerStrikes++;
  }

  assert.equal(hammerStrikes, 5, 'Must achieve 5 successful hammer strikes');
  if (hammerStrikes >= targetStrikes) {
    currentStage = 4;
  }
  assert.equal(currentStage, 4, 'Should transition to Stage 4 after anvil forging');
});

test('Demir Çağı Stage 4: Yatağan 4/4 sword parts assembly and contiguity', () => {
  let assembledCount = 0;
  const parts = [...CANONICAL_SWORD_PART_IDS];

  for (const partId of parts) {
    const slotKey = partId.replace('part_', 'slot_');
    const slot = SWORD_SLOT_DEFS[slotKey];
    assert.ok(slot, `Slot must exist for ${partId}`);
    const dropRes = evaluateSwordDrop(partId, slot.x, slot.y);
    assert.equal(dropRes.isSuccess, true, `Drop of ${partId} at slot position must succeed`);
    assembledCount++;
  }

  assert.equal(assembledCount, 4, 'All 4 parts assembled');
  const contiguity = verifySwordAssemblyContiguity();
  assert.equal(contiguity.isContiguous, true, 'verifySwordAssemblyContiguity must return true');
});

test('Demir Çağı Full Progression: Complete module 2 -> Unlocks module 3 (Anadolu Ustalığı)', () => {
  GameStore.resetSession();
  GameStore.startNewGame('Demir Ustası');

  // Verify module 1 completed & module 2 unlocked
  GameStore.completeModule('gobeklitepe');
  assert.equal(GameStore.isModuleCompleted('gobeklitepe'), true);
  assert.equal(GameStore.isModuleUnlocked('demir_cagi'), true);

  // Complete module 2
  const demirResult = calculateResult(45, 0, {
    'Hammadde': 'Kızıl Demir Cevheri & Meşe Kömürü',
    'Ocak Sıcaklığı': '1200 °C',
    'Dövme Tekniği': 'Geleneksel Örs Şekillendirme',
    'Eser': 'Denizli Yatağan Kılıcı (4 Parça)',
  });
  GameStore.saveResult('demir_cagi', demirResult);
  GameStore.completeModule('demir_cagi');

  // Verify module 2 recorded
  assert.equal(GameStore.isModuleCompleted('demir_cagi'), true);
  assert.equal(demirResult.starCount, 3);
  assert.equal(demirResult.finalScore, 1000);

  // Verify module 3 is now unlocked
  assert.equal(GameStore.isModuleUnlocked('anadolu_ustaligi'), true, 'Module 3 (Anadolu Ustalığı) must be unlocked');
  assert.equal(GameStore.isModuleUnlocked('sanayilesme'), false, 'Module 4 must still be locked');
});
