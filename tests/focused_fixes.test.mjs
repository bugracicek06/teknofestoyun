import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Issue 1: Bölüm 1 (Göbeklitepe) - TopBar pointer events and layout rules', async () => {
  const cssPath = path.join(projectRoot, 'src/styles/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // Verify .gobeklitepe-shell definition
  assert.ok(cssContent.includes('.gobeklitepe-shell {'), 'gobeklitepe-shell should exist in CSS');

  // Verify GameTopBar inside gobeklitepe-shell has pointer-events: auto !important
  assert.match(
    cssContent,
    /\.gobeklitepe-shell\s+\.game-top-bar\s*\{\s*pointer-events:\s*auto\s*!important/i,
    'GameTopBar inside gobeklitepe-shell must receive pointer events'
  );

  // Verify buttons inside GameTopBar have pointer-events: auto !important
  assert.match(
    cssContent,
    /\.gobeklitepe-shell\s+\.game-top-bar\s+button\s*\{\s*pointer-events:\s*auto\s*!important/i,
    'Buttons in GameTopBar inside gobeklitepe-shell must receive pointer events'
  );

  // Verify GameAssistant buttons have pointer-events: auto !important
  assert.match(
    cssContent,
    /\.gobeklitepe-shell\s+\.game-assistant-wrapper\s+button\s*\{\s*pointer-events:\s*auto\s*!important/i,
    'Buttons in GameAssistant must receive pointer events'
  );

  // Verify Gobeklitepe shell has 0 top padding so GameTopBar sits flush at top
  assert.match(
    cssContent,
    /padding:\s*0\s+0\s+clamp\(10px,\s*1\.6vh,\s*20px\)\s*0;/,
    'gobeklitepe-shell must have 0 top padding for flush TopBar'
  );

  // Verify GobeklitepeMissionShell wires all 5 TopBar interaction handlers
  const shellPath = path.join(projectRoot, 'src/components/GobeklitepeMissionShell.tsx');
  const shellContent = fs.readFileSync(shellPath, 'utf-8');

  assert.ok(shellContent.includes('onBack={onBack}'), 'TopBar onBack must be wired');
  assert.ok(shellContent.includes('onToggleAudio={onToggleAudio}'), 'TopBar onToggleAudio must be wired');
  assert.ok(shellContent.includes('onHelp={handleHelpToggle}'), 'TopBar onHelp must be wired');
  assert.ok(shellContent.includes('onPause={onPause}'), 'TopBar onPause must be wired');
  assert.ok(shellContent.includes('onToggleFullscreen={onToggleFullscreen}'), 'TopBar onToggleFullscreen must be wired');

  // Verify KioskShell wires all handlers to Göbeklitepe
  const kioskPath = path.join(projectRoot, 'src/components/KioskShell.tsx');
  const kioskContent = fs.readFileSync(kioskPath, 'utf-8');
  assert.ok(kioskContent.includes('<GobeklitepeMissionShell'), 'KioskShell renders GobeklitepeMissionShell');
  assert.ok(kioskContent.includes('onBack={() => navigate(SceneKeys.WORLD_MAP)}'), 'KioskShell handles back to world map');
  assert.ok(kioskContent.includes('onToggleAudio='), 'KioskShell handles audio toggle');
  assert.ok(kioskContent.includes("onHelp={() => pause('help')}"), 'KioskShell handles help pause');
  assert.ok(kioskContent.includes("onPause={() => pause('pause')}"), 'KioskShell handles pause');
  assert.ok(kioskContent.includes('onToggleFullscreen={toggleFullscreen}'), 'KioskShell handles fullscreen toggle');
});

test('Issue 2: Bölüm 5 (İHA Montajı) - Drag & drop mechanics, RAF, and caching', async () => {
  const milliPath = path.join(projectRoot, 'src/components/milli/MilliStage1Assembly.tsx');
  const milliContent = fs.readFileSync(milliPath, 'utf-8');

  // Verify window-level pointer event listeners are registered dynamically in handlePointerDown
  assert.ok(milliContent.includes("window.addEventListener('pointermove', onWindowMove)"), 'pointermove registered on window');
  assert.ok(milliContent.includes("window.addEventListener('pointerup', onWindowUp)"), 'pointerup registered on window');
  assert.ok(milliContent.includes("window.addEventListener('pointercancel', onWindowCancel)"), 'pointercancel registered on window');

  // Verify cleanup removes listeners
  assert.ok(milliContent.includes("window.removeEventListener('pointermove', onWindowMove)"), 'pointermove removed');
  assert.ok(milliContent.includes("window.removeEventListener('pointerup', onWindowUp)"), 'pointerup removed');
  assert.ok(milliContent.includes("window.removeEventListener('pointercancel', onWindowCancel)"), 'pointercancel removed');

  // Verify RAF is used for smooth 60fps transform
  assert.ok(milliContent.includes('dragRafRef.current = requestAnimationFrame'), 'RAF used for drag transform');

  // Verify target box coords are cached at pointerdown to eliminate forced reflows during move
  assert.ok(milliContent.includes('cachedTargetCenterX'), 'cachedTargetCenterX precomputed at pointerdown');
  assert.ok(milliContent.includes('nearStateRef.current'), 'near state throttled to prevent setState thrashing');

  // Verify click-to-place cheating is removed (no onClick on cards or molds)
  assert.doesNotMatch(milliContent, /onClick=\{.*handleCardClick/i, 'handleCardClick must not exist on card');
  assert.doesNotMatch(milliContent, /onClick=\{.*handleMoldClick/i, 'handleMoldClick must not exist on molds');

  // Verify drop hit detection checks both radial distance and normalized box
  assert.ok(milliContent.includes('distFromMount <= 220'), 'Radial hit detection within 220px');
  assert.ok(milliContent.includes('normX >= targetX - margin'), 'Normalized coordinate bounding box fallback');

  // Verify snap animation and placedParts state
  assert.ok(milliContent.includes('handleSnapPart(currentPart)'), 'Correct drop triggers handleSnapPart');
  assert.ok(milliContent.includes('next.add(part.stableKey)'), 'placedParts adds stableKey');
  assert.ok(milliContent.includes('next.add(part.id)'), 'placedParts adds id');

  // Verify placed parts remain rendered on the aircraft
  assert.ok(milliContent.includes("placedParts.has('wing')"), 'Wing rendered when placed');
  assert.ok(milliContent.includes("placedParts.has('tail')"), 'Tail rendered when placed');
  assert.ok(milliContent.includes("placedParts.has('landingGear')"), 'Landing gear rendered when placed');
  assert.ok(milliContent.includes("placedParts.has('engine')"), 'Motor/engine rendered when placed');
});

test('Issue 3: Bölüm 6 (Uzay Aracı Montajı) - Drag & drop mechanics, body dependency, RAF, and caching', async () => {
  const uzayPath = path.join(projectRoot, 'src/components/uzay/UzayStage1Assembly.tsx');
  const uzayContent = fs.readFileSync(uzayPath, 'utf-8');

  // Verify window-level pointer event listeners
  assert.ok(uzayContent.includes("window.addEventListener('pointermove', onWindowMove)"), 'pointermove registered on window');
  assert.ok(uzayContent.includes("window.addEventListener('pointerup', onWindowUp)"), 'pointerup registered on window');
  assert.ok(uzayContent.includes("window.addEventListener('pointercancel', onWindowCancel)"), 'pointercancel registered on window');

  // Verify cleanup
  assert.ok(uzayContent.includes("window.removeEventListener('pointermove', onWindowMove)"), 'pointermove removed');
  assert.ok(uzayContent.includes("window.removeEventListener('pointerup', onWindowUp)"), 'pointerup removed');
  assert.ok(uzayContent.includes("window.removeEventListener('pointercancel', onWindowCancel)"), 'pointercancel removed');

  // Verify RAF is used for smooth 60fps avatar transform
  assert.ok(uzayContent.includes('dragRafRef.current = requestAnimationFrame'), 'RAF used for avatar transform in uzay');

  // Verify target screen coords are cached at pointerdown to eliminate getBoundingClientRect in pointermove
  assert.ok(uzayContent.includes('cachedTargetScreenX'), 'cachedTargetScreenX precomputed at pointerdown');
  assert.ok(uzayContent.includes('nearStateRef.current'), 'near state throttled in uzay');

  // Verify click-to-place cheating is removed
  assert.doesNotMatch(uzayContent, /onClick=\{.*handleCardClick/i, 'handleCardClick must not exist on card');

  // Verify body dependency rule is enforced: body must be placed before peripheral parts
  assert.match(
    uzayContent,
    /currentPart\.id\s*!==\s*'body'\s*&&\s*!placedPartIds\.includes\('body'\)/,
    'Ana Gövde must be placed before peripheral parts can be assembled'
  );
  assert.ok(uzayContent.includes('Önce Ana Gövdeyi yerleştirmelisin!'), 'Provides hint when dependency violated');

  // Verify hit testing has both local SVG point and bounding box fallback
  assert.ok(uzayContent.includes('getLocalSvgPoint(dropX, dropY)'), 'Uses getLocalSvgPoint');
  assert.ok(uzayContent.includes('screenDist <= allowedRadius'), 'Uses bounding box screen distance fallback');

  // Verify snap animation and placedPartIds state
  assert.ok(uzayContent.includes('handleSnapPart(currentPart)'), 'Correct drop triggers handleSnapPart');
  assert.ok(uzayContent.includes('const nextPlaced = [...placedPartIds, part.id]'), 'placedPartIds updated');

  // Verify placed parts remain rendered on the satellite
  assert.ok(uzayContent.includes("placedPartIds.includes('body')"), 'Body rendered when placed');
  assert.ok(uzayContent.includes("placedPartIds.includes('solar_left')"), 'Solar left rendered when placed');
  assert.ok(uzayContent.includes("placedPartIds.includes('solar_right')"), 'Solar right rendered when placed');
  assert.ok(uzayContent.includes("placedPartIds.includes('antenna')"), 'Antenna rendered when placed');
  assert.ok(uzayContent.includes("placedPartIds.includes('sensor')"), 'Sensor rendered when placed');
  assert.ok(uzayContent.includes("placedPartIds.includes('heat_shield')"), 'Heat shield rendered when placed');
});

test('Performance: DevrimEngineAssembly uses GPU-friendly translate3d, cached rects, and RAF', async () => {
  const devrimPath = path.join(projectRoot, 'src/components/devrim/DevrimEngineAssembly.tsx');
  const devrimContent = fs.readFileSync(devrimPath, 'utf-8');

  // Verify cached slot rects map
  assert.ok(devrimContent.includes('cachedSlotRectsRef'), 'cachedSlotRectsRef used for zero DOM reads during drag');
  assert.ok(devrimContent.includes('dragRafRef'), 'dragRafRef used for 60fps RAF update');

  // Verify GPU-accelerated translate3d is used for drag avatar
  assert.ok(devrimContent.includes('translate3d(${x}px, ${y}px, 0)'), 'translate3d used in pointermove RAF');
  assert.doesNotMatch(devrimContent, /left:\s*`\$\{dragState\.currentX\}px`/i, 'left: currentX must not be used on drag ghost');

  // Verify state is not updated on every pixel
  assert.doesNotMatch(devrimContent, /setDragState\(prev\s*=>\s*\(prev\s*\?\s*\{\s*\.\.\.prev,\s*currentX/i, 'setDragState not called on every move');
});

test('Performance: Transition flicker prevention and solid dark backgrounds', async () => {
  const preloaderPath = path.join(projectRoot, 'src/game/utils/assetPreloader.ts');
  assert.ok(fs.existsSync(preloaderPath), 'assetPreloader.ts should exist');

  const kioskPath = path.join(projectRoot, 'src/components/KioskShell.tsx');
  const kioskContent = fs.readFileSync(kioskPath, 'utf-8');
  assert.ok(kioskContent.includes('preloadCriticalSceneAssets'), 'KioskShell calls preloadCriticalSceneAssets');

  const cssPath = path.join(projectRoot, 'src/styles/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  assert.ok(cssContent.includes('.game-canvas-container {'), 'game-canvas-container exists in CSS');
  assert.match(cssContent, /sceneSurfaceMicroFade/i, 'sceneSurfaceMicroFade animation defined');
});
