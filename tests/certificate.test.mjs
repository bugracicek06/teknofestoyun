import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAndCleanFullName,
  generateCertificateNumber,
  generateCertificateId,
  formatCertificateDate,
  areAllModulesCompleted,
  REQUIRED_MODULE_IDS,
  LocalCertificateRepository,
} from '../src/game/systems/certificate.ts';
import { GameStore } from '../src/game/state/GameStore.ts';

test('Name validation: trims whitespace and collapses multi-spaces', () => {
  const res1 = validateAndCleanFullName('   Ahmet    Yılmaz   ');
  assert.equal(res1.isValid, true);
  assert.equal(res1.cleanedName, 'Ahmet Yılmaz');

  const res2 = validateAndCleanFullName('\tFatma   Zehra \n Kaya  ');
  assert.equal(res2.isValid, true);
  assert.equal(res2.cleanedName, 'Fatma Zehra Kaya');
});

test('Name validation: supports all Turkish characters seamlessly', () => {
  const turkishNames = [
    'Çağrı Şahin Çığ Öztürk',
    'İpek Yağmur Gökçe',
    'şükrü özdemir',
    'Ömer Faruk Işık',
  ];

  for (const name of turkishNames) {
    const res = validateAndCleanFullName(name);
    assert.equal(res.isValid, true, `Failed on: ${name}`);
    assert.equal(res.cleanedName, name);
  }
});

test('Name validation: rejects empty, whitespace-only, or invalid length names', () => {
  assert.equal(validateAndCleanFullName('').isValid, false);
  assert.equal(validateAndCleanFullName('    ').isValid, false);
  assert.equal(validateAndCleanFullName('A').isValid, false);
  assert.equal(validateAndCleanFullName('A'.repeat(55)).isValid, false);
});

test('Canonical Module IDs: matches required 6 modules exactly', () => {
  assert.deepEqual(REQUIRED_MODULE_IDS, [
    'gobeklitepe',
    'demir_cagi',
    'anadolu_ustaligi',
    'sanayilesme',
    'milli_teknoloji',
    'uzay_teknolojileri',
  ]);

  assert.equal(areAllModulesCompleted(['gobeklitepe', 'demir_cagi']), false);
  assert.equal(areAllModulesCompleted([
    'gobeklitepe',
    'demir_cagi',
    'anadolu_ustaligi',
    'sanayilesme',
    'milli_teknoloji',
  ]), false);

  assert.equal(areAllModulesCompleted([
    'gobeklitepe',
    'demir_cagi',
    'anadolu_ustaligi',
    'sanayilesme',
    'milli_teknoloji',
    'uzay_teknolojileri',
  ]), true);
});

test('Certificate Number: extracts dynamic year from completedAt and generates unique code', () => {
  const certNum2026 = generateCertificateNumber('2026-09-18T10:30:00.000Z');
  assert.match(certNum2026, /^PAU-TKF-2026-[A-Z0-9]{6}$/);

  const certNum2027 = generateCertificateNumber('2027-05-19T14:00:00.000Z');
  assert.match(certNum2027, /^PAU-TKF-2027-[A-Z0-9]{6}$/);

  const certNum2028 = generateCertificateNumber('2028-10-29T18:45:00.000Z');
  assert.match(certNum2028, /^PAU-TKF-2028-[A-Z0-9]{6}$/);

  // Uniqueness check
  const set = new Set();
  for (let i = 0; i < 50; i++) {
    set.add(generateCertificateNumber('2026-09-18T10:00:00.000Z'));
  }
  assert.equal(set.size, 50);
});

test('Certificate Date: formats ISO timestamp to Turkish DD.MM.YYYY format', () => {
  const formatted = formatCertificateDate('2026-09-18T12:00:00.000Z');
  assert.equal(formatted, '18.09.2026');
});

test('GameStore: Player session initialization, validation, and kiosk reset', () => {
  GameStore.resetSession();
  assert.equal(GameStore.getPlayerSession().fullName, '');
  assert.equal(GameStore.isAllModulesCompleted(), false);

  const setResult = GameStore.setPlayerFullName('   Ahmet   Yılmaz  ');
  assert.equal(setResult.success, true);
  assert.equal(setResult.cleanedName, 'Ahmet Yılmaz');
  assert.equal(GameStore.getPlayerSession().fullName, 'Ahmet Yılmaz');

  // Complete modules step by step
  for (const modId of REQUIRED_MODULE_IDS) {
    GameStore.unlockModule(modId);
    GameStore.completeModule(modId);
  }

  assert.equal(GameStore.isAllModulesCompleted(), true);
  assert.notEqual(GameStore.getPlayerSession().completedAt, null);

  // Kiosk reset
  GameStore.resetSession();
  assert.equal(GameStore.getPlayerSession().fullName, '');
  assert.equal(GameStore.getPlayerSession().completedAt, null);
  assert.equal(GameStore.getPlayerSession().completedModules.length, 0);
  assert.equal(GameStore.getState().completedModuleIds.length, 0);
  assert.deepEqual(GameStore.getState().unlockedModuleIds, ['gobeklitepe']);
});

test('LocalCertificateRepository: create and retrieve certificate record', async () => {
  const repo = new LocalCertificateRepository();
  const id = generateCertificateId();
  const record = {
    certificateId: id,
    certificateNumber: generateCertificateNumber('2026-09-18T10:00:00.000Z'),
    fullName: 'Ahmet Yılmaz',
    completedAt: '2026-09-18T10:00:00.000Z',
    completedModules: [...REQUIRED_MODULE_IDS],
    projectName: 'Medeniyetten Millî Teknolojiye',
  };

  const created = await repo.create(record);
  assert.equal(created.certificateId, id);

  const fetched = await repo.getById(id);
  assert.deepEqual(fetched, record);

  const notFound = await repo.getById('non-existent-uuid');
  assert.equal(notFound, null);
});
