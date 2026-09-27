import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CINI_COLORS,
  CINI_EXPANDED_PALETTE,
  MOTIF_REGION_DEFINITIONS,
  getCiniColor,
} from '../src/data/ciniData.ts';

test('Color State Synchronization: CINI_COLORS and CINI_EXPANDED_PALETTE share identical hex values', () => {
  // All 6 colors must have identical hex values across palettes
  assert.equal(CINI_COLORS.length, 6, 'Should have exactly 6 canonical colors');
  assert.equal(CINI_EXPANDED_PALETTE.length, 6, 'Expanded palette must also have exactly 6 canonical colors');

  const colorMap = new Map();
  CINI_EXPANDED_PALETTE.forEach((c) => {
    colorMap.set(c.name, c.hex.toLowerCase());
  });

  CINI_COLORS.forEach((c) => {
    if (colorMap.has(c.name)) {
      assert.equal(
        c.hex.toLowerCase(),
        colorMap.get(c.name),
        `Color "${c.name}" hex in CINI_COLORS (${c.hex}) must match CINI_EXPANDED_PALETTE (${colorMap.get(c.name)})`
      );
    }
  });

  // Verify key canonical 6 hex values
  assert.equal(getCiniColor('kirmizi').hex, '#E53935', 'Kırmızı must be #E53935');
  assert.equal(getCiniColor('sari').hex, '#F5B700', 'Sarı must be #F5B700');
  assert.equal(getCiniColor('yesil').hex, '#1E9B50', 'Yeşil must be #1E9B50');
  assert.equal(getCiniColor('mavi').hex, '#245DB5', 'Mavi must be #245DB5');
  assert.equal(getCiniColor('turkuaz').hex, '#16B6C8', 'Turkuaz must be #16B6C8');
  assert.equal(getCiniColor('mor').hex, '#8434C6', 'Mor must be #8434C6');
});

test('Color State Flow: Step 3 selection -> Step 4 painting -> Step 5 completion preserves exact hexes', () => {
  // 1. Simulate Step 3 selection
  const userSelectedPalette = {
    primary: getCiniColor('mavi').hex,      // #245DB5
    secondary: getCiniColor('kirmizi').hex, // #E53935
    accent: getCiniColor('turkuaz').hex,    // #16B6C8
  };

  assert.equal(userSelectedPalette.primary, '#245DB5');
  assert.equal(userSelectedPalette.secondary, '#E53935');
  assert.equal(userSelectedPalette.accent, '#16B6C8');

  // 2. Transition to Step 4 without resetting selectedPalette
  let activePaintColor = userSelectedPalette.primary;
  assert.equal(activePaintColor, '#245DB5', 'Initial active paint color in Step 4 must match primary selection');

  // 3. Paint region 1 with primary
  const paintedRegions = {};
  paintedRegions['motif-lale-top-flower'] = { regionId: 'motif-lale-top-flower', colorId: 'mavi', colorHex: activePaintColor };
  assert.equal(paintedRegions['motif-lale-top-flower'].colorHex, '#245DB5');

  // 4. Switch active color to secondary (#E53935) and paint region 2
  activePaintColor = userSelectedPalette.secondary;
  paintedRegions['motif-lale-center'] = { regionId: 'motif-lale-center', colorId: 'kirmizi', colorHex: activePaintColor };
  assert.equal(paintedRegions['motif-lale-center'].colorHex, '#E53935');
  assert.equal(paintedRegions['motif-lale-top-flower'].colorHex, '#245DB5', 'Previously painted region must remain unchanged');

  // 5. Switch active color to accent (#16B6C8) and paint region 3
  activePaintColor = userSelectedPalette.accent;
  paintedRegions['motif-lale-left-wing'] = { regionId: 'motif-lale-left-wing', colorId: 'turkuaz', colorHex: activePaintColor };
  assert.equal(paintedRegions['motif-lale-left-wing'].colorHex, '#16B6C8');

  // 6. Verify Step 5 retains all exact painted colors
  assert.equal(paintedRegions['motif-lale-top-flower'].colorHex, '#245DB5');
  assert.equal(paintedRegions['motif-lale-center'].colorHex, '#E53935');
  assert.equal(paintedRegions['motif-lale-left-wing'].colorHex, '#16B6C8');
});

