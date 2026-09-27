import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { GameStore } from '../src/game/state/GameStore.ts';
import { calculateResult } from '../src/game/systems/scoring.ts';
import {
  getCertificatePublicUrl,
  REQUIRED_MODULE_IDS,
} from '../src/game/systems/certificate.ts';
import { DEV_CONFIG } from '../src/config/devConfig.ts';
import { handler as serverlessHandler } from '../netlify/functions/certificates.ts';

test('Production Config: DEV_UNLOCK_ALL_LEVELS must be false', () => {
  assert.equal(DEV_CONFIG.DEV_UNLOCK_ALL_LEVELS, false, 'DEV_UNLOCK_ALL_LEVELS must be false in production');
});

test('Final Comprehensive E2E Flow: Step 1 to 28 with TEST KAŞİF', async () => {
  // Step 1: Start New Game with TEST KAŞİF
  const initResult = GameStore.startNewGame('TEST KAŞİF');
  assert.equal(initResult.success, true);
  assert.equal(initResult.cleanedName, 'TEST KAŞİF');
  assert.equal(GameStore.getPlayerSession().fullName, 'TEST KAŞİF');

  // Step 2 & 3: Only Module 1 is unlocked; Modules 2 through 6 are locked
  assert.equal(GameStore.isModuleUnlocked('gobeklitepe'), true, 'Module 1 (Göbeklitepe) must be unlocked');
  assert.equal(GameStore.isModuleUnlocked('demir_cagi'), false, 'Module 2 must be locked');
  assert.equal(GameStore.isModuleUnlocked('anadolu_ustaligi'), false, 'Module 3 must be locked');
  assert.equal(GameStore.isModuleUnlocked('sanayilesme'), false, 'Module 4 must be locked');
  assert.equal(GameStore.isModuleUnlocked('milli_teknoloji'), false, 'Module 5 must be locked');
  assert.equal(GameStore.isModuleUnlocked('uzay_teknolojileri'), false, 'Module 6 must be locked');
  assert.deepEqual(GameStore.getState().unlockedModuleIds, ['gobeklitepe']);

  // Step 4: Access to locked module cannot complete out of order
  GameStore.completeModule('uzay_teknolojileri');
  assert.equal(GameStore.isModuleCompleted('uzay_teknolojileri'), false, 'Locked module 6 cannot be completed');
  GameStore.completeModule('demir_cagi');
  assert.equal(GameStore.isModuleCompleted('demir_cagi'), false, 'Locked module 2 cannot be completed');

  // Step 5 & 6: Play and complete Module 1 -> Module 2 unlocks
  GameStore.saveResult('gobeklitepe', calculateResult(40, 1));
  assert.equal(GameStore.isModuleCompleted('gobeklitepe'), true);
  assert.equal(GameStore.isModuleUnlocked('demir_cagi'), true, 'Module 2 must unlock after module 1 completes');
  assert.equal(GameStore.isModuleUnlocked('anadolu_ustaligi'), false, 'Module 3 must remain locked');

  // Step 7 & 8: Play and complete Module 2 -> Module 3 unlocks
  GameStore.saveResult('demir_cagi', calculateResult(45, 0));
  assert.equal(GameStore.isModuleCompleted('demir_cagi'), true);
  assert.equal(GameStore.isModuleUnlocked('anadolu_ustaligi'), true, 'Module 3 must unlock after module 2 completes');
  assert.equal(GameStore.isModuleUnlocked('sanayilesme'), false, 'Module 4 must remain locked');

  // Step 9: Play and complete Module 3 -> Module 4 unlocks
  GameStore.saveResult('anadolu_ustaligi', calculateResult(50, 0));
  assert.equal(GameStore.isModuleCompleted('anadolu_ustaligi'), true);
  assert.equal(GameStore.isModuleUnlocked('sanayilesme'), true, 'Module 4 must unlock after module 3 completes');
  assert.equal(GameStore.isModuleUnlocked('milli_teknoloji'), false, 'Module 5 must remain locked');

  // Play and complete Module 4 -> Module 5 unlocks
  GameStore.saveResult('sanayilesme', calculateResult(55, 0));
  assert.equal(GameStore.isModuleCompleted('sanayilesme'), true);
  assert.equal(GameStore.isModuleUnlocked('milli_teknoloji'), true, 'Module 5 must unlock after module 4 completes');
  assert.equal(GameStore.isModuleUnlocked('uzay_teknolojileri'), false, 'Module 6 must remain locked');

  // Step 10: Play and complete Module 5 -> Verify NO certificate is eligible yet!
  GameStore.saveResult('milli_teknoloji', calculateResult(60, 0));
  assert.equal(GameStore.isModuleCompleted('milli_teknoloji'), true);
  assert.equal(GameStore.isModuleUnlocked('uzay_teknolojileri'), true, 'Module 6 must unlock after module 5 completes');
  assert.equal(GameStore.isAllModulesCompleted(), false, 'Certificate must NOT be eligible after Module 5');
  assert.equal(GameStore.getPlayerSession().certificateId, null);

  // Step 11, 12 & 13: Complete Module 6 (Final stage)
  GameStore.saveResult('uzay_teknolojileri', calculateResult(50, 0));
  assert.equal(GameStore.isModuleCompleted('uzay_teknolojileri'), true);
  assert.equal(GameStore.isAllModulesCompleted(), true, 'All 6 modules must now be completed!');

  // Step 14 & 15: Create Certificate via backend API
  const participantName = GameStore.getPlayerSession().fullName;
  assert.equal(participantName, 'TEST KAŞİF');

  const createReq = new Request('https://pauteknofest.netlify.app/api/certificates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: participantName,
      completedModules: [...REQUIRED_MODULE_IDS],
      completedAt: new Date().toISOString(),
      projectName: 'Medeniyetten Millî Teknolojiye',
    }),
  });

  const createRes = await serverlessHandler(createReq);
  assert.equal(createRes.status, 201);
  const createBody = await createRes.json();
  assert.equal(createBody.success, true);
  const certRecord = createBody.certificate;
  assert.ok(certRecord.certificateId);
  assert.equal(certRecord.fullName, 'TEST KAŞİF');
  assert.match(certRecord.certificateNumber, /^PAU-TKF-2026-[A-Z0-9]{6}$/);

  // Update GameStore with issued certificate data
  GameStore.setCertificateData(certRecord.certificateId, certRecord.certificateNumber);
  assert.equal(GameStore.getPlayerSession().certificateId, certRecord.certificateId);

  // Step 16 & 17: Generate Public URL for QR (Strictly NO localhost)
  const originalWindow = globalThis.window;
  try {
    globalThis.window = { location: { origin: 'https://pauteknofest.netlify.app' } };
    const publicUrlRes = getCertificatePublicUrl(certRecord.certificateId);
    assert.equal(publicUrlRes.error, undefined);
    assert.equal(publicUrlRes.url, `https://pauteknofest.netlify.app/certificate/${certRecord.certificateId}`);
    assert.doesNotMatch(publicUrlRes.url, /localhost|127\.0\.0\.1/);
  } finally {
    globalThis.window = originalWindow;
  }

  // Step 18, 19 & 20: Mobile Scan simulation without kiosk localStorage
  const mobileGetReq = new Request(`https://pauteknofest.netlify.app/api/certificates/${certRecord.certificateId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  const mobileGetRes = await serverlessHandler(mobileGetReq);
  assert.equal(mobileGetRes.status, 200);
  const mobileCertBody = await mobileGetRes.json();
  assert.equal(mobileCertBody.success, true);
  const mobileCert = mobileCertBody.certificate;
  assert.equal(mobileCert.certificateId, certRecord.certificateId);
  assert.equal(mobileCert.fullName, 'TEST KAŞİF');

  // Step 21 & 22: Master PNG template & name positioning
  const masterWidth = 3730;
  const masterHeight = 2635;
  const expectedNameX = Math.round(masterWidth * 0.6244);
  const expectedNameY = Math.round(masterHeight * 0.512);
  assert.equal(expectedNameX, 2329);
  assert.equal(expectedNameY, 1349);

  // Step 23, 24, 25 & 26: Physical Master Asset Verification
  const publicAssetPath = path.resolve('public/assets/certificate_base.png');
  const srcAssetPath = path.resolve('src/assets/certificate_base.png');

  assert.ok(fs.existsSync(publicAssetPath), 'public/assets/certificate_base.png must exist');
  assert.ok(fs.existsSync(srcAssetPath), 'src/assets/certificate_base.png must exist');

  function getPngDimensions(filePath) {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(24);
    fs.readSync(fd, buffer, 0, 24, 0);
    fs.closeSync(fd);
    assert.equal(buffer[0], 0x89);
    assert.equal(buffer[1], 0x50);
    assert.equal(buffer[2], 0x4e);
    assert.equal(buffer[3], 0x47);
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  const dims = getPngDimensions(publicAssetPath);
  assert.equal(dims.width, 3730);
  assert.equal(dims.height, 2635);

  // Step 27 & 28: YENİ KAŞİF BAŞLAT
  // Reset kiosk session for a new explorer
  GameStore.resetSession();
  assert.equal(GameStore.getPlayerSession().fullName, '');
  assert.equal(GameStore.getPlayerSession().certificateId, null);
  assert.deepEqual(GameStore.getState().completedModuleIds, []);
  assert.deepEqual(GameStore.getState().unlockedModuleIds, ['gobeklitepe']);
  assert.equal(GameStore.isModuleUnlocked('gobeklitepe'), true);
  assert.equal(GameStore.isModuleUnlocked('demir_cagi'), false);

  // Verify that previous certificate record on backend is NOT deleted!
  const verifyOldReq = new Request(`https://pauteknofest.netlify.app/api/certificates/${certRecord.certificateId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  const verifyOldRes = await serverlessHandler(verifyOldReq);
  assert.equal(verifyOldRes.status, 200, 'Previous certificate must remain available on backend');
  const verifiedOldBody = await verifyOldRes.json();
  assert.equal(verifiedOldBody.success, true);
  const verifiedOld = verifiedOldBody.certificate;
  assert.equal(verifiedOld.fullName, 'TEST KAŞİF');
});
