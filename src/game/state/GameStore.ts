import type { MissionResult } from '../systems/scoring';
import { EventBus } from './EventBus.ts';
import {
  type PlayerSession,
  createEmptyPlayerSession,
  validateAndCleanFullName,
  REQUIRED_MODULE_IDS,
  areAllModulesCompleted,
} from '../systems/certificate.ts';
import {
  type GameGroupId,
  type GameGroupConfig,
  GAME_GROUPS,
  normalizeModuleId,
  areGameModulesCompleted,
} from '../../config/gameGroups.ts';

export interface GameProgressState {
  selectedGame: GameGroupId | null;
  unlockedModuleIds: string[];
  completedModuleIds: string[];
  currentModuleId: string;
  isAudioMuted: boolean;
  results: Record<string, MissionResult>;
  playerSession: PlayerSession;
}

class GameStoreManager {
  private readonly storageKey = 'medeniyetten-milli-teknolojiye:progress:v1';
  private readonly moduleOrder = [
    'gobeklitepe',
    'demir_cagi',
    'anadolu_ustaligi',
    'sanayilesme',
    'milli_teknoloji',
    'uzay_teknolojileri',
  ];

  private state: GameProgressState = {
    selectedGame: null,
    unlockedModuleIds: ['gobeklitepe'],
    completedModuleIds: [],
    currentModuleId: 'gobeklitepe',
    isAudioMuted: false,
    results: {},
    playerSession: createEmptyPlayerSession(),
  };

  constructor() {
    this.restore();
    this.resetSession();
  }

  public getState(): GameProgressState {
    return {
      ...this.state,
      results: structuredClone(this.state.results),
      unlockedModuleIds: this.getUnlockedModuleIds(),
      completedModuleIds: [...this.state.completedModuleIds],
      playerSession: structuredClone(this.state.playerSession),
    };
  }

  public getPlayerSession(): PlayerSession {
    return structuredClone(this.state.playerSession);
  }

  public getSelectedGame(): GameGroupId | null {
    return this.state.selectedGame;
  }

  public getCurrentGameGroup(): GameGroupConfig | null {
    if (!this.state.selectedGame) return null;
    return GAME_GROUPS[this.state.selectedGame] || null;
  }

  /**
   * Select a game group ('game-1', 'game-2', 'game-3').
   * Cleans any half-session state deterministically to avoid state bleed.
   */
  public selectGame(gameId: GameGroupId): void {
    const group = GAME_GROUPS[gameId];
    if (!group) return;

    this.state.selectedGame = gameId;
    this.state.playerSession.selectedGame = gameId;
    this.state.completedModuleIds = [];
    this.state.results = {};
    this.state.playerSession.completedModules = [];
    this.state.playerSession.completedAt = null;
    this.state.playerSession.certificateId = null;
    this.state.playerSession.certificateNumber = null;

    this.state.unlockedModuleIds = [group.modules[0]];
    this.state.currentModuleId = group.modules[0];

    this.persistAndNotify();
  }

  public setPlayerFullName(rawName: string): { success: boolean; cleanedName: string; error?: string } {
    const { isValid, cleanedName, error } = validateAndCleanFullName(rawName);
    if (!isValid) {
      return { success: false, cleanedName, error };
    }

    this.state.playerSession.fullName = cleanedName;
    this.state.playerSession.startedAt = new Date().toISOString();
    this.persistAndNotify();
    return { success: true, cleanedName };
  }

  public setCertificateData(certificateId: string, certificateNumber: string): void {
    this.state.playerSession.certificateId = certificateId;
    this.state.playerSession.certificateNumber = certificateNumber;
    this.persistAndNotify();
  }

  /**
   * Checks if the currently selected game's 2 modules are completed.
   */
  public isCurrentGameCompleted(): boolean {
    if (this.state.selectedGame) {
      return areGameModulesCompleted(this.state.selectedGame, this.state.completedModuleIds);
    }
    return areAllModulesCompleted(this.state.completedModuleIds);
  }

  /**
   * Authoritative check for certificate qualification.
   * In the new structure, completing the 2 modules of the selected game qualifies for certificate.
   */
  public isAllModulesCompleted(): boolean {
    return this.isCurrentGameCompleted();
  }

  public getUnlockedModuleIds(): string[] {
    if (this.state.selectedGame) {
      const group = GAME_GROUPS[this.state.selectedGame];
      if (group) {
        return group.modules.filter(id => this.isModuleUnlocked(id));
      }
    }
    return this.moduleOrder.filter(id => this.isModuleUnlocked(id));
  }

  public isModuleUnlocked(moduleId: string): boolean {
    const normalizedId = normalizeModuleId(moduleId);

    // If an active game is selected:
    if (this.state.selectedGame) {
      const group = GAME_GROUPS[this.state.selectedGame];
      if (!group) return false;
      if (!group.modules.includes(normalizedId as any)) {
        return false;
      }
      // 1st module of the selected game is always unlocked
      if (normalizedId === group.modules[0]) {
        return true;
      }
      // 2nd module requires the 1st module to be completed
      if (normalizedId === group.modules[1]) {
        return this.isModuleCompleted(group.modules[0]);
      }
      return false;
    }

    // Fallback when no game is explicitly selected yet (legacy/linear mode):
    const index = this.moduleOrder.indexOf(normalizedId);
    if (index === -1) return false;
    if (index === 0) return true;
    const previousModuleId = this.moduleOrder[index - 1];
    return this.isModuleCompleted(previousModuleId);
  }

