import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Centralized Assistant Hints: ASSISTANT_HINTS data exists for all 6 modules', () => {
  const hintsPath = path.join(projectRoot, 'src', 'data', 'assistantHints.ts');
  assert.ok(fs.existsSync(hintsPath), 'src/data/assistantHints.ts must exist');

  const content = fs.readFileSync(hintsPath, 'utf-8');
  const requiredModules = [
    'gobeklitepe',
    'demir_cagi',
    'anadolu_ustaligi',
    'sanayilesme',
    'milli_teknoloji',
    'uzay_teknolojileri',
  ];

  for (const mod of requiredModules) {
    assert.ok(content.includes(`${mod}:`), `ASSISTANT_HINTS must define hints for ${mod}`);
  }
  assert.ok(content.includes('export function getAssistantHint'), 'getAssistantHint helper function must be exported');
});

test('Shared GameAssistant: Starts closed by default and does not auto-open on speech', () => {
  const assistantPath = path.join(projectRoot, 'src', 'components', 'game-ui', 'GameAssistant.tsx');
  const content = fs.readFileSync(assistantPath, 'utf-8');

  // Verify default state is false
  assert.match(content, /defaultOpen\s*=\s*false/, 'GameAssistant defaultOpen must default to false');
  assert.match(content, /useState<boolean>\(defaultOpen\)/, 'GameAssistant initial open state must be false');

  // Verify that it does NOT contain an effect that forcibly opens the bubble on message change
  assert.ok(!content.includes('useEffect(() => { setBubbleOpen(true); }, [message])'), 'Must NOT auto-open bubble on message change');

  // Verify EventBus integration for top bar help synchronization
  assert.ok(content.includes("'toggle-assistant'"), 'Must handle toggle-assistant EventBus event');
  assert.ok(content.includes("'open-assistant'"), 'Must handle open-assistant EventBus event');
  assert.ok(content.includes("'close-assistant'"), 'Must handle close-assistant EventBus event');

  // Verify TÜYO badge indicator exists
  assert.ok(content.includes('assistant-hint-badge'), 'Must include assistant-hint-badge');
});

test('Non-blocking Layout: GameAssistant CSS does not create full-screen blocking overlay', () => {
  const cssPath = path.join(projectRoot, 'src', 'components', 'game-ui', 'gameUi.css');
  const css = fs.readFileSync(cssPath, 'utf-8');

  // Check wrapper has pointer-events: none
  assert.ok(css.includes('.game-assistant-wrapper {'), 'Must have .game-assistant-wrapper');
  assert.match(css, /\.game-assistant-wrapper\s*\{[^}]*pointer-events:\s*none;/, 'Wrapper must have pointer-events: none');

  // Check avatar button has pointer-events: auto and min 48px touch target
  assert.match(css, /\.assistant-avatar-btn\s*\{[^}]*pointer-events:\s*auto;/, 'Avatar button must have pointer-events: auto');
  assert.match(css, /\.assistant-avatar-btn\s*\{[^}]*min-width:\s*48px;/, 'Avatar button must have min-width: 48px');
  assert.match(css, /\.assistant-avatar-btn\s*\{[^}]*min-height:\s*48px;/, 'Avatar button must have min-height: 48px');

  // Check bubble has pointer-events: auto and controlled max-width
  assert.match(css, /\.assistant-speech-bubble\s*\{[^}]*pointer-events:\s*auto;/, 'Speech bubble must have pointer-events: auto');
  assert.match(css, /max-width:\s*clamp\(260px,\s*24vw,\s*340px\)/, 'Speech bubble max-width must be constrained');
});

test('Top Bar Help Button: Synchronized with GameAssistant instead of separate pause popup', () => {
  const topBarPath = path.join(projectRoot, 'src', 'components', 'game-ui', 'GameTopBar.tsx');
  const content = fs.readFileSync(topBarPath, 'utf-8');

  assert.ok(content.includes("EventBus.emit('toggle-assistant')"), 'GameTopBar onHelp fallback must emit toggle-assistant event');
});

