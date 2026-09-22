import test from 'node:test';
import assert from 'node:assert/strict';
import { CINI_OBJECTS, CINI_MOTIFS, CINI_COLORS, STEP_QUOTES } from '../src/data/ciniData.ts';

test('CINI_OBJECTS: contains exactly 3 ceramic forms with valid metadata', () => {
  assert.equal(CINI_OBJECTS.length, 3, 'Should have exactly 3 ceramic objects');
  const expectedIds = ['tabak', 'vazo', 'karo'];
  assert.deepEqual(CINI_OBJECTS.map(o => o.id), expectedIds);
  CINI_OBJECTS.forEach(obj => {
    assert.ok(obj.name.length > 0, `Object ${obj.id} must have a name`);
    assert.ok(obj.subTitle.length > 0, `Object ${obj.id} must have a subtitle`);
    assert.ok(obj.description.length > 0, `Object ${obj.id} must have a description`);
  });
});

test('CINI_MOTIFS: contains 6 traditional Anatolian motifs with complete metadata', () => {
  assert.equal(CINI_MOTIFS.length, 6, 'Should have exactly 6 motifs');
  const expectedMotifs = ['lale', 'karanfil', 'rumi', 'hatayi', 'geometrik', 'yaprak'];
  assert.deepEqual(CINI_MOTIFS.map(m => m.id), expectedMotifs);
  CINI_MOTIFS.forEach(motif => {
    assert.ok(motif.name.length > 0, `Motif "${motif.id}" must have a name`);
    assert.ok(motif.meaning.length > 0, `Motif "${motif.id}" must have a meaning`);
    assert.ok(motif.description.length > 0, `Motif "${motif.id}" must have a description`);
  });
});

test('CINI_COLORS: contains all 6 authentic Anatolian ceramic pigment colors with meanings', () => {
  assert.equal(CINI_COLORS.length, 6, 'Should have exactly 6 colors');
  const expectedColors = ['kobalt', 'turkuaz', 'mercan', 'zumrut', 'toprak', 'krem'];
  assert.deepEqual(CINI_COLORS.map(c => c.id), expectedColors);
  CINI_COLORS.forEach(c => {
    assert.match(c.hex, /^#[0-9A-Fa-f]{6}$/, `Color hex "${c.hex}" must be valid`);
    assert.ok(c.name.length > 0, `Color "${c.id}" must have a name`);
    assert.ok(c.meaning.length > 0, `Color "${c.id}" must have a meaning`);
  });
});

test('STEP_QUOTES: contains authentic Turkish proverb/quote for each of the 5 steps', () => {
  assert.equal(STEP_QUOTES.length, 5, 'Should have 5 quotes for 5 steps');
  STEP_QUOTES.forEach((quote, idx) => {
    assert.ok(quote.length > 10, `Quote for step ${idx + 1} must be substantial`);
  });
});

test('CINI_MOTIF_TARGETS: each of the 6 motifs defines 6 valid interactive painting zones', async () => {
  const { getPaintingTargetsForMotif } = await import('../src/data/ciniData.ts');
  const motifIds = ['lale', 'karanfil', 'rumi', 'hatayi', 'geometrik', 'yaprak'];
  motifIds.forEach(id => {
    const targets = getPaintingTargetsForMotif(id);
    assert.equal(targets.length, 6, `Motif "${id}" must have 6 targets`);
    const zones = targets.map(t => t.zone);
    assert.deepEqual(zones, [0, 1, 2, 3, 4, 5], `Motif "${id}" must have zones 0 through 5`);
    targets.forEach(t => {
      assert.ok(t.x >= 150 && t.x <= 450, `Target x (${t.x}) for motif ${id} zone ${t.zone} must be in bounds`);
      assert.ok(t.y >= 50 && t.y <= 500, `Target y (${t.y}) for motif ${id} zone ${t.zone} must be in bounds`);
      assert.ok(t.label.length > 0, `Target label must not be empty`);
    });
  });
});

test('DECORATION_AREAS: defines dedicated safe decoration surfaces and clipPaths for each ceramic object', async () => {
  const { DECORATION_AREAS } = await import('../src/data/ciniData.ts');
  const expectedObjects = ['tabak', 'vazo', 'karo'];
  expectedObjects.forEach(objId => {
    const area = DECORATION_AREAS[objId];
    assert.ok(area, `Decoration area for ${objId} must exist`);
    assert.ok(area.clipPathId.length > 0, `clipPathId for ${objId} must not be empty`);
    assert.ok(area.safeScale >= 0.5 && area.safeScale <= 0.95, `safeScale for ${objId} must be in safe range`);
    assert.ok(area.transform.length > 0, `transform for ${objId} must not be empty`);
  });
});


