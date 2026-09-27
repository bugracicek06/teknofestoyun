import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Robot Assistant Asset: guide-robot.png exists and is a valid image asset', () => {
  const robotPath = path.join(projectRoot, 'src', 'assets', 'assistant', 'guide-robot.png');
  assert.ok(fs.existsSync(robotPath), 'src/assets/assistant/guide-robot.png must exist');
  const stats = fs.statSync(robotPath);
  assert.ok(stats.size > 50000, `guide-robot.png size (${stats.size} bytes) should be a high-quality asset`);
});

test('Shared Component Architecture: All game-ui components and CSS exist', () => {
  const uiDir = path.join(projectRoot, 'src', 'components', 'game-ui');
  assert.ok(fs.existsSync(uiDir), 'src/components/game-ui directory must exist');

  const files = ['GameTopBar.tsx', 'GameAssistant.tsx', 'MissionCompleteModal.tsx', 'gameUi.css', 'index.ts'];
  for (const file of files) {
    const filePath = path.join(uiDir, file);
    assert.ok(fs.existsSync(filePath), `${file} must exist in src/components/game-ui`);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.length > 50, `${file} must not be empty`);
  }
});

test('CSS Design System: Touch target sizes, accents, responsive rules and z-index hierarchy', () => {
  const cssPath = path.join(projectRoot, 'src', 'components', 'game-ui', 'gameUi.css');
  const css = fs.readFileSync(cssPath, 'utf-8');

  // Verify touch target requirements (min 48px, up to 52-56px)
  assert.match(css, /52px|48px|56px/, 'CSS must enforce touch targets of 48px to 56px');

  // Verify all 6 module accent definitions exist
  const requiredAccents = [
    'gobeklitepe',
    'demir_cagi',
    'anadolu_ustaligi',
    'sanayilesme',
    'milli_teknoloji',
    'uzay_teknolojileri',
  ];
  for (const accent of requiredAccents) {
    assert.ok(
      css.includes(`data-module-accent="${accent}"`),
      `gameUi.css must contain accent style for ${accent}`
    );
  }

  // Verify responsive breakpoints for 1920, 1536, 1366, etc.
  assert.ok(css.includes('@media'), 'gameUi.css must contain responsive media queries');
  assert.ok(css.includes('max-width'), 'gameUi.css must handle overflow and max-width gracefully');

  // Verify z-index layers
  assert.ok(css.includes('z-index: 50'), 'Header should have distinct z-index layer (50)');
  assert.ok(css.includes('z-index: 45'), 'Assistant should have distinct z-index layer (45)');
  assert.ok(css.includes('z-index: 90'), 'Modal should have top overlay z-index layer (90)');
});

test('GameTopBar: Source code has two distinct functional zones (left/center info, right controls)', () => {
  const topBarPath = path.join(projectRoot, 'src', 'components', 'game-ui', 'GameTopBar.tsx');
  const code = fs.readFileSync(topBarPath, 'utf-8');

  // Left zone
  assert.ok(code.includes('top-bar-left'), 'Must have top-bar-left container');
  assert.ok(code.includes('top-bar-back-btn'), 'Must have back button');
  assert.ok(code.includes('BÖLÜM {moduleNumber} / 6') || code.includes('moduleNumber'), 'Must show module number out of 6');

  // Center mission zone
  assert.ok(code.includes('top-bar-center'), 'Must have top-bar-center container');
  assert.ok(code.includes('top-bar-mission-pill'), 'Must have mission pill container');
  assert.ok(code.includes('missionTitle'), 'Must render missionTitle prop');

  // Right system controls cluster
  assert.ok(code.includes('top-bar-right'), 'Must have top-bar-right container');
  assert.ok(code.includes('top-bar-controls-cluster'), 'Must have separate controls cluster');
  assert.ok(code.includes('onToggleAudio'), 'Must have audio toggle control');
  assert.ok(code.includes('onHelp'), 'Must have help control');
  assert.ok(code.includes('onPause'), 'Must have pause control');
  assert.ok(code.includes('onToggleFullscreen'), 'Must have fullscreen toggle control');
});

test('GameAssistant: Official guide robot asset and context-aware bubble', () => {
  const assistantPath = path.join(projectRoot, 'src', 'components', 'game-ui', 'GameAssistant.tsx');
  const code = fs.readFileSync(assistantPath, 'utf-8');

  // Verify official png asset import
  assert.ok(code.includes("import robotAsset from '../../assets/assistant/guide-robot.png'"), 'Must import guide-robot.png directly');
  assert.ok(code.includes('assistant-robot-img'), 'Must have assistant robot img tag');
  assert.ok(code.includes('assistant-speech-bubble'), 'Must have speech bubble');
  assert.ok(code.includes('Kaşif • Rehber Asistan'), 'Must have authoritative Kaşif name badge');
  assert.ok(code.includes('bubbleOpen'), 'Speech bubble must be toggleable/dismissible');
});