test('Module 1 (Göbeklitepe): Exactly 1 assistant, starts closed, onHelp wired, closes on progress', () => {
  const shellPath = path.join(projectRoot, 'src', 'components', 'GobeklitepeMissionShell.tsx');
  const content = fs.readFileSync(shellPath, 'utf-8');

  // Verify single GameAssistant
  const matches = content.match(/<GameAssistant/g) || [];
  assert.equal(matches.length, 1, 'Göbeklitepe must render exactly 1 GameAssistant');

  // Verify assistantOpen state & onHelp toggle
  assert.ok(content.includes('const [assistantOpen, setAssistantOpen] = useState<boolean>(false)'), 'Must initialize assistantOpen to false');
  assert.ok(content.includes('setAssistantOpen') && content.includes('onHelp'), 'TopBar onHelp must toggle assistantOpen');
  assert.ok(content.includes('isOpen={assistantOpen}'), 'Must pass isOpen={assistantOpen} to GameAssistant');

  // Verify auto-close on progress
  assert.ok(content.includes('setAssistantOpen(false)'), 'Must auto-close on placedCount progress');
});

test('Module 2 (Demir Çağı): Exactly 1 assistant, starts closed, onHelp wired, closes on stage change', () => {
  const shellPath = path.join(projectRoot, 'src', 'components', 'demir', 'DemirCagiMissionShell.tsx');
  const content = fs.readFileSync(shellPath, 'utf-8');

  // Verify single GameAssistant
  const matches = content.match(/<GameAssistant/g) || [];
  assert.equal(matches.length, 1, 'Demir Çağı must render exactly 1 GameAssistant');

  // Verify assistantOpen state & stage reset
  assert.ok(content.includes('const [assistantOpen, setAssistantOpen] = useState<boolean>(false)'), 'Must initialize assistantOpen to false');
  assert.ok(content.includes('setAssistantOpen(false)'), 'Must auto-close on stage/missionTitle change');
  assert.ok(content.includes('isOpen={assistantOpen}'), 'Must pass isOpen={assistantOpen} to GameAssistant');
});

test('Module 3 (Anadolu Ustalığı): Duplicate cini-kasif-guide removed, exactly 1 assistant', () => {
  const shellPath = path.join(projectRoot, 'src', 'components', 'CiniSanatiMissionShell.tsx');
  const content = fs.readFileSync(shellPath, 'utf-8');

  // Verify duplicate mascot element is removed
  assert.ok(!content.includes('cini-kasif-guide'), 'Duplicate cini-kasif-guide mascot must NOT be rendered');
  assert.ok(!content.includes('src="/assets/devrim/kasif_mascot.webp"'), 'Duplicate kasif_mascot image must NOT be in CiniSanatiMissionShell');

  // Verify single GameAssistant
  const matches = content.match(/<GameAssistant/g) || [];
  assert.equal(matches.length, 1, 'Anadolu Ustalığı must render exactly 1 GameAssistant');

  // Verify assistantOpen state & step reset
  assert.ok(content.includes('const [assistantOpen, setAssistantOpen] = useState<boolean>(false)'), 'Must initialize assistantOpen to false');
  assert.ok(content.includes('setAssistantOpen') && content.includes('onHelp'), 'TopBar onHelp must toggle assistantOpen');
});

