/**
 * Ottoman Sword (Şimşir / Kılıç) Assembly System for Demir Çağı Stage 4.
 *
 * Provides pure mathematical definitions for:
 * 1. The 4 authentic decorative Ottoman sword parts.
 * 2. Exact slot coordinates on the central wooden stand (tezgâh).
 * 3. Exact tray compartments and preview scales.
 * 4. Drop evaluation with strict 1:1 part-to-slot matching and snap distance thresholds.
 * 5. Contiguity verification ensuring zero-gap seamless fit across all 4 pieces.
 * 6. Fisher-Yates shuffle ensuring randomized tray positions each game session.
 */

export type SwordPartId = 'part_blade' | 'part_guard' | 'part_grip' | 'part_pommel';
export type SwordSlotId = 'slot_blade' | 'slot_guard' | 'slot_grip' | 'slot_pommel';

export const CANONICAL_SWORD_PART_IDS: readonly SwordPartId[] = [
  'part_blade',
  'part_guard',
  'part_grip',
  'part_pommel',
];

export interface SwordPartDef {
  id: SwordPartId;
  slotId: SwordSlotId;
  index: number; // 1, 2, 3, 4 (assembly sequence)
  title: string; // Clean unnumbered display name on tray card
  name: string;
  textureKey: string;
  // Full scale dimensions on assembly stand
  width: number;
  height: number;
  // Slot coordinate on stand (center origin)
  slotX: number;
  slotY: number;
  // Scaled preview dimensions to maximize card visibility
  trayW: number;
  trayH: number;
  // Layering depth on stand (Guard sits above blade & grip)
  standDepth: number;
}