  public isModuleCompleted(moduleId: string): boolean {
    const normalizedId = normalizeModuleId(moduleId);
    return this.state.completedModuleIds.includes(normalizedId);
  }

  public unlockModule(moduleId: string): void {
    const normalizedId = normalizeModuleId(moduleId);
    if (!this.state.unlockedModuleIds.includes(normalizedId)) {
      this.state.unlockedModuleIds.push(normalizedId);
      this.persistAndNotify();
    }
  }

  public startNewGame(rawName: string, selectedGame?: GameGroupId): { success: boolean; cleanedName: string; error?: string } {
    const { isValid, cleanedName, error } = validateAndCleanFullName(rawName);
    if (!isValid) {
      return { success: false, cleanedName, error };
    }

    this.resetSession();
    this.state.playerSession.fullName = cleanedName;
    this.state.playerSession.startedAt = new Date().toISOString();

    if (selectedGame) {
      this.selectGame(selectedGame);
    }

    this.persistAndNotify();
    return { success: true, cleanedName };
  }

  public saveResult(moduleId: string, result: MissionResult): void {
    const normalizedId = normalizeModuleId(moduleId);
    if (!this.moduleOrder.includes(normalizedId) || !this.isModuleUnlocked(normalizedId)) return;
    this.state.results[normalizedId] = structuredClone(result);
    this.completeModule(normalizedId);
    this.persistAndNotify();
  }

  public completeModule(moduleId: string): void {
    const normalizedId = normalizeModuleId(moduleId);
    if (!this.moduleOrder.includes(normalizedId) || !this.isModuleUnlocked(normalizedId)) return;

    let changed = false;
    if (!this.state.completedModuleIds.includes(normalizedId)) {
      this.state.completedModuleIds.push(normalizedId);
      changed = true;

      if (this.state.selectedGame) {
        const group = GAME_GROUPS[this.state.selectedGame];
        if (group && normalizedId === group.modules[0]) {
          const nextModuleId = group.modules[1];
          if (!this.state.unlockedModuleIds.includes(nextModuleId)) {
            this.state.unlockedModuleIds.push(nextModuleId);
          }
        }
      } else {
        const currentIndex = this.moduleOrder.indexOf(normalizedId);
        if (currentIndex !== -1 && currentIndex + 1 < this.moduleOrder.length) {
          const nextModuleId = this.moduleOrder[currentIndex + 1];
          if (!this.state.unlockedModuleIds.includes(nextModuleId)) {
            this.state.unlockedModuleIds.push(nextModuleId);
          }
        }
      }
    }

    // Keep playerSession.completedModules in sync
    if (!this.state.playerSession.completedModules.includes(normalizedId)) {
      this.state.playerSession.completedModules.push(normalizedId);
      changed = true;
    }

    // Freeze completion timestamp once when selected game is completed
    if (this.isCurrentGameCompleted() && !this.state.playerSession.completedAt) {
      this.state.playerSession.completedAt = new Date().toISOString();
      changed = true;
    }

    if (changed) {
      this.persistAndNotify();
    }
  }

  public setCurrentModule(moduleId: string): void {
    if (!this.isModuleUnlocked(moduleId)) return;
    this.state.currentModuleId = moduleId;
    this.persistAndNotify();
  }

  public setAudioMuted(isMuted: boolean): void {
    if (this.state.isAudioMuted === isMuted) return;
    this.state.isAudioMuted = isMuted;
    this.persistAndNotify();
  }

  public toggleAudioMuted(): boolean {
    this.setAudioMuted(!this.state.isAudioMuted);
    return this.state.isAudioMuted;
  }

  /**
   * Reset game progress (retains session if any)
   */
  public resetProgress(): void {
    if (this.state.selectedGame) {
      const group = GAME_GROUPS[this.state.selectedGame];
      this.state.unlockedModuleIds = [group.modules[0]];
      this.state.currentModuleId = group.modules[0];
    } else {
      this.state.unlockedModuleIds = ['gobeklitepe'];
      this.state.currentModuleId = 'gobeklitepe';
    }
    this.state.completedModuleIds = [];
    this.state.results = {};
    this.state.playerSession.completedModules = [];
    this.state.playerSession.completedAt = null;
    this.persistAndNotify();
  }

  /**
   * Full Kiosk Session Reset: clears player name, selected game, session, scores, and progress.
   * Does NOT delete previously issued certificates from the backend.
   */
  public resetSession(): void {
    this.state.selectedGame = null;
    this.state.unlockedModuleIds = ['gobeklitepe'];
    this.state.completedModuleIds = [];
    this.state.results = {};
    this.state.currentModuleId = 'gobeklitepe';
    this.state.playerSession = createEmptyPlayerSession();
    this.persistAndNotify();
  }

  private persistAndNotify(): void {
    this.persist();
    EventBus.emit('store-changed', this.getState());
  }

  private persist(): void {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify({ isAudioMuted: this.state.isAudioMuted }));
    } catch {
      // Kiosk browsers can disable storage; gameplay remains available in memory.
    }
  }

  private restore(): void {
    try {
      const rawState = window.localStorage.getItem(this.storageKey);
      if (!rawState) return;

      const savedState: Partial<GameProgressState> = JSON.parse(rawState);
      this.state.isAudioMuted = savedState.isAudioMuted === true;
    } catch {
      this.state.isAudioMuted = false;
    }
  }
}

export const GameStore = new GameStoreManager();
export { REQUIRED_MODULE_IDS };
