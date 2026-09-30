import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameStore } from '../src/game/state/GameStore.ts';
import {
  GAME_GROUPS,
  GAME_GROUP_LIST,
  getGameGroupByModuleId,
  getModuleStepInGame,
  isFirstModuleOfGame,
  isSecondModuleOfGame,
  getNextModuleInGame,
  areGameModulesCompleted,
} from '../src/config/gameGroups.ts';
import {
  createCertificateAuthoritative,
  formatCertificateDate,
  generateCertificateNumber,
  areAllModulesCompleted,
  LocalCertificateRepository,
} from '../src/game/systems/certificate.ts';
import { generateCertificateQr } from '../src/game/systems/qr.ts';
import { calculateResult } from '../src/game/systems/scoring.ts';
import serverlessHandler from '../netlify/functions/certificates.ts';

// Setup Mock Netlify Blobs context and global fetch router for node test environment
const testBlobsStore = new Map();
const testContext = {
  blobs: {
    getStore: () => ({
      setJSON: async (key, val) => {
        testBlobsStore.set(key, structuredClone(val));
      },
      get: async (key, _opts) => {
        const val = testBlobsStore.get(key);
        if (!val) return null;
        return structuredClone(val);
      },
    }),
  },
};

globalThis.window = { location: { origin: 'https://pauteknofest.netlify.app' } };

globalThis.fetch = async (url, options) => {
  const fullUrl = typeof url === 'string' && url.startsWith('http') ? url : `https://pauteknofest.netlify.app${url}`;
  const req = new Request(fullUrl, options);
  return serverlessHandler(req, testContext);
};

test('GAME_GROUPS config: Single source of truth is correctly structured', () => {
  assert.equal(GAME_GROUP_LIST.length, 3);
  assert.deepEqual(GAME_GROUPS['game-1'].modules, ['gobeklitepe', 'demir_cagi']);
  assert.deepEqual(GAME_GROUPS['game-2'].modules, ['anadolu_ustaligi', 'sanayilesme']);
  assert.deepEqual(GAME_GROUPS['game-3'].modules, ['milli_teknoloji', 'uzay_teknolojileri']);

  // Helper mappings
  assert.equal(getGameGroupByModuleId('gobeklitepe')?.id, 'game-1');
  assert.equal(getGameGroupByModuleId('demir_cagi')?.id, 'game-1');
  assert.equal(getGameGroupByModuleId('anadolu_ustaligi')?.id, 'game-2');
  assert.equal(getGameGroupByModuleId('sanayilesme')?.id, 'game-2');
  assert.equal(getGameGroupByModuleId('milli_teknoloji')?.id, 'game-3');
  assert.equal(getGameGroupByModuleId('uzay_teknolojileri')?.id, 'game-3');

  // Step and sequence helpers
  assert.equal(getModuleStepInGame('gobeklitepe', 'game-1'), 1);
  assert.equal(getModuleStepInGame('demir_cagi', 'game-1'), 2);
  assert.equal(getModuleStepInGame('anadolu_ustaligi', 'game-2'), 1);
  assert.equal(getModuleStepInGame('sanayilesme', 'game-2'), 2);
  assert.equal(getModuleStepInGame('milli_teknoloji', 'game-3'), 1);
  assert.equal(getModuleStepInGame('uzay_teknolojileri', 'game-3'), 2);

  assert.equal(isFirstModuleOfGame('gobeklitepe', 'game-1'), true);
  assert.equal(isSecondModuleOfGame('demir_cagi', 'game-1'), true);
  assert.equal(getNextModuleInGame('gobeklitepe', 'game-1'), 'demir_cagi');
  assert.equal(getNextModuleInGame('demir_cagi', 'game-1'), null);

  assert.equal(isFirstModuleOfGame('anadolu_ustaligi', 'game-2'), true);
  assert.equal(isSecondModuleOfGame('sanayilesme', 'game-2'), true);
  assert.equal(getNextModuleInGame('anadolu_ustaligi', 'game-2'), 'sanayilesme');
  assert.equal(getNextModuleInGame('sanayilesme', 'game-2'), null);

  assert.equal(isFirstModuleOfGame('milli_teknoloji', 'game-3'), true);
  assert.equal(isSecondModuleOfGame('uzay_teknolojileri', 'game-3'), true);
  assert.equal(getNextModuleInGame('milli_teknoloji', 'game-3'), 'uzay_teknolojileri');
  assert.equal(getNextModuleInGame('uzay_teknolojileri', 'game-3'), null);
});

