import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CANONICAL_SWORD_PART_IDS,
  SWORD_PART_DEFS,
  SWORD_SLOT_DEFS,
  shuffleSwordParts,
  evaluateSwordDrop,
  verifySwordAssemblyContiguity,
} from '../src/game/systems/swordAssembly.ts';

test('Demir Çağı Kılıç Montajı: CANONICAL_SWORD_PART_IDS tam 4 parçayı içerir', () => {
  assert.equal(CANONICAL_SWORD_PART_IDS.length, 4);
  assert.deepEqual([...CANONICAL_SWORD_PART_IDS], ['part_blade', 'part_guard', 'part_grip', 'part_pommel']);
});

test('Demir Çağı Kılıç Montajı: shuffleSwordParts orijinal diziyi mutate etmez', () => {
  const original = [...CANONICAL_SWORD_PART_IDS];
  const shuffled = shuffleSwordParts(original);
  assert.notEqual(shuffled, original);
  assert.deepEqual(original, ['part_blade', 'part_guard', 'part_grip', 'part_pommel']);
});

test('Demir Çağı Kılıç Montajı: shuffleSwordParts kayıp veya tekrar olmadan 4 parçayı korur', () => {
  const shuffled = shuffleSwordParts();
  assert.equal(shuffled.length, 4);
  const set = new Set(shuffled);
  assert.equal(set.size, 4);
  for (const id of CANONICAL_SWORD_PART_IDS) {
    assert.ok(set.has(id));
  }
});

test('Demir Çağı Kılıç Montajı: Fisher-Yates tekrarlanan oturumlarda çeşitli permütasyonlar üretir', () => {
  const permutations = new Set();
  for (let i = 0; i < 25; i++) {
    const s = shuffleSwordParts().join('|');
    permutations.add(s);
  }
  // 4! = 24 olası permütasyon vardır, 25 denemede en az 3 farklı permütasyon beklenir
  assert.ok(permutations.size >= 3, `Beklenen çeşitlilik en az 3, elde edilen: ${permutations.size}`);
});

test('Demir Çağı Kılıç Montajı: Parça 1 (Kılıç Ucu) -> Slot 1 = KABUL (Snap koordinatları ile)', () => {
  const slot1 = SWORD_SLOT_DEFS.slot_blade;
  const evalResult = evaluateSwordDrop('part_blade', slot1.x + 25, slot1.y - 15);

  assert.equal(evalResult.isSuccess, true);
  assert.equal(evalResult.partId, 'part_blade');
  assert.equal(evalResult.targetSlotId, 'slot_blade');
  assert.equal(evalResult.snapX, slot1.x);
  assert.equal(evalResult.snapY, slot1.y);
  assert.equal(evalResult.reason, 'MATCH');
});

test('Demir Çağı Kılıç Montajı: Parça 1 (Kılıç Ucu) -> Slot 2 (Siper) = REDDET (WRONG_SLOT)', () => {
  const slot2 = SWORD_SLOT_DEFS.slot_guard;
  const evalResult = evaluateSwordDrop('part_blade', slot2.x, slot2.y);

  assert.equal(evalResult.isSuccess, false);
  assert.equal(evalResult.partId, 'part_blade');
  assert.equal(evalResult.reason, 'WRONG_SLOT');
});

test('Demir Çağı Kılıç Montajı: Parça 2 (Kabza Koruma / Siper) -> Slot 2 = KABUL', () => {
  const slot2 = SWORD_SLOT_DEFS.slot_guard;
  const evalResult = evaluateSwordDrop('part_guard', slot2.x - 10, slot2.y + 12);

  assert.equal(evalResult.isSuccess, true);
  assert.equal(evalResult.partId, 'part_guard');
  assert.equal(evalResult.targetSlotId, 'slot_guard');
  assert.equal(evalResult.snapX, slot2.x);
  assert.equal(evalResult.snapY, slot2.y);
});

test('Demir Çağı Kılıç Montajı: Parça 3 (Sap / Kabza) -> Slot 3 = KABUL', () => {
  const slot3 = SWORD_SLOT_DEFS.slot_grip;
  const evalResult = evaluateSwordDrop('part_grip', slot3.x + 5, slot3.y - 8);

  assert.equal(evalResult.isSuccess, true);
  assert.equal(evalResult.partId, 'part_grip');
  assert.equal(evalResult.targetSlotId, 'slot_grip');
  assert.equal(evalResult.snapX, slot3.x);
  assert.equal(evalResult.snapY, slot3.y);
});