export interface SwordSlotDef {
  id: SwordSlotId;
  partId: SwordPartId;
  index: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TrayCardSlot {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 4 Fixed Tray Card Compartments at the bottom.
 * Parts are dynamically assigned to these 4 slots via Fisher-Yates shuffle.
 * Keeps X: 0..415 clear for Pusula companion character.
 */
export const TRAY_CARD_SLOTS: TrayCardSlot[] = [
  { index: 0, x: 555, y: 855, width: 250, height: 180 },
  { index: 1, x: 825, y: 855, width: 250, height: 180 },
  { index: 2, x: 1095, y: 855, width: 250, height: 180 },
  { index: 3, x: 1365, y: 855, width: 250, height: 180 },
];

/**
 * Standard horizontal baseline for the sword on the display rack (Y = 465).
 * All 4 pieces share this datum axis.
 */
export const SWORD_BASELINE_Y = 465;

export const SWORD_PART_DEFS: Record<SwordPartId, SwordPartDef> = {
  part_blade: {
    id: 'part_blade',
    slotId: 'slot_blade',
    index: 1,
    title: 'Kılıç Ucu',
    name: 'Kılıç Ucu (Namlu)',
    textureKey: 'sword_blade',
    width: 620,
    height: 110,
    slotX: 790,
    slotY: SWORD_BASELINE_Y,
    trayW: 230,
    trayH: 52,
    standDepth: 12,
  },
  part_guard: {
    id: 'part_guard',
    slotId: 'slot_guard',
    index: 2,
    title: 'Kabza Koruması',
    name: 'Kabza Koruma (Siper)',
    textureKey: 'sword_guard',
    width: 76,
    height: 190,
    slotX: 1110,
    slotY: SWORD_BASELINE_Y,
    trayW: 64,
    trayH: 135,
    standDepth: 16, // Quillons layer over blade tang and grip ferrule
  },
  part_grip: {
    id: 'part_grip',
    slotId: 'slot_grip',
    index: 3,
    title: 'Kabza',
    name: 'Sap (Kabza)',
    textureKey: 'sword_grip',
    width: 144,
    height: 46,
    slotX: 1207,
    slotY: SWORD_BASELINE_Y,
    trayW: 165,
    trayH: 54,
    standDepth: 12,
  },
  part_pommel: {
    id: 'part_pommel',
    slotId: 'slot_pommel',
    index: 4,
    title: 'Kabza Başı',
    name: 'Tutamaç (Kabza Başı)',
    textureKey: 'sword_pommel',
    width: 136,
    height: 104,
    slotX: 1347,
    slotY: SWORD_BASELINE_Y + 29, // Collar aligns at 465 (494 - 29 = 465)
    trayW: 130,
    trayH: 100,
    standDepth: 13,
  },
};

export const SWORD_SLOT_DEFS: Record<SwordSlotId, SwordSlotDef> = {
  slot_blade: {
    id: 'slot_blade',
    partId: 'part_blade',
    index: 1,
    name: 'Kılıç Ucu Yuvası',
    x: 790,
    y: SWORD_BASELINE_Y,
    width: 620,
    height: 110,
  },
  slot_guard: {
    id: 'slot_guard',
    partId: 'part_guard',
    index: 2,
    name: 'Kabza Koruma Yuvası',
    x: 1110,
    y: SWORD_BASELINE_Y,
    width: 76,
    height: 190,
  },
  slot_grip: {
    id: 'slot_grip',
    partId: 'part_grip',
    index: 3,
    name: 'Sap Yuvası',
    x: 1207,
    y: SWORD_BASELINE_Y,
    width: 144,
    height: 46,
  },
  slot_pommel: {
    id: 'slot_pommel',
    partId: 'part_pommel',
    index: 4,
    name: 'Tutamaç Yuvası',
    x: 1347,
    y: SWORD_BASELINE_Y + 29,
    width: 136,
    height: 104,
  },
};

/**
 * Fisher-Yates shuffle implementation.
 * Returns a new shuffled array without mutating the input array.
 */
export function shuffleSwordParts(input: readonly SwordPartId[] = CANONICAL_SWORD_PART_IDS): SwordPartId[] {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export interface DropEvaluation {
  isSuccess: boolean;
  partId: SwordPartId;
  targetSlotId?: SwordSlotId;
  snapX?: number;
  snapY?: number;
  reason?: 'MATCH' | 'WRONG_SLOT' | 'OUT_OF_RANGE' | 'ALREADY_PLACED';
}

/**
 * Tests whether a point is inside a slot's rectangular hit area with tolerance.
 */
export function isPointInsideSlotRect(
  slot: SwordSlotDef,
  px: number,
  py: number,
  tolerance = 25
): boolean {
  const left = slot.x - slot.width / 2 - tolerance;
  const right = slot.x + slot.width / 2 + tolerance;
  const top = slot.y - slot.height / 2 - tolerance;
  const bottom = slot.y + slot.height / 2 + tolerance;
  return px >= left && px <= right && py >= top && py <= bottom;
}

/**
 * Evaluates whether a dragged piece is dropped within acceptable proximity
 * or within the expanded bounding rectangle of its strictly assigned target slot.
 *
 * @param partId ID of the part being dropped.
 * @param dropX Container center X coordinate at drop moment.
 * @param dropY Container center Y coordinate at drop moment.
 * @param snapThreshold Maximum radial pixel distance for valid snap (default: 140px).
 * @param pointerX Optional pointer worldX at drop moment.
 * @param pointerY Optional pointer worldY at drop moment.
 * @param boxTolerance Hitbox expansion margin in px (default: 25px).
 */
export function evaluateSwordDrop(
  partId: SwordPartId,
  dropX: number,
  dropY: number,
  snapThreshold = 140,
  pointerX?: number,
  pointerY?: number,
  boxTolerance = 25
): DropEvaluation {
  const partDef = SWORD_PART_DEFS[partId];
  if (!partDef) {
    return { isSuccess: false, partId, reason: 'WRONG_SLOT' };
  }

  const slotDef = SWORD_SLOT_DEFS[partDef.slotId];
  const dist = Math.hypot(dropX - slotDef.x, dropY - slotDef.y);
  const pointerDist =
    pointerX !== undefined && pointerY !== undefined
      ? Math.hypot(pointerX - slotDef.x, pointerY - slotDef.y)
      : Infinity;

  // 1. Check if container or pointer is inside the correct target slot (radial or box with tolerance)
  const isRadialHit = dist <= snapThreshold;
  const isContainerInBox = isPointInsideSlotRect(slotDef, dropX, dropY, boxTolerance);
  const isPointerInBox =
    pointerX !== undefined && pointerY !== undefined
      ? isPointInsideSlotRect(slotDef, pointerX, pointerY, boxTolerance)
      : false;

  const isTargetCandidate = isRadialHit || isContainerInBox || isPointerInBox;

  // 2. Check all other slots to see if user is actually dropping onto a different slot
  let closestOtherSlot: SwordSlotDef | null = null;
  let minOtherDist = Infinity;

  for (const otherSlot of Object.values(SWORD_SLOT_DEFS)) {
    if (otherSlot.id === slotDef.id) continue;
    const odist = Math.hypot(dropX - otherSlot.x, dropY - otherSlot.y);
    const opdist =
      pointerX !== undefined && pointerY !== undefined
        ? Math.hypot(pointerX - otherSlot.x, pointerY - otherSlot.y)
        : Infinity;
    const effectiveOtherDist = Math.min(odist, opdist);

    const isInsideOtherBox =
      (pointerX !== undefined && pointerY !== undefined && isPointInsideSlotRect(otherSlot, pointerX, pointerY, 0)) ||
      isPointInsideSlotRect(otherSlot, dropX, dropY, 0);

    if (effectiveOtherDist <= snapThreshold || isInsideOtherBox) {
      if (effectiveOtherDist < minOtherDist) {
        minOtherDist = effectiveOtherDist;
        closestOtherSlot = otherSlot;
      }
    }
  }

  // If candidate for target slot:
  if (isTargetCandidate) {
    // If it also happened to be near another slot, only reject if it's strictly closer to the other slot's center
    // AND actually inside the other slot's visual bounds without tolerance
    if (closestOtherSlot) {
      const targetEffectiveDist = Math.min(dist, pointerDist);
      const isDirectlyInOtherSlot =
        (pointerX !== undefined && pointerY !== undefined && isPointInsideSlotRect(closestOtherSlot, pointerX, pointerY, 0)) ||
        isPointInsideSlotRect(closestOtherSlot, dropX, dropY, 0);

      if (isDirectlyInOtherSlot && minOtherDist < targetEffectiveDist && minOtherDist < 50) {
        return {
          isSuccess: false,
          partId,
          targetSlotId: closestOtherSlot.id,
          reason: 'WRONG_SLOT',
        };
      }
    }

    return {
      isSuccess: true,
      partId,
      targetSlotId: slotDef.id,
      snapX: slotDef.x,
      snapY: slotDef.y,
      reason: 'MATCH',
    };
  }

  // If not in target slot, but near or in another slot:
  if (closestOtherSlot) {
    return {
      isSuccess: false,
      partId,
      targetSlotId: closestOtherSlot.id,
      reason: 'WRONG_SLOT',
    };
  }

  return {
    isSuccess: false,
    partId,
    reason: 'OUT_OF_RANGE',
  };
}

/**
 * Validates mathematical contiguity across all 4 parts.
 * Ensures that adjacent parts align with exact 0-gap joints or valid historical overlaps.
 */
export function verifySwordAssemblyContiguity(): {
  isContiguous: boolean;
  bladeToGuardOverlap: number;
  guardToGripOverlap: number;
  gripToPommelGap: number;
} {
  const blade = SWORD_PART_DEFS.part_blade;
  const guard = SWORD_PART_DEFS.part_guard;
  const grip = SWORD_PART_DEFS.part_grip;
  const pommel = SWORD_PART_DEFS.part_pommel;

  const bladeRight = blade.slotX + blade.width / 2; // 790 + 310 = 1100
  const guardLeft = guard.slotX - guard.width / 2;  // 1110 - 38 = 1072
  const bladeToGuardOverlap = bladeRight - guardLeft; // 1100 - 1072 = 28px (tang insert)

  const guardRight = guard.slotX + guard.width / 2; // 1110 + 38 = 1148
  const gripLeft = grip.slotX - grip.width / 2;     // 1207 - 72 = 1135
  const guardToGripOverlap = guardRight - gripLeft;  // 1148 - 1135 = 13px (ferrule collar insert)

  const gripRight = grip.slotX + grip.width / 2;     // 1207 + 72 = 1279
  const pommelLeft = pommel.slotX - pommel.width / 2;// 1347 - 68 = 1279
  const gripToPommelGap = pommelLeft - gripRight;    // 1279 - 1279 = 0px (exact flush join)

  const isContiguous =
    bladeToGuardOverlap > 0 &&
    guardToGripOverlap > 0 &&
    Math.abs(gripToPommelGap) <= 1e-6;

  return {
    isContiguous,
    bladeToGuardOverlap,
    guardToGripOverlap,
    gripToPommelGap,
  };
}