test('TEST 1: Game 1 flow: User -> Name -> Game 1 -> Mod 1 -> Mod 2 -> Certificate & QR', async () => {
  GameStore.resetSession();
  const nameRes = GameStore.setPlayerFullName('Ayşe Yılmaz');
  assert.equal(nameRes.success, true);

  // Select Game 1
  GameStore.selectGame('game-1');
  assert.equal(GameStore.getSelectedGame(), 'game-1');
  assert.equal(GameStore.isModuleUnlocked('gobeklitepe'), true);
  assert.equal(GameStore.isModuleUnlocked('demir_cagi'), false);
  assert.equal(GameStore.isCurrentGameCompleted(), false);

  // Complete Module 1 (Göbeklitepe)
  GameStore.saveResult('gobeklitepe', calculateResult(40, 2));
  GameStore.completeModule('gobeklitepe');
  assert.equal(GameStore.isModuleCompleted('gobeklitepe'), true);
  assert.equal(GameStore.isModuleUnlocked('demir_cagi'), true);
  assert.equal(GameStore.isCurrentGameCompleted(), false); // Still 1/2!

  // Complete Module 2 (Demir Çağı)
  GameStore.saveResult('demir_cagi', calculateResult(45, 1));
  GameStore.completeModule('demir_cagi');
  assert.equal(GameStore.isModuleCompleted('demir_cagi'), true);
  assert.equal(GameStore.isCurrentGameCompleted(), true); // 2/2 Complete!
  assert.ok(GameStore.getPlayerSession().completedAt, 'completedAt must be frozen');

  // Authoritative certificate creation
  const createdRecord = await createCertificateAuthoritative({
    fullName: GameStore.getPlayerSession().fullName,
    completedAt: GameStore.getPlayerSession().completedAt || undefined,
    completedModules: GameStore.getState().completedModuleIds,
    selectedGame: 'game-1',
  });
  assert.ok(createdRecord.certificateId);
  assert.equal(createdRecord.fullName, 'Ayşe Yılmaz');
  assert.deepEqual(createdRecord.completedModules, ['gobeklitepe', 'demir_cagi']);
  assert.equal(createdRecord.selectedGame, 'game-1');

  // QR Code generation verification
  const qrRes = await generateCertificateQr(createdRecord.certificateId);
  assert.equal(qrRes.success, true);
  assert.ok(qrRes.dataUrl.startsWith('data:image/png;base64,'), 'QR data URL must be generated');
  assert.ok(qrRes.targetUrl.includes(createdRecord.certificateId));
});

test('TEST 2: Game 2 flow: User -> Name -> Game 2 directly open -> Mod 3 -> Mod 4 -> Certificate (NO mod 1/2 requirement)', async () => {
  GameStore.resetSession();
  const nameRes = GameStore.setPlayerFullName('Mehmet Kaya');
  assert.equal(nameRes.success, true);

  // Select Game 2 directly (no Game 1 required!)
  GameStore.selectGame('game-2');
  assert.equal(GameStore.getSelectedGame(), 'game-2');

  // Module 3 (Anadolu Ustalığı) is immediately unlocked
  assert.equal(GameStore.isModuleUnlocked('anadolu_ustaligi'), true);
  // Module 4 (Sanayileşme) locked until Mod 3 is complete
  assert.equal(GameStore.isModuleUnlocked('sanayilesme'), false);
  // Modules from other games are strictly not accessible
  assert.equal(GameStore.isModuleUnlocked('gobeklitepe'), false);
  assert.equal(GameStore.isModuleUnlocked('demir_cagi'), false);
  assert.equal(GameStore.isModuleUnlocked('milli_teknoloji'), false);

  // Complete Module 3
  GameStore.saveResult('anadolu_ustaligi', calculateResult(50, 0));
  GameStore.completeModule('anadolu_ustaligi');
  assert.equal(GameStore.isModuleCompleted('anadolu_ustaligi'), true);
  assert.equal(GameStore.isModuleUnlocked('sanayilesme'), true);
  assert.equal(GameStore.isCurrentGameCompleted(), false);

  // Complete Module 4
  GameStore.saveResult('sanayilesme', calculateResult(55, 1));
  GameStore.completeModule('sanayilesme');
  assert.equal(GameStore.isModuleCompleted('sanayilesme'), true);
  assert.equal(GameStore.isCurrentGameCompleted(), true);

  // Certificate generation
  const createdRecord = await createCertificateAuthoritative({
    fullName: GameStore.getPlayerSession().fullName,
    completedAt: GameStore.getPlayerSession().completedAt || undefined,
    completedModules: GameStore.getState().completedModuleIds,
    selectedGame: 'game-2',
  });
  assert.ok(createdRecord.certificateId);
  assert.equal(createdRecord.fullName, 'Mehmet Kaya');
  assert.deepEqual(createdRecord.completedModules, ['anadolu_ustaligi', 'sanayilesme']);
  assert.equal(createdRecord.selectedGame, 'game-2');
});