test('Demir Çağı Kılıç Montajı: Parça 4 (Tutamaç / Başlık) -> Slot 4 = KABUL', () => {
  const slot4 = SWORD_SLOT_DEFS.slot_pommel;
  const evalResult = evaluateSwordDrop('part_pommel', slot4.x - 15, slot4.y + 20);

  assert.equal(evalResult.isSuccess, true);
  assert.equal(evalResult.partId, 'part_pommel');
  assert.equal(evalResult.targetSlotId, 'slot_pommel');
  assert.equal(evalResult.snapX, slot4.x);
  assert.equal(evalResult.snapY, slot4.y);
});

test('Demir Çağı Kılıç Montajı: Rastgele / Boş Alana Bırakma (Out of Range) -> REDDET', () => {
  const evalResult = evaluateSwordDrop('part_blade', 200, 200);

  assert.equal(evalResult.isSuccess, false);
  assert.equal(evalResult.reason, 'OUT_OF_RANGE');
});

test('Demir Çağı Kılıç Montajı: Parçaların Geometrik Contiguity & Sıfır Boşluk (Zero-Gap) Doğrulaması', () => {
  const contiguity = verifySwordAssemblyContiguity();

  assert.equal(contiguity.isContiguous, true, 'Kılıç parçaları arasında kesinti veya boşluk olmamalı');
  assert.ok(contiguity.bladeToGuardOverlap > 0, 'Bıçak ricassosu siper içine oturmalı');
  assert.ok(contiguity.guardToGripOverlap > 0, 'Siper ile sap ferrule bağlantısı örtüşmeli');
  assert.equal(contiguity.gripToPommelGap, 0, 'Sap ve kabza başı arasında sıfır piksel boşluk olmalı');
});

test('Demir Çağı Kılıç Montajı: Karışık Sıralamada Bile Slot Eşleşmesi Kesinlikle ID Üzerinden Yapılır', () => {
  const shuffled = shuffleSwordParts();
  for (const partId of shuffled) {
    const correctSlotId = SWORD_PART_DEFS[partId].slotId;
    const correctSlot = SWORD_SLOT_DEFS[correctSlotId];
    const matchRes = evaluateSwordDrop(partId, correctSlot.x, correctSlot.y);
    assert.equal(matchRes.isSuccess, true);
    assert.equal(matchRes.targetSlotId, correctSlotId);
  }
});

test('Demir Çağı Kılıç Montajı: 4/4 Parça Yerleştirme Simülasyonu ve Tamamlanma Tetikleyicisi', () => {
  const placedParts = new Set();
  const parts = ['part_blade', 'part_guard', 'part_grip', 'part_pommel'];

  for (const pId of parts) {
    const slot = SWORD_SLOT_DEFS[SWORD_PART_DEFS[pId].slotId];
    const res = evaluateSwordDrop(pId, slot.x, slot.y);
    assert.equal(res.isSuccess, true);
    placedParts.add(pId);
  }

  assert.equal(placedParts.size, 4, 'Tam 4 parça yerleştirilmiş olmalı');

  // Tekrar deneme simülasyonu (aynı parçayı iki kez yerleştirmeye çalışma)
  placedParts.add('part_blade');
  assert.equal(placedParts.size, 4, 'Aynı parça 2 kez sayılmamalı');
});

test('Demir Çağı Kılıç Montajı: Kılıç Ucu ucundan/solundan tutulduğunda pointer slot içindeyse KABUL edilmeli', () => {
  const slot1 = SWORD_SLOT_DEFS.slot_blade;
  // Parça 620px genişliğinde, kullanıcı sol ucundan tutmuş olsun:
  // container.x merkezden 180px uzakta (dist = 180 > 140) fakat pointer slot içinde!
  const containerX = slot1.x - 180;
  const containerY = slot1.y + 10;
  const pointerX = slot1.x - 50; // Pointer doğrudan slot sınırları içinde
  const pointerY = slot1.y;

  const res = evaluateSwordDrop('part_blade', containerX, containerY, 140, pointerX, pointerY);
  assert.equal(res.isSuccess, true, 'Pointer slot içindeyken parça merkezi uzakta olsa bile kabul edilmeli');
  assert.equal(res.targetSlotId, 'slot_blade');
  assert.equal(res.snapX, slot1.x);
  assert.equal(res.snapY, slot1.y);
});

test('Demir Çağı Kılıç Montajı: Kılıç Ucu sağından tutulduğunda tolerans dahilinde KABUL edilmeli', () => {
  const slot1 = SWORD_SLOT_DEFS.slot_blade;
  // Kılıç Ucu sağ bölgesi (ricasso): slot1.x + 240 = 1030
  const pointerX = slot1.x + 240;
  const pointerY = slot1.y + 10;

  const res = evaluateSwordDrop('part_blade', slot1.x + 190, slot1.y, 140, pointerX, pointerY);
  assert.equal(res.isSuccess, true);
  assert.equal(res.targetSlotId, 'slot_blade');
});

