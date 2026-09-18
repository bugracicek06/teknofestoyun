import { GAME_MODULES } from '../../data/modules';
import { GameStore } from '../state/GameStore';

/** Direct scene entry for local visual QA. Excluded from production execution. */
export function developmentPreview(): string | undefined {
  if (!import.meta.env.DEV) return;
  const id = new URLSearchParams(location.search).get('preview');
  const module = GAME_MODULES.find(m => m.id === id);
  if (module) { GameStore.unlockModule(module.id); return module.sceneKey; }
}
