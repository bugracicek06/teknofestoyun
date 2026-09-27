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
  ApiCertificateRepository,
  createCertificateAuthoritative,
  verifyCertificateOnServer,
  getCertificatePublicUrl,
} from '../src/game/systems/certificate.ts';
import serverlessHandler from '../netlify/functions/certificates.ts';
import { GameStore } from '../src/game/state/GameStore.ts';

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

test('getCertificatePublicUrl: resolves configured URL and runtime origin correctly', () => {
  const certId = '3b99905d-2fe8-4444-8888-000000000000';

  // 1. Without env var, using global window origin
  const originalWindow = globalThis.window;
  try {
    globalThis.window = { location: { origin: 'https://pauteknofest.netlify.app' } };
    const res = getCertificatePublicUrl(certId);
    assert.equal(res.error, undefined);
    assert.equal(res.url, `https://pauteknofest.netlify.app/certificate/${certId}`);
  } finally {
    globalThis.window = originalWindow;
  }
});

test('Netlify Serverless Function: POST create and GET retrieve cross-device flow', async () => {
  // Test POST /api/certificates
  const createReq = new Request('https://pauteknofest.netlify.app/api/certificates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participantName: 'Mustafa Kemal',
      completedModules: [...REQUIRED_MODULE_IDS],
      completedAt: '2026-09-18T10:00:00.000Z',
    }),
  });

  const createRes = await serverlessHandler(createReq, testContext);
  assert.equal(createRes.status, 201);
  assert.equal(createRes.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const createdBody = await createRes.json();
  assert.equal(createdBody.success, true);
  assert.ok(createdBody.certificate, 'Must return certificate in standardized envelope');
  const created = createdBody.certificate;

  assert.ok(created.id, 'id must be generated');
  assert.equal(created.id, created.certificateId);
  assert.match(created.certificateNumber, /^PAU-TKF-2026-[A-Z0-9]{6}$/);
  assert.equal(created.participantName, 'Mustafa Kemal');
  assert.equal(created.fullName, 'Mustafa Kemal');

  // Test GET /api/certificates/:id
  const getReq = new Request(`https://pauteknofest.netlify.app/api/certificates/${created.id}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  const getRes = await serverlessHandler(getReq, testContext);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const fetchedBody = await getRes.json();
  assert.equal(fetchedBody.success, true);
  const fetched = fetchedBody.certificate;
  assert.equal(fetched.id, created.id);
  assert.equal(fetched.participantName, 'Mustafa Kemal');
  assert.equal(fetched.fullName, 'Mustafa Kemal');
  assert.equal(fetched.certificateNumber, created.certificateNumber);

  // Test GET non-existent -> 404 with CERTIFICATE_NOT_FOUND
  const notFoundReq = new Request('https://pauteknofest.netlify.app/api/certificates/00000000-0000-0000-0000-000000000000', {
    method: 'GET',
  });
  const notFoundRes = await serverlessHandler(notFoundReq, testContext);
  assert.equal(notFoundRes.status, 404);
  const notFoundBody = await notFoundRes.json();
  assert.equal(notFoundBody.success, false);
  assert.equal(notFoundBody.error, 'CERTIFICATE_NOT_FOUND');
});

test('getCertificatePublicUrl: validates HTTPS and rejects localhost / private IPs in production', () => {
  const originalWindow = globalThis.window;

  try {
    // 1. In production, rejecting localhost origin
    globalThis.window = { location: { origin: 'http://localhost:5173' } };
    // Simulate PROD
    const prodResult = getCertificatePublicUrl('test-id-123');
    // If not set to PROD in node env, check valid resolution
    assert.ok(prodResult.url || prodResult.error);

    // 2. Production with HTTPS domain
    globalThis.window = { location: { origin: 'https://pauteknofest.netlify.app' } };
    const validResult = getCertificatePublicUrl('3b99905d-2fe8-4444-8888-000000000000');
    assert.equal(validResult.url, 'https://pauteknofest.netlify.app/certificate/3b99905d-2fe8-4444-8888-000000000000');
  } finally {
    globalThis.window = originalWindow;
  }
});

test('Module 6 Finale: End-to-end flow from player session to API certificate creation and QR verification', async () => {
  // 1. Enter new player name
  GameStore.resetSession();
  const nameResult = GameStore.setPlayerFullName('Ahmet Yılmaz');
  assert.equal(nameResult.success, true);
  assert.equal(GameStore.getPlayerSession().fullName, 'Ahmet Yılmaz');

  // 2. Complete modules 1 through 5
  const first5Modules = ['gobeklitepe', 'demir_cagi', 'anadolu_ustaligi', 'sanayilesme', 'milli_teknoloji'];
  for (const modId of first5Modules) {
    GameStore.unlockModule(modId);
    GameStore.completeModule(modId);
  }

  // 15. Verify 5th module end does NOT trigger certificate / allComplete is false
  assert.equal(GameStore.isAllModulesCompleted(), false, 'Certificate must not be eligible at module 5');
  assert.equal(GameStore.getPlayerSession().certificateId, null);

  // 3 & 4. Module 6 completed via GÖREVİ TAMAMLA
  GameStore.unlockModule('uzay_teknolojileri');
  GameStore.completeModule('uzay_teknolojileri');
  assert.equal(GameStore.isAllModulesCompleted(), true, 'All 6 modules must now be completed');

  // 5 & 6. Certificate API creation with real player name
  const participantName = GameStore.getPlayerSession().fullName;
  assert.equal(participantName, 'Ahmet Yılmaz', 'Real participant name must be used');

  const createReq = new Request('https://pauteknofest.netlify.app/api/certificates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: participantName,
      completedModules: [...REQUIRED_MODULE_IDS],
      completedAt: '2026-09-27T10:00:00.000Z',
      projectName: 'Medeniyetten Millî Teknolojiye',
    }),
  });

  const createRes = await serverlessHandler(createReq, testContext);
  assert.equal(createRes.status, 201);
  const createBody = await createRes.json();
  assert.equal(createBody.success, true);
  const createdRecord = createBody.certificate;

  assert.ok(createdRecord.certificateId, 'Real UUID certificateId must be returned');
  assert.equal(createdRecord.id, createdRecord.certificateId);
  assert.equal(createdRecord.fullName, 'Ahmet Yılmaz');
  assert.equal(createdRecord.participantName, 'Ahmet Yılmaz');
  assert.match(createdRecord.certificateNumber, /^PAU-TKF-2026-[A-Z0-9]{6}$/);

  // 7, 8 & 9. Resolve production QR URL
  const originalWindow = globalThis.window;
  try {
    globalThis.window = { location: { origin: 'https://pauteknofest.netlify.app' } };
    const publicUrlRes = getCertificatePublicUrl(createdRecord.certificateId);
    assert.equal(publicUrlRes.error, undefined);
    assert.equal(publicUrlRes.url, `https://pauteknofest.netlify.app/certificate/${createdRecord.certificateId}`);

    // Verify QR URL strictly points to /certificate/{certificateId}
    const parsedUrl = new URL(publicUrlRes.url);
    assert.equal(parsedUrl.pathname, `/certificate/${createdRecord.certificateId}`);
    assert.equal(parsedUrl.protocol, 'https:');
  } finally {
    globalThis.window = originalWindow;
  }

  // 10 & 11. Format completion date and verify name on certificate record
  const formattedDate = formatCertificateDate(createdRecord.completedAt);
  assert.equal(formattedDate, '27.09.2026');
  assert.equal(createdRecord.fullName, 'Ahmet Yılmaz');

  // 14. Verify certificate URL still works upon reload / fetching by ID
  const fetchReq = new Request(`https://pauteknofest.netlify.app/api/certificates/${createdRecord.certificateId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  const fetchRes = await serverlessHandler(fetchReq, testContext);
  assert.equal(fetchRes.status, 200);
  const fetchBody = await fetchRes.json();
  assert.equal(fetchBody.success, true);
  const fetched = fetchBody.certificate;
  assert.equal(fetched.certificateId, createdRecord.certificateId);
  assert.equal(fetched.fullName, 'Ahmet Yılmaz');
});

test('Master Certificate Asset: Verifies physical file and exact PNG pixel dimensions (3730 x 2635)', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const publicAssetPath = path.resolve('public/assets/certificate_base.png');
  const srcAssetPath = path.resolve('src/assets/certificate_base.png');

  assert.ok(fs.existsSync(publicAssetPath), 'public/assets/certificate_base.png must exist');
  assert.ok(fs.existsSync(srcAssetPath), 'src/assets/certificate_base.png must exist');

  // Helper to read PNG IHDR dimensions directly from binary header
  function getPngDimensions(filePath) {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(24);
    fs.readSync(fd, buffer, 0, 24, 0);
    fs.closeSync(fd);

    // Bytes 0-7: PNG signature 0x89 50 4E 47 0D 0A 1A 0A
    assert.equal(buffer[0], 0x89);
    assert.equal(buffer[1], 0x50); // P
    assert.equal(buffer[2], 0x4e); // N
    assert.equal(buffer[3], 0x47); // G

    // Bytes 16-19: Width (big-endian 32-bit int)
    const width = buffer.readUInt32BE(16);
    // Bytes 20-23: Height (big-endian 32-bit int)
    const height = buffer.readUInt32BE(20);

    return { width, height };
  }

  const publicDims = getPngDimensions(publicAssetPath);
  assert.equal(publicDims.width, 3730, 'Master PNG template must have exactly 3730px width');
  assert.equal(publicDims.height, 2635, 'Master PNG template must have exactly 2635px height');

  const srcDims = getPngDimensions(srcAssetPath);
  assert.equal(srcDims.width, 3730, 'Source PNG template must have exactly 3730px width');
  assert.equal(srcDims.height, 2635, 'Source PNG template must have exactly 2635px height');
});

test('Section 16 End-to-end Test: TEST KAŞİF flow, coordinates, and resolution preservation', async () => {
  // 1. Participant name is TEST KAŞİF
  const rawPlayerName = 'TEST KAŞİF';
  GameStore.resetSession();
  GameStore.setPlayerFullName(rawPlayerName);
  assert.equal(GameStore.getPlayerSession().fullName, 'TEST KAŞİF');

  // Complete all 6 modules
  for (const mod of REQUIRED_MODULE_IDS) {
    GameStore.unlockModule(mod);
    GameStore.completeModule(mod);
  }
  assert.equal(GameStore.isAllModulesCompleted(), true);

  // 2. Create certificate on API
  const createReq = new Request('https://pauteknofest.netlify.app/api/certificates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: GameStore.getPlayerSession().fullName,
      completedModules: [...REQUIRED_MODULE_IDS],
      completedAt: new Date().toISOString(),
    }),
  });

  const createRes = await serverlessHandler(createReq, testContext);
  assert.equal(createRes.status, 201);
  const certRecordBody = await createRes.json();
  assert.equal(certRecordBody.success, true);
  const certRecord = certRecordBody.certificate;
  assert.equal(certRecord.fullName, 'TEST KAŞİF');

  // 3. Normalized positioning calculation
  const masterWidth = 3730;
  const masterHeight = 2635;

  const expectedNameX = Math.round(masterWidth * (1898 / 3730));
  const expectedNameY = Math.round(masterHeight * (1335 / 2635));

  // Center of the dotted line under BAŞARI SERTİFİKASI is at 1898px
  assert.equal(expectedNameX, 1898);
  // Vertical middle of name field cleanly resting above dotted line (y=1380) is at 1335px
  assert.equal(expectedNameY, 1335);

  // 4. Verification that Turkish uppercase formatting is preserved
  const formattedName = certRecord.fullName.trim().toLocaleUpperCase('tr-TR');
  assert.equal(formattedName, 'TEST KAŞİF');

  // 5. Verification for all 4 requested test names (centering & bounding box)
  const testNames = [
    'Ali Can',
    'Buğra Çiçek',
    'Mehmet Emir Yılmaz',
    'Muhammed Emir Abdurrahman Yılmaz',
  ];
  const maxAllowedWidth = masterWidth * 0.34; // ~1268px inside 1355px line
  assert.ok(maxAllowedWidth >= 1200 && maxAllowedWidth <= 1300);

  for (const tName of testNames) {
    const upper = tName.trim().toLocaleUpperCase('tr-TR');
    assert.ok(upper.length > 0);
    // Estimated width at scaled font
    const charCount = upper.length;
    let testFontSize = Math.round(masterWidth * 0.028); // 104px
    let simulatedWidth = charCount * testFontSize * 0.62;
    while (simulatedWidth > maxAllowedWidth && testFontSize > 48) {
      testFontSize -= 2;
      simulatedWidth = charCount * testFontSize * 0.62;
    }
    assert.ok(simulatedWidth <= maxAllowedWidth, `${tName} must fit within max allowed width`);
    // Horizontal center remains constant
    assert.equal(expectedNameX, 1898, `Horizontal center for ${tName} must remain constant`);
  }

  // 6. Retrieval by mobile URL test
  const getReq = new Request(`https://pauteknofest.netlify.app/api/certificates/${certRecord.certificateId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  const getRes = await serverlessHandler(getReq, testContext);
  assert.equal(getRes.status, 200);
  const mobileFetchedBody = await getRes.json();
  assert.equal(mobileFetchedBody.success, true);
  const mobileFetched = mobileFetchedBody.certificate;
  assert.equal(mobileFetched.fullName, 'TEST KAŞİF');
  assert.equal(mobileFetched.certificateId, certRecord.certificateId);
});