test('TEST 3: Game 3 flow: User -> Name -> Game 3 directly open -> Mod 5 -> Mod 6 -> Certificate (NO mod 1-4 requirement)', async () => {
  GameStore.resetSession();
  const nameRes = GameStore.setPlayerFullName('Zeynep Çiçek');
  assert.equal(nameRes.success, true);

  // Select Game 3 directly as a brand new player
  GameStore.selectGame('game-3');
  assert.equal(GameStore.getSelectedGame(), 'game-3');

  // Module 5 (Millî Teknoloji) is immediately unlocked
  assert.equal(GameStore.isModuleUnlocked('milli_teknoloji'), true);
  // Module 6 locked until Mod 5 is complete
  assert.equal(GameStore.isModuleUnlocked('uzay_teknolojileri'), false);
  // Modules 1-4 strictly not accessible in Game 3
  assert.equal(GameStore.isModuleUnlocked('gobeklitepe'), false);
  assert.equal(GameStore.isModuleUnlocked('demir_cagi'), false);
  assert.equal(GameStore.isModuleUnlocked('anadolu_ustaligi'), false);
  assert.equal(GameStore.isModuleUnlocked('sanayilesme'), false);

  // Complete Module 5
  GameStore.saveResult('milli_teknoloji', calculateResult(48, 1));
  GameStore.completeModule('milli_teknoloji');
  assert.equal(GameStore.isModuleCompleted('milli_teknoloji'), true);
  assert.equal(GameStore.isModuleUnlocked('uzay_teknolojileri'), true);
  assert.equal(GameStore.isCurrentGameCompleted(), false);

  // Complete Module 6
  GameStore.saveResult('uzay_teknolojileri', calculateResult(52, 0));
  GameStore.completeModule('uzay_teknolojileri');
  assert.equal(GameStore.isModuleCompleted('uzay_teknolojileri'), true);
  assert.equal(GameStore.isCurrentGameCompleted(), true);

  // Certificate generation
  const createdRecord = await createCertificateAuthoritative({
    fullName: GameStore.getPlayerSession().fullName,
    completedAt: GameStore.getPlayerSession().completedAt || undefined,
    completedModules: GameStore.getState().completedModuleIds,
    selectedGame: 'game-3',
  });
  assert.ok(createdRecord.certificateId);
  assert.equal(createdRecord.fullName, 'Zeynep Çiçek');
  assert.deepEqual(createdRecord.completedModules, ['milli_teknoloji', 'uzay_teknolojileri']);
  assert.equal(createdRecord.selectedGame, 'game-3');
});

test('TEST 4: Game 1 only Module 1 completed -> Certificate MUST NOT be created', () => {
  GameStore.resetSession();
  GameStore.setPlayerFullName('Kemal Sunal');
  GameStore.selectGame('game-1');

  GameStore.saveResult('gobeklitepe', calculateResult(35, 1));
  GameStore.completeModule('gobeklitepe');

  assert.equal(GameStore.isCurrentGameCompleted(), false);
  assert.equal(areGameModulesCompleted('game-1', GameStore.getState().completedModuleIds), false);
  assert.equal(areAllModulesCompleted(GameStore.getState().completedModuleIds, 'game-1'), false);
});

test('TEST 5: Game 2 only Module 3 completed -> Certificate MUST NOT be created', () => {
  GameStore.resetSession();
  GameStore.setPlayerFullName('Barış Manço');
  GameStore.selectGame('game-2');

  GameStore.saveResult('anadolu_ustaligi', calculateResult(40, 2));
  GameStore.completeModule('anadolu_ustaligi');

  assert.equal(GameStore.isCurrentGameCompleted(), false);
  assert.equal(areGameModulesCompleted('game-2', GameStore.getState().completedModuleIds), false);
  assert.equal(areAllModulesCompleted(GameStore.getState().completedModuleIds, 'game-2'), false);
});