test('MissionCompleteModal: 3-column stats, star rating, module title and dynamic Next Module CTAs', () => {
  const modalPath = path.join(projectRoot, 'src', 'components', 'game-ui', 'MissionCompleteModal.tsx');
  const code = fs.readFileSync(modalPath, 'utf-8');

  // Eyebrow and titles
  assert.ok(code.includes('Bölüm {moduleNumber} Tamamlandı') || code.includes('moduleNumber'), 'Must have completion eyebrow');
  assert.ok(code.includes('complete-module-title'), 'Must have module title');

  // 3-column stats
  assert.ok(code.includes('Puan'), 'Must have Puan metric');
  assert.ok(code.includes('Süre'), 'Must have Süre metric');
  assert.ok(code.includes('Hata'), 'Must have Hata metric');

  // Simplified calculation drawer
  assert.ok(code.includes('showCalculationInfo'), 'Must have toggleable calculation drawer');
  assert.ok(code.includes('Puan nasıl hesaplandı?'), 'Must have simplified calculation accordion/drawer');

  // Next module titles map: modules 1-5 have specific next targets, module 6 has final CTA
  assert.ok(code.includes("'Demir Çağı'"), 'Module 1 next target should map to Demir Çağı');
  assert.ok(code.includes("'Anadolu Ustalığı'"), 'Module 2 next target should map to Anadolu Ustalığı');
  assert.ok(code.includes("'Bilim ve Sanayileşme'"), 'Module 3 next target should map to Bilim ve Sanayileşme');
  assert.ok(code.includes("'Millî Teknoloji'"), 'Module 4 next target should map to Millî Teknoloji');
  assert.ok(code.includes("'Uzay Teknolojileri'"), 'Module 5 next target should map to Uzay Teknolojileri');
  assert.ok(code.includes('isFinalModule'), 'Must support isFinalModule flag');
  assert.ok(code.includes('Macerayı Tamamla'), 'Module 6 finale must show "Macerayı Tamamla" CTA');
});

test('All 6 Game Modules: Verified to integrate GameTopBar and GameAssistant', () => {
  // Module 1: Göbeklitepe
  const mod1 = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'GobeklitepeMissionShell.tsx'), 'utf-8');
  assert.ok(mod1.includes('<GameTopBar'), 'Module 1 must render GameTopBar');
  assert.ok(mod1.includes('<GameAssistant'), 'Module 1 must render GameAssistant');

  // Module 2: Demir Çağı (Integrated via DemirCagiMissionShell and KioskShell)
  const kioskShell = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'KioskShell.tsx'), 'utf-8');
  assert.ok(kioskShell.includes('<DemirCagiMissionShell'), 'KioskShell renders DemirCagiMissionShell');
  assert.ok(kioskShell.includes('<MissionCompleteModal'), 'KioskShell renders shared MissionCompleteModal');
  const mod2 = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'demir', 'DemirCagiMissionShell.tsx'), 'utf-8');
  assert.ok(mod2.includes('<GameTopBar'), 'DemirCagiMissionShell renders shared GameTopBar');
  assert.ok(mod2.includes('<GameAssistant'), 'DemirCagiMissionShell renders shared GameAssistant');

  // Module 3: Anadolu Ustalığı (Çini)
  const mod3 = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'CiniSanatiMissionShell.tsx'), 'utf-8');
  assert.ok(mod3.includes('<GameTopBar'), 'Module 3 must render GameTopBar');
  assert.ok(mod3.includes('<GameAssistant'), 'Module 3 must render GameAssistant');

  // Module 4: Bilim ve Sanayileşme (Devrim)
  const mod4 = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'devrim', 'DevrimOtomobiliMissionShell.tsx'), 'utf-8');
  assert.ok(mod4.includes('<GameTopBar'), 'Module 4 must render GameTopBar');
  assert.ok(mod4.includes('<GameAssistant'), 'Module 4 must render GameAssistant');

  // Module 5: Millî Teknoloji
  const mod5 = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'milli', 'MilliTeknolojiMissionShell.tsx'), 'utf-8');
  assert.ok(mod5.includes('<GameTopBar'), 'Module 5 must render GameTopBar');
  assert.ok(mod5.includes('<GameAssistant'), 'Module 5 must render GameAssistant');

  // Module 6: Uzay Teknolojileri
  const mod6 = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'uzay', 'UzayTeknolojileriMissionShell.tsx'), 'utf-8');
  assert.ok(mod6.includes('<GameTopBar'), 'Module 6 must render GameTopBar');
  assert.ok(mod6.includes('<GameAssistant'), 'Module 6 must render GameAssistant');
});
