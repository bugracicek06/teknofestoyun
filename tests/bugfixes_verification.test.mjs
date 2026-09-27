import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Bölüm 3 – Yaprak deseni 5 numaralı nokta veri ve SVG doğrulaması', () => {
  const ciniDataContent = fs.readFileSync(path.join(projectRoot, 'src/data/ciniData.ts'), 'utf8');
  assert.ok(ciniDataContent.includes("'motif-yaprak-right-blossom'"), 'Yaprak point 5 ID olmalı');
  assert.ok(ciniDataContent.includes('order: 5'), 'Yaprak point 5 order 5 olmalı');

  const ciniSvgsContent = fs.readFileSync(path.join(projectRoot, 'src/components/cini/CiniMotifSVGs.tsx'), 'utf8');
  assert.ok(ciniSvgsContent.includes("'motif-yaprak-right-blossom'"), 'CiniMotifSVGs yaprak point 5 içermeli');
});

test('Bölüm 4 – Devrim Motoru Çalıştır butonu responsive standardı', () => {
  const devrimShell = fs.readFileSync(
    path.join(projectRoot, 'src/components/devrim/DevrimOtomobiliMissionShell.tsx'),
    'utf8'
  );
  assert.ok(devrimShell.includes('id="devrim-ignite-button"'), 'Ignite button ID bulunmalı');
  assert.ok(devrimShell.includes("minHeight: '48px'"), 'Ignite button 48px minimum yüksekliğe sahip olmalı');
  assert.ok(devrimShell.includes('paddingBottom:'), 'Padding bottom dock koruması olmalı');
});

test('Bölüm 5 – Parçalar (KANAT, MOTOR, KUYRUK, İNİŞ TAKIMI) yerleştirilince uçakta kalıcı görünür', () => {
  const milliAssembly = fs.readFileSync(
    path.join(projectRoot, 'src/components/milli/MilliStage1Assembly.tsx'),
    'utf8'
  );
  assert.ok(milliAssembly.includes("placedParts.has('wing')"), 'Wing composite rendering devrede olmalı');
  assert.ok(milliAssembly.includes("placedParts.has('engine')"), 'Engine composite rendering devrede olmalı');
  assert.ok(milliAssembly.includes("placedParts.has('tail')"), 'Tail composite rendering devrede olmalı');
  assert.ok(milliAssembly.includes("placedParts.has('landingGear')"), 'LandingGear composite rendering devrede olmalı');
  assert.ok(milliAssembly.includes("pointerEvents: isPlaced ? 'none' : 'auto'"), 'Placed kartlar locklanmalı');
});

test('Bölüm 5 – Uçuş/rota sağ alt CTA butonları 48px ve responsive tasarım standardında', () => {
  const milliShell = fs.readFileSync(
    path.join(projectRoot, 'src/components/milli/MilliTeknolojiMissionShell.tsx'),
    'utf8'
  );
  assert.ok(milliShell.includes('id="milli-stage3-fly-btn"'), 'Fly button bulunmalı');
  assert.ok(milliShell.includes('id="milli-stage3-next-btn"'), 'Next button bulunmalı');
  assert.ok(milliShell.includes("minHeight: '48px'"), '48px touch target standardı olmalı');
});

test('Bölüm 6 – Uzay aracı 6 parça montajı ve koordinat hesaplaması', () => {
  const uzayAssembly = fs.readFileSync(
    path.join(projectRoot, 'src/components/uzay/UzayStage1Assembly.tsx'),
    'utf8'
  );
  assert.ok(uzayAssembly.includes('getLocalSvgPoint'), 'CTM inverse koordinat çevrimi devrede olmalı');
  assert.ok(uzayAssembly.includes('ctm.inverse()'), 'Inverse matrix transform olmalı');
  assert.ok(uzayAssembly.includes("placedPartIds.includes('solar_left')"), 'Sol panel görünür kalmalı');
  assert.ok(uzayAssembly.includes("placedPartIds.includes('solar_right')"), 'Sağ panel görünür kalmalı');
  assert.ok(uzayAssembly.includes("placedPartIds.includes('antenna')"), 'Anten görünür kalmalı');
  assert.ok(uzayAssembly.includes("placedPartIds.includes('sensor')"), 'Sensör görünür kalmalı');
  assert.ok(uzayAssembly.includes("placedPartIds.includes('heat_shield')"), 'Isı kalkanı görünür kalmalı');
  assert.ok(uzayAssembly.includes("placedPartIds.includes('body')"), 'Ana gövde görünür kalmalı');
});

test('Bölüm 6 – Tüm yörünge seçenekleri (LEO, MEO, GEO) seçilebilir ve Stage 3 aktarılır', () => {
  const uzayOrbit = fs.readFileSync(
    path.join(projectRoot, 'src/components/uzay/UzayStage3Orbit.tsx'),
    'utf8'
  );
  assert.ok(uzayOrbit.includes('onOrbitSelected?.(orbit.id, true)'), 'Her yörünge seçilebilir olmalı');

  const uzayShell = fs.readFileSync(
    path.join(projectRoot, 'src/components/uzay/UzayTeknolojileriMissionShell.tsx'),
    'utf8'
  );
  assert.ok(uzayShell.includes('setSelectedOrbitId(orbitId)'), 'Orbit ID aktarılmalı');
  assert.ok(uzayShell.includes('setStage2Completed(true)'), 'Stage 2 tamamlanmalı');
});

test('Sertifika – İsim master PNG koordinatında merkezlenir ve uzun isimleri küçültür', () => {
  const certRenderer = fs.readFileSync(
    path.join(projectRoot, 'src/game/systems/certificateRenderer.ts'),
    'utf8'
  );
  assert.ok(certRenderer.includes("ctx.textAlign = 'center'"), 'Yatay ortalama center olmalı');
  assert.ok(certRenderer.includes("ctx.textBaseline = 'middle'"), 'Dikey orta middle olmalı');
  assert.ok(certRenderer.includes('NAME_CENTER_X_RATIO'), 'Master koordinat oranı olmalı');
});

test('Netlify – Powered by Netlify UI kaldırıcı observer devrede', () => {
  const indexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('removeNetlifyBadge'), 'removeNetlifyBadge observer DOM scripti mevcut olmalı');
  assert.ok(indexHtml.includes('MutationObserver'), 'Dinamik enjeksiyonları engelleyen MutationObserver olmalı');
});

test('Ortak Rehber Asistan – 6 bölümün her birinde maksimum 1 asistan standardı', () => {
  const shells = [
    'src/components/GobeklitepeMissionShell.tsx',
    'src/components/demir/DemirCagiMissionShell.tsx',
    'src/components/CiniSanatiMissionShell.tsx',
    'src/components/devrim/DevrimOtomobiliMissionShell.tsx',
    'src/components/milli/MilliTeknolojiMissionShell.tsx',
    'src/components/uzay/UzayTeknolojileriMissionShell.tsx',
  ];

  for (const shellPath of shells) {
    const content = fs.readFileSync(path.join(projectRoot, shellPath), 'utf8');
    const matches = content.match(/<GameAssistant/g) || [];
    assert.equal(matches.length, 1, `${shellPath} dosyasında tam 1 GameAssistant olmalı.`);
  }
});