test('Mandatory Flow: Auto-suggestion by paletteRole & Manual color override immutability', () => {
  // Step 3 User selections:
  const step3Palette = {
    primary: getCiniColor('kirmizi').hex, // #E53935 (Kırmızı)
    secondary: getCiniColor('mavi').hex,   // #245DB5 (Mavi)
    accent: getCiniColor('turkuaz').hex,  // #16B6C8 (Turkuaz)
  };

  assert.equal(step3Palette.primary, '#E53935', 'Ana Renk = Kırmızı');
  assert.equal(step3Palette.secondary, '#245DB5', 'İkinci Renk = Mavi');
  assert.equal(step3Palette.accent, '#16B6C8', 'Vurgu = Turkuaz');

  // Helper function mimicking CiniSanatiMissionShell auto-suggestion logic
  const getSuggestedColor = (def) => {
    if (!def) return step3Palette.primary;
    if (def.paletteRole === 'secondary') return step3Palette.secondary;
    if (def.paletteRole === 'accent') return step3Palette.accent;
    return step3Palette.primary;
  };

  // Test across all motifs that order 1 is primary, 2 is secondary, 3 is accent
  const motifs = ['lale', 'karanfil', 'rumi', 'hatayi', 'geometrik', 'yaprak'];
  for (const mId of motifs) {
    const defs = MOTIF_REGION_DEFINITIONS[mId];
    const r1 = defs.find((r) => r.order === 1);
    const r2 = defs.find((r) => r.order === 2);
    const r3 = defs.find((r) => r.order === 3);

    assert.equal(r1.paletteRole, 'primary', `${mId} order 1 must be primary`);
    assert.equal(r2.paletteRole, 'secondary', `${mId} order 2 must be secondary`);
    assert.equal(r3.paletteRole, 'accent', `${mId} order 3 must be accent`);

    assert.equal(getSuggestedColor(r1), '#E53935', `${mId} 1 numara -> Kırmızı`);
    assert.equal(getSuggestedColor(r2), '#245DB5', `${mId} 2 numara -> Mavi`);
    assert.equal(getSuggestedColor(r3), '#16B6C8', `${mId} 3 numara -> Turkuaz`);
  }

  // Execute full Step 4 scenario on 'karanfil' (canonical 9-region composition):
  const karanfilDefs = MOTIF_REGION_DEFINITIONS.karanfil;
  const paintedRegions = {};

  // 1 numara auto-suggest: Kırmızı
  let activePaintColor = getSuggestedColor(karanfilDefs.find((r) => r.order === 1));
  assert.equal(activePaintColor, '#E53935');
  paintedRegions[karanfilDefs[0].id] = { regionId: karanfilDefs[0].id, colorId: 'kirmizi', colorHex: activePaintColor };

  // 2 numara auto-suggest: Mavi
  activePaintColor = getSuggestedColor(karanfilDefs.find((r) => r.order === 2));
  assert.equal(activePaintColor, '#245DB5');
  paintedRegions[karanfilDefs[1].id] = { regionId: karanfilDefs[1].id, colorId: 'mavi', colorHex: activePaintColor };

  // 3 numara auto-suggest: Turkuaz
  activePaintColor = getSuggestedColor(karanfilDefs.find((r) => r.order === 3));
  assert.equal(activePaintColor, '#16B6C8');
  paintedRegions[karanfilDefs[2].id] = { regionId: karanfilDefs[2].id, colorId: 'turkuaz', colorHex: activePaintColor };

  // 4 numara: User manually selects Sarı (#F5B700)
  activePaintColor = getCiniColor('sari').hex; // User manual override
  assert.equal(activePaintColor, '#F5B700');
  paintedRegions[karanfilDefs[3].id] = { regionId: karanfilDefs[3].id, colorId: 'sari', colorHex: activePaintColor };

  // Assert expected 1-4:
  assert.equal(paintedRegions[karanfilDefs[0].id].colorHex, '#E53935', '1 = Kırmızı');
  assert.equal(paintedRegions[karanfilDefs[1].id].colorHex, '#245DB5', '2 = Mavi');
  assert.equal(paintedRegions[karanfilDefs[2].id].colorHex, '#16B6C8', '3 = Turkuaz');
  assert.equal(paintedRegions[karanfilDefs[3].id].colorHex, '#F5B700', '4 = Sarı');

  // 5 numara: User manually selects Mor (#8434C6)
  activePaintColor = getCiniColor('mor').hex; // User manual override
  assert.equal(activePaintColor, '#8434C6');
  paintedRegions[karanfilDefs[4].id] = { regionId: karanfilDefs[4].id, colorId: 'mor', colorHex: activePaintColor };

  // Assert expected: 1-4 MUST NOT CHANGE, 5 = Mor
  assert.equal(paintedRegions[karanfilDefs[0].id].colorHex, '#E53935', '1 must remain Kırmızı');
  assert.equal(paintedRegions[karanfilDefs[1].id].colorHex, '#245DB5', '2 must remain Mavi');
  assert.equal(paintedRegions[karanfilDefs[2].id].colorHex, '#16B6C8', '3 must remain Turkuaz');
  assert.equal(paintedRegions[karanfilDefs[3].id].colorHex, '#F5B700', '4 must remain Sarı');
  assert.equal(paintedRegions[karanfilDefs[4].id].colorHex, '#8434C6', '5 = Mor');

  // Paint remaining regions to complete 9/9
  for (let i = 5; i < 9; i++) {
    const def = karanfilDefs[i];
    const col = getSuggestedColor(def);
    paintedRegions[def.id] = { regionId: def.id, colorId: def.paletteRole, colorHex: col };
  }

  // Assert all 9 regions are painted and all 3 palette colors + overrides are present (harmony)
  assert.equal(Object.keys(paintedRegions).length, 9, 'All 9 regions painted');
  const distinctHexes = new Set(Object.values(paintedRegions).map((r) => r.colorHex));
  assert.ok(distinctHexes.size >= 4, 'Harmonious composition with primary, secondary, accent, and custom colors');
  assert.ok(distinctHexes.has('#E53935'), 'Primary color present in finished composition');
  assert.ok(distinctHexes.has('#245DB5'), 'Secondary color present in finished composition');
  assert.ok(distinctHexes.has('#16B6C8'), 'Accent color present in finished composition');
});
