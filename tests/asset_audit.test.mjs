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
