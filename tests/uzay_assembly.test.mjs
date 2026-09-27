import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Module 6 (Uzay Teknolojileri): Exactly 4 stages exist in sequential order without payload selection', async () => {
  const filePath = path.join(projectRoot, 'src/data/uzayData.ts');
  assert.ok(fs.existsSync(filePath), 'uzayData.ts should exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.match(content, /title:\s*'UZAY ARACINI TASARLA'/);
  assert.match(content, /title:\s*'YÖRÜNGEYİ BELİRLE'/);
  assert.match(content, /title:\s*'YÖRÜNGEYE YERLEŞ'/);
  assert.match(content, /title:\s*'GÖREVİ TAMAMLA'/);

  // Strictly NO "GÖREV YÜKÜNÜ SEÇ"
  assert.doesNotMatch(content, /title:\s*'GÖREV YÜKÜNÜ SEÇ'/);
});

test('Module 6: Exactly 6 modular spacecraft parts exist with stable IDs and precise transforms', async () => {
  const filePath = path.join(projectRoot, 'src/data/uzayData.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  const requiredPartIds = ['body', 'solar_left', 'solar_right', 'antenna', 'sensor', 'heat_shield'];
  requiredPartIds.forEach(id => {
    assert.ok(content.includes(`id: '${id}'`), `Part ${id} should exist in SPACECRAFT_PARTS`);
  });

  // Verify transform properties exist in interface
  assert.ok(content.includes('targetX: number'));
  assert.ok(content.includes('targetY: number'));
  assert.ok(content.includes('targetScale: number'));
  assert.ok(content.includes('targetRotation: number'));
  assert.ok(content.includes('anchorX: number'));
  assert.ok(content.includes('anchorY: number'));
});

test('Module 6: Assembly assets exist on disk in public directory', async () => {
  const requiredAssets = [
    'space_hangar_bg.jpg',
    'satellite_full_assembled.png',
    'thumb_body.png',
    'thumb_solar_left.png',
    'thumb_solar_right.png',
    'thumb_antenna.png',
    'thumb_sensor.png',
    'thumb_heat_shield.png',
    'earth_orbit_cinematic_bg.jpg',
  ];

  requiredAssets.forEach(file => {
    const p = path.join(projectRoot, 'public/assets/uzay', file);
    assert.ok(fs.existsSync(p), `Asset public/assets/uzay/${file} should exist`);
  });
});

test('Module 6 (Stage 3): Exactly 3 orbits defined (LEO, MEO, GEO) with realistic Earth asset', async () => {
  const filePath = path.join(projectRoot, 'src/data/uzayData.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Verify 3 orbits exist
  assert.ok(content.includes("id: 'leo'"), 'LEO orbit should exist');
  assert.ok(content.includes("id: 'meo'"), 'MEO orbit should exist');
  assert.ok(content.includes("id: 'geo'"), 'GEO orbit should exist');

  // Verify LEO is the correct orbit for the observation payload
  assert.match(content, /id:\s*'leo'[\s\S]*?isCorrect:\s*true/, 'LEO should be marked correct');
  assert.match(content, /id:\s*'meo'[\s\S]*?isCorrect:\s*false/, 'MEO should be marked incorrect');
  assert.match(content, /id:\s*'geo'[\s\S]*?isCorrect:\s*false/, 'GEO should be marked incorrect');

  // Verify realistic earth asset exists
  const earthAssetPath = path.join(projectRoot, 'public/assets/uzay/realistic_earth.jpg');
  assert.ok(fs.existsSync(earthAssetPath), 'realistic_earth.jpg asset must exist in public/assets/uzay/');
  const earthStats = fs.statSync(earthAssetPath);
  assert.ok(earthStats.size > 100000, 'realistic_earth.jpg should be high-resolution');

  // Verify UzayStage3Orbit component exists
  const compPath = path.join(projectRoot, 'src/components/uzay/UzayStage3Orbit.tsx');
  assert.ok(fs.existsSync(compPath), 'UzayStage3Orbit.tsx must exist');

  // Verify UzayStage3Launch component exists
  const launchPath = path.join(projectRoot, 'src/components/uzay/UzayStage3Launch.tsx');
  assert.ok(fs.existsSync(launchPath), 'UzayStage3Launch.tsx must exist');
});

test('Module 6 (Stage 3 & Finale): Orbit Y bounds in upper 20%-48%, completion banner & certificate CTA flow', async () => {
  const launchPath = path.join(projectRoot, 'src/components/uzay/UzayStage3Launch.tsx');
  const launchContent = fs.readFileSync(launchPath, 'utf-8');

  // Verify viewBox is 16:9
  assert.match(launchContent, /viewBox="0 0 1600 900"/, 'viewBox must be 16:9 responsive 1600x900');

  // Verify orbit center & radius: Cy = 305, Ry = 110 (Y bounds: 194 to 416 out of 900, which is 21.5% to 46.2%)
  assert.match(launchContent, /Cy\s*=\s*305/);
  assert.match(launchContent, /Ry\s*=\s*110/);

  // Verify completion toast text
  assert.match(launchContent, /YÖRÜNGE GÖREVİ TAMAMLANDI/);
  assert.match(launchContent, /Uzay aracın seçilen yörüngeye başarıyla yerleşti\./);

  // Verify Shell CTA button is MACERAYI TAMAMLA
  const shellPath = path.join(projectRoot, 'src/components/uzay/UzayTeknolojileriMissionShell.tsx');
  const shellContent = fs.readFileSync(shellPath, 'utf-8');
  assert.match(shellContent, /MACERAYI TAMAMLA/);
  assert.match(shellContent, /GameStore\.completeModule\('uzay_teknolojileri'\)/);
  assert.match(shellContent, /GameStore\.saveResult\('uzay_teknolojileri'/);

  // Verify KioskShell final celebration text and SERTİFİKAMI OLUŞTUR CTA
  const kioskPath = path.join(projectRoot, 'src/components/KioskShell.tsx');
  const kioskContent = fs.readFileSync(kioskPath, 'utf-8');
  assert.match(kioskContent, /TEBRİKLER, KÂŞİF!/);
  assert.match(kioskContent, /SERTİFİKAMI OLUŞTUR/);
});

test('Module 6 (Stage Progression & Navigation Locks): Starts at Stage 1, locks future stages', async () => {
  const shellPath = path.join(projectRoot, 'src/components/uzay/UzayTeknolojileriMissionShell.tsx');
  const shellContent = fs.readFileSync(shellPath, 'utf-8');

  // Verify initial state starts strictly at Stage 1 with 0 placed parts and maxUnlockedStage = 1
  assert.match(shellContent, /const \[currentStage, setCurrentStage\] = useState<1 \| 2 \| 3 \| 4>\(1\);/);
  assert.match(shellContent, /const \[maxUnlockedStage, setMaxUnlockedStage\] = useState<1 \| 2 \| 3 \| 4>\(1\);/);
  assert.match(shellContent, /const \[stage1PlacedCount, setStage1PlacedCount\] = useState<number>\(0\);/);
  assert.match(shellContent, /const \[stage2Completed, setStage2Completed\] = useState<boolean>\(false\);/);
  assert.match(shellContent, /const \[stage3Completed, setStage3Completed\] = useState<boolean>\(false\);/);

  // Verify activeStageInfo falls back to UZAY_STAGES[0]
  assert.match(shellContent, /UZAY_STAGES\[0\]/);

  // Verify locked stepper guard
  assert.match(shellContent, /const isUnlocked = stage\.id <= maxUnlockedStage;/);
  assert.match(shellContent, /isUnlocked \? 'pointer' : 'not-allowed'/);

  // Verify stage 1 -> 2 progression
  assert.match(shellContent, /id="uzay-stage1-next-btn"[\s\S]*?setCurrentStage\(2\)/);

  // Verify stage 2 -> 3 progression
  assert.match(shellContent, /id="uzay-stage2-next-btn"[\s\S]*?setCurrentStage\(3\)/);

  // Verify stage 3 -> 4 progression
  assert.match(shellContent, /id="uzay-stage3-next-btn"[\s\S]*?setCurrentStage\(4\)/);

  // Verify stage 4 -> finish adventure
  assert.match(shellContent, /id="uzay-stage4-finish-btn"[\s\S]*?handleFinishAdventure/);
});