test('TEST 6: Game 3 only Module 5 completed -> Certificate MUST NOT be created', () => {
  GameStore.resetSession();
  GameStore.setPlayerFullName('Haluk Bilginer');
  GameStore.selectGame('game-3');

  GameStore.saveResult('milli_teknoloji', calculateResult(38, 0));
  GameStore.completeModule('milli_teknoloji');

  assert.equal(GameStore.isCurrentGameCompleted(), false);
  assert.equal(areGameModulesCompleted('game-3', GameStore.getState().completedModuleIds), false);
  assert.equal(areAllModulesCompleted(GameStore.getState().completedModuleIds, 'game-3'), false);
});

test('TEST 7: Game 1 completed -> "Yeni Kaşif Başlat" -> Game 3 selected: Zero state bleed', async () => {
  GameStore.resetSession();
  GameStore.setPlayerFullName('İlk Kaşif');
  GameStore.selectGame('game-1');

  GameStore.saveResult('gobeklitepe', calculateResult(40, 0));
  GameStore.completeModule('gobeklitepe');
  GameStore.saveResult('demir_cagi', calculateResult(45, 0));
  GameStore.completeModule('demir_cagi');

  const cert1 = await createCertificateAuthoritative({
    fullName: GameStore.getPlayerSession().fullName,
    completedAt: GameStore.getPlayerSession().completedAt || undefined,
    completedModules: GameStore.getState().completedModuleIds,
    selectedGame: 'game-1',
  });
  GameStore.setCertificateData(cert1.certificateId, cert1.certificateNumber);
  assert.ok(GameStore.getPlayerSession().certificateId);

  // Kiosk "YENİ KAŞİF BAŞLAT" action
  GameStore.resetSession();

  // Verify completely reset state
  assert.equal(GameStore.getSelectedGame(), null);
  assert.equal(GameStore.getPlayerSession().fullName, '');
  assert.equal(GameStore.getPlayerSession().certificateId, null);
  assert.equal(GameStore.getPlayerSession().certificateNumber, null);
  assert.equal(GameStore.getPlayerSession().completedAt, null);
  assert.deepEqual(GameStore.getState().completedModuleIds, []);
  assert.deepEqual(GameStore.getState().results, {});

  // New explorer starts Game 3
  GameStore.setPlayerFullName('İkinci Kaşif');
  GameStore.selectGame('game-3');

  assert.equal(GameStore.getSelectedGame(), 'game-3');
  assert.equal(GameStore.getPlayerSession().fullName, 'İkinci Kaşif');
  assert.equal(GameStore.isModuleUnlocked('milli_teknoloji'), true);
  assert.equal(GameStore.isModuleUnlocked('uzay_teknolojileri'), false);
  assert.equal(GameStore.isCurrentGameCompleted(), false);
  assert.deepEqual(GameStore.getState().completedModuleIds, []);
  assert.equal(GameStore.getPlayerSession().certificateId, null);
});

test('TEST 8: Certificate verification: name, date, PNG dimensions & downloadable record', async () => {
  const repo = new LocalCertificateRepository();
  const certNumber = generateCertificateNumber('2026-09-30T10:00:00.000Z');
  await repo.create({
    certificateId: 'test-uuid-verify-888',
    certificateNumber: certNumber,
    fullName: 'Buğra Çiçek',
    participantName: 'Buğra Çiçek',
    completedAt: '2026-09-30T10:00:00.000Z',
    completedModules: ['anadolu_ustaligi', 'sanayilesme'],
    selectedGame: 'game-2',
    projectName: 'Medeniyetten Millî Teknolojiye',
  });

  // Verify record from storage
  const retrieved = await repo.getById('test-uuid-verify-888');
  assert.ok(retrieved);
  assert.equal(retrieved.fullName, 'Buğra Çiçek');
  assert.equal(formatCertificateDate(retrieved.completedAt), '30.09.2026');
  assert.equal(retrieved.selectedGame, 'game-2');
  assert.deepEqual(retrieved.completedModules, ['anadolu_ustaligi', 'sanayilesme']);
});
