import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MILLI_STAGES,
  IHA_PARTS,
  MISSION_SENSORS,
  WAYPOINTS,
  FLIGHT_TELEMETRY,
  FOOTER_QUOTE_MILLI,
} from '../src/data/milliData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Module 5: Exactly 4 stages exist in sequential order', () => {
  assert.equal(MILLI_STAGES.length, 4, 'Module 5 must have exactly 4 stages');
  assert.deepEqual(
    MILLI_STAGES.map(s => s.id),
    [1, 2, 3, 4],
    'Stage IDs must be sequentially 1, 2, 3, 4'
  );

  assert.equal(MILLI_STAGES[0].title, "İHA'NI TASARLA");
  assert.equal(MILLI_STAGES[1].title, 'GÖREV MODÜLÜNÜ SEÇ');
  assert.equal(MILLI_STAGES[2].title, 'ROTANI BELİRLE VE GÖKYÜZÜNE YÜKSEL');
  assert.equal(MILLI_STAGES[3].title, 'GÖREVİ TAMAMLA');
});

test('Module 5: Strictly NO combat, weapons, bombs, or firefighting mechanics in data', () => {
  const jsonStr = JSON.stringify({
    MILLI_STAGES,
    IHA_PARTS,
    MISSION_SENSORS,
    WAYPOINTS,
    FLIGHT_TELEMETRY,
  }).toLowerCase();

  const forbiddenWords = ['bomba', 'füze', 'silah', 'mühimmat', 'saldırı', 'yangın söndürme', 'su bırakma'];
  for (const word of forbiddenWords) {
    assert.equal(
      jsonStr.includes(word),
      false,
      `Forbidden combat or firefighting mechanic word found: "${word}"`
    );
  }
});

test('Module 5: Exactly 4 İHA assembly parts exist with valid schema', () => {
  assert.equal(IHA_PARTS.length, 4, 'Must have exactly 4 assembly parts');
  const partIds = IHA_PARTS.map(p => p.id);
  assert.ok(partIds.includes('kanat'), 'Must include kanat');
  assert.ok(partIds.includes('motor'), 'Must include motor');
  assert.ok(partIds.includes('kuyruk'), 'Must include kuyruk');
  assert.ok(partIds.includes('inis_takimi'), 'Must include inis_takimi');

  for (const part of IHA_PARTS) {
    assert.ok(part.name.length > 0, 'Part name must not be empty');
    assert.ok(part.role.length > 0, 'Part role must not be empty');
    assert.ok(part.slotCoordinates.x > 0 && part.slotCoordinates.x < 100);
    assert.ok(part.slotCoordinates.y > 0 && part.slotCoordinates.y < 100);

    // Check part image exists
    const imgPath = path.join(projectRoot, 'public', part.image.replace(/^\//, ''));
    assert.ok(fs.existsSync(imgPath), `Part image must exist: ${part.image}`);
  }
});

test('Module 5: Exactly 3 civilian mission sensors exist (Elektro-Optik, Termal, Multispektral)', () => {
  assert.equal(MISSION_SENSORS.length, 3, 'Must have exactly 3 civilian sensors');
  const sensorIds = MISSION_SENSORS.map(s => s.id);
  assert.deepEqual(sensorIds, ['elektro_optik', 'termal', 'multispektral']);

  for (const sensor of MISSION_SENSORS) {
    assert.ok(sensor.features.length >= 3, 'Each sensor must have at least 3 features');
    const imgPath = path.join(projectRoot, 'public', sensor.image.replace(/^\//, ''));
    assert.ok(fs.existsSync(imgPath), `Sensor image must exist: ${sensor.image}`);
  }
});

test('Module 5: Exactly 4 flight waypoints starting from Pamukkale Üniversitesi', () => {
  assert.equal(WAYPOINTS.length, 4, 'Must have exactly 4 waypoints');
  assert.equal(WAYPOINTS[0].name, 'Pamukkale Üniversitesi');
  assert.deepEqual(
    WAYPOINTS.map(w => w.id),
    [1, 2, 3, 4]
  );

  for (const wp of WAYPOINTS) {
    assert.ok(wp.coords.includes('° N'), 'Coordinates must include latitude');
    assert.ok(wp.coords.includes('° E'), 'Coordinates must include longitude');
    assert.ok(wp.mapPercent.x > 0 && wp.mapPercent.x < 100);
    assert.ok(wp.mapPercent.y > 0 && wp.mapPercent.y < 100);
  }
});

test('Module 5: Background and 3D UAV assets exist on disk in public directory', () => {
  const requiredFiles = [
    'public/assets/milli/pau_helipad_bg.jpg',
    'public/assets/milli/pau_aerial_bg.jpg',
    'public/assets/milli/uav_fuselage.png',
    'public/assets/milli/uav_assembled.png',
    'public/assets/milli/uav_flight_stage3.png',
  ];

  for (const fileRel of requiredFiles) {
    const fullPath = path.join(projectRoot, fileRel);
    assert.ok(fs.existsSync(fullPath), `Asset file must exist on disk: ${fileRel}`);
  }
});

test('Module 5: Authentic footer quote is configured', () => {
  assert.ok(FOOTER_QUOTE_MILLI.length > 10);
  assert.ok(FOOTER_QUOTE_MILLI.includes('DOĞAYI KORUYAN TEKNOLOJİ'));
});
