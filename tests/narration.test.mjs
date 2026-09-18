import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MODULE_NARRATIONS,
  getNarrationByModuleId,
  getNarrationBySceneKey,
} from '../src/data/narrations.ts';
import { NARRATION_DUCK_LEVEL } from '../src/game/utils/audio.ts';
import { WebSpeechNarrationProvider } from '../src/game/systems/narration.ts';
import { SceneKeys } from '../src/types/game.ts';

test('all 6 game modules have complete data-driven narration items', () => {
  const expectedModules = [
    'gobeklitepe',
    'demir_cagi',
    'anadolu_ustaligi',
    'sanayilesme',
    'milli_teknoloji',
    'uzay_teknolojileri',
  ];

  for (const id of expectedModules) {
    const item = MODULE_NARRATIONS[id];
    assert.ok(item, `Module ${id} must exist in MODULE_NARRATIONS`);
    assert.ok(item.title.length > 0, `Title must be present for ${id}`);
    assert.ok(item.displayInstruction.length > 0, `Display instruction must be present for ${id}`);
    assert.ok(item.narrationText.length > 0, `Narration text must be present for ${id}`);
    assert.ok(item.audioPath.endsWith('.mp3'), `Audio path must be an mp3 file for ${id}`);
    assert.ok(item.audioPath.startsWith('/audio/narration/'), `Audio path must be under /audio/narration/ for ${id}`);
  }
});

test('Göbeklitepe narration text matches approved safe wording and excludes sensitive terms', () => {
  const item = MODULE_NARRATIONS.gobeklitepe;
  assert.equal(
    item.narrationText,
    "Merhaba genç kâşif! Göbeklitepe'nin gizemli taşlarını keşfetmeye hazır mısın? Bir hayvan figürünü seç ve T biçimli dikilitaş üzerindeki doğru yerine yerleştir."
  );
  assert.equal(item.narrationText.includes('tapınak'), false, 'Should not mention tapınak per user requirement');
});

test('getNarrationByModuleId and getNarrationBySceneKey resolve accurately', () => {
  const byId = getNarrationByModuleId('sanayilesme');
  assert.ok(byId);
  assert.equal(byId.title, 'Mühendislik – Mekanizmayı Kur');

  const byScene = getNarrationBySceneKey(SceneKeys.UZAY_TEKNOLOJILERI);
  assert.ok(byScene);
  assert.equal(byScene.id, 'uzay_teknolojileri');
});

test('NARRATION_DUCK_LEVEL is configured to exactly 0.35', () => {
  assert.equal(NARRATION_DUCK_LEVEL, 0.35);
});

test('WebSpeech Turkish voice selection prioritizes Natural/Online voices over standard voices', () => {
  const provider = new WebSpeechNarrationProvider();

  const mockVoices = [
    { name: 'Microsoft David', lang: 'en-US', default: false, localService: true },
    { name: 'Microsoft Tolga', lang: 'tr-TR', default: false, localService: true },
    { name: 'Google Türkçe', lang: 'tr-TR', default: false, localService: false },
    { name: 'Microsoft Ahmet Online (Natural) - Turkish (Turkey)', lang: 'tr-TR', default: false, localService: false },
    { name: 'Yelda (Enhanced)', lang: 'tr_TR', default: false, localService: false },
  ];

  // @ts-expect-error Mocking SpeechSynthesisVoice for unit test
  const chosen = provider.pickBestTurkishVoice(mockVoices);
  assert.ok(chosen);
  assert.equal(chosen.name, 'Microsoft Ahmet Online (Natural) - Turkish (Turkey)');
});

test('WebSpeech Turkish voice selection filters out foreign voices and falls back cleanly', () => {
  const provider = new WebSpeechNarrationProvider();

  const mockForeignVoices = [
    { name: 'Alex', lang: 'en-US', default: false, localService: true },
    { name: 'Anna', lang: 'de-DE', default: true, localService: true },
  ];

  // @ts-expect-error Mocking SpeechSynthesisVoice for unit test
  const fallback = provider.pickBestTurkishVoice(mockForeignVoices);
  assert.ok(fallback);
  assert.equal(fallback.name, 'Anna'); // Falls back to default
});

test('getNarrationByModuleId handles hyphenated and renamed aliases cleanly', () => {
  const aliases = [
    ['demir-cagi', 'demir_cagi'],
    ['anadolu-ustaligi', 'anadolu_ustaligi'],
    ['muhendislik', 'sanayilesme'],
    ['mühendislik', 'sanayilesme'],
    ['milli-teknoloji', 'milli_teknoloji'],
    ['uzay-teknolojileri', 'uzay_teknolojileri'],
  ];

  for (const [alias, canonicalId] of aliases) {
    const item = getNarrationByModuleId(alias);
    assert.ok(item, `Alias ${alias} should resolve`);
    assert.equal(item.id, canonicalId);
    assert.ok(item.narrationText.length > 0);
  }
});