test('Module 4 (Devrim): Duplicate kasif_mascot in engine assembly removed, exactly 1 assistant', () => {
  const assemblyPath = path.join(projectRoot, 'src', 'components', 'devrim', 'DevrimEngineAssembly.tsx');
  const assemblyContent = fs.readFileSync(assemblyPath, 'utf-8');

  // Verify duplicate mascot in engine assembly is removed
  assert.ok(!assemblyContent.includes('src="/assets/devrim/kasif_mascot.webp"'), 'Duplicate mascot in DevrimEngineAssembly must NOT be rendered');
  assert.ok(!assemblyContent.includes('devrimKasifFloat'), 'Duplicate mascot float animation in DevrimEngineAssembly must NOT be rendered');

  const shellPath = path.join(projectRoot, 'src', 'components', 'devrim', 'DevrimOtomobiliMissionShell.tsx');
  const shellContent = fs.readFileSync(shellPath, 'utf-8');

  // Verify single GameAssistant
  const matches = shellContent.match(/<GameAssistant/g) || [];
  assert.equal(matches.length, 1, 'Devrim must render exactly 1 GameAssistant');

  // Verify assistantOpen state & step reset
  assert.ok(shellContent.includes('const [assistantOpen, setAssistantOpen] = useState(false)'), 'Must initialize assistantOpen to false');
  assert.ok(shellContent.includes('setAssistantOpen') && shellContent.includes('onHelp'), 'TopBar onHelp must toggle assistantOpen');
});

test('Module 5 (Millî Teknoloji): Duplicate kasif_3d image in flight footer removed, exactly 1 assistant', () => {
  const flightPath = path.join(projectRoot, 'src', 'components', 'milli', 'MilliStage4Flight.tsx');
  const flightContent = fs.readFileSync(flightPath, 'utf-8');

  // Verify duplicate mascot image in flight footer is removed
  assert.ok(!flightContent.includes('src="/assets/kasif_3d.png"'), 'Duplicate kasif_3d image in MilliStage4Flight footer must NOT be rendered');

  const shellPath = path.join(projectRoot, 'src', 'components', 'milli', 'MilliTeknolojiMissionShell.tsx');
  const shellContent = fs.readFileSync(shellPath, 'utf-8');

  // Verify single GameAssistant
  const matches = shellContent.match(/<GameAssistant/g) || [];
  assert.equal(matches.length, 1, 'Millî Teknoloji must render exactly 1 GameAssistant');

  // Verify assistantOpen state & stage reset
  assert.ok(shellContent.includes('const [assistantOpen, setAssistantOpen] = useState<boolean>(false)'), 'Must initialize assistantOpen to false');
  assert.ok(shellContent.includes('setAssistantOpen') && shellContent.includes('onHelp'), 'TopBar onHelp must toggle assistantOpen');
});

test('Module 6 (Uzay Teknolojileri): Duplicate mascots in Stage 1 & Stage 3 removed, exactly 1 assistant', () => {
  const stage1Path = path.join(projectRoot, 'src', 'components', 'uzay', 'UzayStage1Assembly.tsx');
  const stage1Content = fs.readFileSync(stage1Path, 'utf-8');
  assert.ok(!stage1Content.includes('{/* Kaşif Mascot & Speech Bubble */}'), 'Duplicate mascot in UzayStage1Assembly must NOT be rendered');

  const stage3Path = path.join(projectRoot, 'src', 'components', 'uzay', 'UzayStage3Orbit.tsx');
  const stage3Content = fs.readFileSync(stage3Path, 'utf-8');
  assert.ok(!stage3Content.includes('{/* Mascot Kaşif */}'), 'Duplicate mascot in UzayStage3Orbit must NOT be rendered');

  const shellPath = path.join(projectRoot, 'src', 'components', 'uzay', 'UzayTeknolojileriMissionShell.tsx');
  const shellContent = fs.readFileSync(shellPath, 'utf-8');

  // Verify single GameAssistant
  const matches = shellContent.match(/<GameAssistant/g) || [];
  assert.equal(matches.length, 1, 'Uzay Teknolojileri must render exactly 1 GameAssistant');

  // Verify assistantOpen state & stage reset
  assert.ok(shellContent.includes('const [assistantOpen, setAssistantOpen] = useState<boolean>(false)'), 'Must initialize assistantOpen to false');
  assert.ok(shellContent.includes('setAssistantOpen') && shellContent.includes('onHelp'), 'TopBar onHelp must toggle assistantOpen');
});
