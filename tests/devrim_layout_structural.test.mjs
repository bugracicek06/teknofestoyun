import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Devrim Step 3 Structural Layout: partsTray and progressBar are sequential flex column siblings', () => {
  const assemblyPath = path.join(projectRoot, 'src/components/devrim/DevrimEngineAssembly.tsx');
  const assemblyContent = fs.readFileSync(assemblyPath, 'utf-8');

  const shellPath = path.join(projectRoot, 'src/components/devrim/DevrimOtomobiliMissionShell.tsx');
  const shellContent = fs.readFileSync(shellPath, 'utf-8');

  // 1. Verify bottomSlot prop in DevrimEngineAssemblyProps
  assert.ok(
    assemblyContent.includes('bottomSlot?: React.ReactNode'),
    'DevrimEngineAssemblyProps must declare bottomSlot prop'
  );

  // 2. Verify devrim-assembly-bottom-area uses flex column with minimum 8px gap
  assert.ok(
    assemblyContent.includes('className="devrim-assembly-bottom-area"'),
    'devrim-assembly-bottom-area container must exist'
  );
  assert.ok(
    assemblyContent.includes("flexDirection: 'column'"),
    'devrim-assembly-bottom-area must use flexDirection: column'
  );
  assert.ok(
    assemblyContent.includes("gap: 'clamp(8px,"),
    'devrim-assembly-bottom-area gap must start with clamp(8px, ensuring minimum 8px gap'
  );

  // 3. Verify order inside devrim-assembly-bottom-area: partsTray first, then bottomSlot
  const trayIndex = assemblyContent.indexOf('className="devrim-parts-tray-container"');
  const bottomSlotIndex = assemblyContent.indexOf('{bottomSlot}');
  assert.ok(trayIndex > 0, 'devrim-parts-tray-container must exist');
  assert.ok(bottomSlotIndex > 0, '{bottomSlot} must exist');
  assert.ok(
    trayIndex < bottomSlotIndex,
    'devrim-parts-tray-container must be positioned strictly BEFORE {bottomSlot} in DOM flow'
  );

  // 4. Verify Step 3 passes the step dock as bottomSlot in DevrimOtomobiliMissionShell
  assert.ok(
    shellContent.includes('bottomSlot={renderStepProgressDock(true)}'),
    'DevrimOtomobiliMissionShell must pass renderStepProgressDock(true) as bottomSlot in Step 3'
  );

  // 5. Verify renderStepProgressDock uses relative position when isFlow is true (Step 3)
  assert.ok(
    shellContent.includes("position: isFlow ? 'relative' : 'absolute'"),
    'Step dock must be position: relative in flow (isFlow=true), removing absolute overlay in Step 3'
  );

  // 6. Verify floating dock in shell is only rendered when currentStep !== 3
  assert.ok(
    shellContent.includes('{currentStep !== 3 && renderStepProgressDock(false)}'),
    'Floating dock must NOT be rendered when currentStep === 3'
  );
});