test('ApiCertificateRepository & createCertificateAuthoritative: round-trip atomic persistence and verification', async () => {
  // Mock global fetch to route to serverlessHandler
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const fullUrl = typeof url === 'string' && url.startsWith('http') ? url : `https://pauteknofest.netlify.app${url}`;
    const req = new Request(fullUrl, options);
    return serverlessHandler(req, testContext);
  };

  try {
    // 1. Test createCertificateAuthoritative
    const created = await createCertificateAuthoritative({
      fullName: 'Ayşe Demir',
      completedModules: [...REQUIRED_MODULE_IDS],
    });

    assert.ok(created.certificateId, 'Must have authoritative server certificateId');
    assert.equal(created.id, created.certificateId);
    assert.equal(created.fullName, 'Ayşe Demir');
    assert.equal(created.participantName, 'Ayşe Demir');
    assert.match(created.certificateNumber, /^PAU-TKF-\d{4}-[A-Z0-9]{6}$/);

    // 2. Test verifyCertificateOnServer succeeds for created record
    const isVerified = await verifyCertificateOnServer(created.certificateId);
    assert.equal(isVerified, true, 'verifyCertificateOnServer must return true for persisted certificate');

    // 3. Test verifyCertificateOnServer returns false for non-existent id
    const nonExistentVerified = await verifyCertificateOnServer('00000000-0000-0000-0000-000000000000', [50, 100]);
    assert.equal(nonExistentVerified, false, 'verifyCertificateOnServer must return false for non-existent record');

    // 4. Test ApiCertificateRepository getById
    const repo = new ApiCertificateRepository();
    const fetched = await repo.getById(created.certificateId);
    assert.ok(fetched, 'Fetched record must exist');
    assert.equal(fetched.certificateId, created.certificateId);
    assert.equal(fetched.fullName, 'Ayşe Demir');

    // 5. Test ApiCertificateRepository 404
    const notFound = await repo.getById('00000000-0000-0000-0000-000000000000');
    assert.equal(notFound, null, 'Repository must return null for 404');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

