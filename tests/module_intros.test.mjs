import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MODULE_INTROS,
  getModuleIntroConfig,
  getModuleIntroBySceneKey,
} from '../src/data/moduleIntros.ts';
import { MODULE_NARRATIONS } from '../src/data/narrations.ts';
import { SceneKeys } from '../src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const REQUIRED_MODULE_IDS = [
  'gobeklitepe',
  'demir_cagi',
  'anadolu_ustaligi',
  'sanayilesme',
  'milli_teknoloji',
  'uzay_teknolojileri',
];

test('MODULE_INTROS: contains all 6 required modules with valid schema', () => {
  for (const id of REQUIRED_MODULE_IDS) {
    const config = MODULE_INTROS[id];
    assert.ok(config, `Missing intro config for module: ${id}`);
    assert.equal(config.moduleId, id);
    assert.ok(config.sceneKey, `Module ${id} must have a sceneKey`);
    assert.ok(typeof config.stopNumber === 'number' && config.stopNumber >= 1 && config.stopNumber <= 6);
    assert.equal(config.stopLabel, `${config.stopNumber}. DURAK`);
    assert.ok(config.title && config.title.length > 0);
    assert.ok(config.subtitle && config.subtitle.length > 0);
    assert.ok(config.subtitleColorClass && config.subtitleColorClass.startsWith('title-'));
    assert.ok(config.instruction && config.instruction.length > 0);
    assert.ok(config.miniInstruction && config.miniInstruction.length > 0);
    assert.ok(config.backgroundImage && config.backgroundImage.startsWith('/assets/module_intros/'));
    assert.ok(config.audioId && config.audioId.length > 0);
  }
});

test('MODULE_INTROS: stop numbers are unique and sequentially 1 through 6', () => {
  const stopNumbers = REQUIRED_MODULE_IDS.map(id => MODULE_INTROS[id].stopNumber);
  assert.deepEqual(stopNumbers, [1, 2, 3, 4, 5, 6]);
});

test('MODULE_INTROS: all audioId values map to valid items in MODULE_NARRATIONS', () => {
  for (const id of REQUIRED_MODULE_IDS) {
    const intro = MODULE_INTROS[id];
    const narration = MODULE_NARRATIONS[intro.audioId];
    assert.ok(narration, `audioId "${intro.audioId}" must exist in MODULE_NARRATIONS`);
    assert.ok(narration.narrationText && narration.narrationText.length > 0);
  }
});

test('MODULE_INTROS: all background images exist on disk in public directory', () => {
  for (const id of REQUIRED_MODULE_IDS) {
    const intro = MODULE_INTROS[id];
    const relPath = intro.backgroundImage.replace(/^\//, '');
    const fullPath = path.join(projectRoot, 'public', relPath);
    assert.ok(
      fs.existsSync(fullPath),
      `Background asset file must exist on disk: ${fullPath}`
    );
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 10000, `Background file ${fullPath} should not be empty`);
  }
});

test('getModuleIntroConfig: resolves canonical IDs and common aliases', () => {
  assert.equal(getModuleIntroConfig('gobeklitepe')?.moduleId, 'gobeklitepe');
  assert.equal(getModuleIntroConfig('demir_cagi')?.moduleId, 'demir_cagi');
  assert.equal(getModuleIntroConfig('demir-cagi')?.moduleId, 'demir_cagi');
  assert.equal(getModuleIntroConfig('anadolu_ustaligi')?.moduleId, 'anadolu_ustaligi');
  assert.equal(getModuleIntroConfig('anadolu-ustaligi')?.moduleId, 'anadolu_ustaligi');
  assert.equal(getModuleIntroConfig('sanayilesme')?.moduleId, 'sanayilesme');
  assert.equal(getModuleIntroConfig('muhendislik')?.moduleId, 'sanayilesme');
  assert.equal(getModuleIntroConfig('mühendislik')?.moduleId, 'sanayilesme');
  assert.equal(getModuleIntroConfig('milli_teknoloji')?.moduleId, 'milli_teknoloji');
  assert.equal(getModuleIntroConfig('milli-teknoloji')?.moduleId, 'milli_teknoloji');
  assert.equal(getModuleIntroConfig('millî_teknoloji')?.moduleId, 'milli_teknoloji');
  assert.equal(getModuleIntroConfig('uzay_teknolojileri')?.moduleId, 'uzay_teknolojileri');
  assert.equal(getModuleIntroConfig('uzay-teknolojileri')?.moduleId, 'uzay_teknolojileri');
  assert.equal(getModuleIntroConfig(undefined), undefined);
});

test('getModuleIntroBySceneKey: accurately resolves all 6 game module scene keys', () => {
  assert.equal(getModuleIntroBySceneKey(SceneKeys.GOBEKLITEPE)?.moduleId, 'gobeklitepe');
  assert.equal(getModuleIntroBySceneKey(SceneKeys.DEMIR_CAGI)?.moduleId, 'demir_cagi');
  assert.equal(getModuleIntroBySceneKey(SceneKeys.ANADOLU_USTALIGI)?.moduleId, 'anadolu_ustaligi');
  assert.equal(getModuleIntroBySceneKey(SceneKeys.SANAYILESME)?.moduleId, 'sanayilesme');
  assert.equal(getModuleIntroBySceneKey(SceneKeys.MILLI_TEKNOLOJI)?.moduleId, 'milli_teknoloji');
  assert.equal(getModuleIntroBySceneKey(SceneKeys.UZAY_TEKNOLOJILERI)?.moduleId, 'uzay_teknolojileri');
  assert.equal(getModuleIntroBySceneKey(undefined), undefined);
});

test('milli_teknoloji: canonical config satisfies all prompt requirements', () => {
  const intro = MODULE_INTROS.milli_teknoloji;
  assert.ok(intro);
  assert.equal(intro.stopNumber, 5);
  assert.equal(intro.stopLabel, '5. DURAK');
  assert.equal(intro.title, 'Millî Teknoloji –');
  assert.equal(intro.subtitle, 'Gökyüzüne Yüksel');
  assert.equal(intro.subtitleColorClass, 'title-coral');
  assert.equal(intro.instruction, 'Sensörünü seç, güvenli rotanı oluştur ve görevi tamamla.');
  assert.equal(intro.miniInstruction, 'Sensörünü seç, güvenli rotanı oluştur ve görevi tamamla.');
  assert.equal(intro.backgroundImage, '/assets/module_intros/intro_milli_teknoloji.webp');
  assert.equal(intro.audioId, 'milli_teknoloji');
});

