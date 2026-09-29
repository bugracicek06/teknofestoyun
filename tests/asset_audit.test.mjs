import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function getCaseSensitiveFiles(dir, base = '') {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    const rel = base ? `${base}/${item.name}` : item.name;
    if (item.isDirectory()) {
      res = res.concat(getCaseSensitiveFiles(full, rel));
    } else {
      res.push(rel);
    }
  }
  return res;
}

test('Asset audit: All referenced public and src assets exist on disk with exact case-sensitivity', () => {
  const publicFiles = new Set(getCaseSensitiveFiles(path.join(projectRoot, 'public')));
  const srcAssetFiles = new Set(getCaseSensitiveFiles(path.join(projectRoot, 'src/assets')));

  // Walk all code files
  const codeFiles = [];
  function walk(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) {
        if (f.name !== 'node_modules' && f.name !== 'dist' && f.name !== '.git' && f.name !== 'scratch') {
          walk(p);
        }
      } else if (/\.(tsx?|jsx?|html|css|json)$/.test(f.name)) {
        codeFiles.push(p);
      }
    }
  }
  walk(path.join(projectRoot, 'src'));

  const referenced = new Set();
  for (const cf of codeFiles) {
    const content = fs.readFileSync(cf, 'utf8');
    const matches = content.matchAll(/['"](\/assets\/[^'"]+|\/?assets\/[^'"]+)['"]/g);
    for (const m of matches) {
      let clean = m[1].replace(/^\//, '');
      referenced.add(clean);
    }
  }

  const missing = [];
  for (const ref of referenced) {
    // ref is e.g. "assets/uzay/thumb_body.png"
    if (!publicFiles.has(ref)) {
      // Check if it's in src/assets
      const sub = ref.replace(/^assets\//, '');
      if (!srcAssetFiles.has(sub)) {
        missing.push(ref);
      }
    }
  }

  assert.deepEqual(missing, [], `Missing or case-mismatched assets: ${missing.join(', ')}`);
});

test('Critical Assets in Git: Aircraft, Spacecraft, Robot Mascot, and Certificate Master are tracked', () => {
  const criticalFiles = [
    'src/assets/certificate_base.png',
    'src/assets/assistant/guide-robot.png',
    'public/assets/milli/uav_assembled.png',
    'public/assets/milli/uav_fuselage.png',
    'public/assets/milli/real_part_wing.png',
    'public/assets/milli/real_part_motor.png',
    'public/assets/milli/real_part_tail.png',
    'public/assets/milli/real_part_gear.png',
    'public/assets/uzay/space_hangar_bg.jpg',
    'public/assets/uzay/realistic_earth.jpg',
  ];

  for (const f of criticalFiles) {
    const exists = fs.existsSync(path.join(projectRoot, f));
    assert.ok(exists, `Critical asset must exist on disk: ${f}`);
  }
});

test('Bölüm 5 (Milli Teknoloji) & Bölüm 6 (Uzay): Placed-part visual rendering integrity', () => {
  // 1. Verify Bölüm 6 Spacecraft Model has no fragile unresolved filter references
  const uzayModelPath = path.join(projectRoot, 'src/components/uzay/UzaySatelliteModel.tsx');
  const uzayContent = fs.readFileSync(uzayModelPath, 'utf8');

  // Must NOT have filter="url(#partDropShadow)" on placed parts
  assert.doesNotMatch(
    uzayContent,
    /filter="url\(#partDropShadow\)"/,
    'UzaySatelliteModel must not use fragile filter="url(#partDropShadow)" on placed parts'
  );

  // Must export all 6 placed geometries
  const requiredUzayExports = [
    'SatelliteBodyGeometry',
    'SatelliteSolarLeftGeometry',
    'SatelliteSolarRightGeometry',
    'SatelliteAntennaGeometry',
    'SatelliteSensorGeometry',
    'SatelliteHeatShieldGeometry',
    'SatellitePartCardPreview',
    'FullyAssembledSatellite',
  ];
  for (const exp of requiredUzayExports) {
    assert.ok(uzayContent.includes(`export const ${exp}`), `Must export ${exp}`);
  }

  // 2. Verify Bölüm 5 Drone Model has no zero-width stroke lines for oleo struts and uses reliable rects
  const milliModelPath = path.join(projectRoot, 'src/components/milli/MilliDroneModel.tsx');
  const milliContent = fs.readFileSync(milliModelPath, 'utf8');

  const requiredMilliExports = [
    'DroneFuselageGeometry',
    'DroneWingGeometry',
    'DroneMotorGeometry',
    'DroneTailGeometry',
    'DroneLandingGearGeometry',
    'DronePartCardVisual',
    'CompletedDroneSvg',
  ];
  for (const exp of requiredMilliExports) {
    assert.ok(milliContent.includes(`export const ${exp}`), `Must export ${exp}`);
  }

  // Verify landing gear nose strut uses 3D rect geometry (not zero-width line with boundingBox gradient)
  assert.ok(
    milliContent.includes('<rect x="271.5" y="330" width="7" height="54"'),
    'Nose gear strut must use reliable rect geometry to ensure gradient evaluation'
  );

  // 3. Verify no duplicate defs inside card visual components
  const cardPreviewSnippet = uzayContent.slice(
    uzayContent.indexOf('SatellitePartCardPreview'),
    uzayContent.indexOf('FullyAssembledSatellite')
  );
  assert.doesNotMatch(
    cardPreviewSnippet,
    /<SatelliteDefs\s*\/>/,
    'SatellitePartCardPreview must not contain duplicate SatelliteDefs'
  );

  const cardVisualSnippet = milliContent.slice(
    milliContent.indexOf('DronePartCardVisual'),
    milliContent.indexOf('CompletedDroneSvg')
  );
  assert.doesNotMatch(
    cardVisualSnippet,
    /<DroneSvgDefs\s*\/>/,
    'DronePartCardVisual must not contain duplicate DroneSvgDefs'
  );
});

