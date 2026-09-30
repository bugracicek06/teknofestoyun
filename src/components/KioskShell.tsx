import { useEffect, useRef, useState, useCallback } from 'react';
import type Phaser from 'phaser';
import { EventBus } from '../game/state/EventBus';
import { GameStore } from '../game/state/GameStore';
import { GAME_MODULES } from '../data/modules';
import { SceneKeys } from '../types/game';
import { THEME } from '../game/systems/theme';
import { SoundFx } from '../game/utils/audio';
import {
  toggleNarration,
  stopNarration,
  onNarrationChange,
  NarrationManager,
} from '../game/systems/narration';
import type { NarrationState } from '../game/systems/narration';
import { getNarrationByModuleId } from '../data/narrations';
import {
  type CertificateRecord,
  type CertificateCreationStatus,
  createCertificateAuthoritative,
  verifyCertificateOnServer,
} from '../game/systems/certificate.ts';
import { generateCertificateQr } from '../game/systems/qr';
import {
  type GameGroupId,
  GAME_GROUPS,
  GAME_GROUP_LIST,
  getGameGroupByModuleId,
  getModuleStepInGame,
  isSecondModuleOfGame,
  getNextModuleInGame,
} from '../config/gameGroups';
import hero from '../assets/landing_hero_bg.jpg';
import homeHeroBg from '../assets/home/home-hero-background.png';
import pau from '../assets/logos/pau_logo.png';
import teknokent from '../assets/logos/teknokent_logo.png';
import teknofest from '../assets/logos/teknofest_logo.png';
import { MissionCard } from './MissionCard';
import { MISSION_CARD_IMAGES } from '../data/cardImages';
import { GobeklitepeMissionShell } from './GobeklitepeMissionShell';
import { DemirCagiMissionShell } from './demir/DemirCagiMissionShell';
import { CiniSanatiMissionShell } from './CiniSanatiMissionShell';
import { DevrimOtomobiliMissionShell } from './devrim/DevrimOtomobiliMissionShell';
import { MilliTeknolojiMissionShell } from './milli/MilliTeknolojiMissionShell';
import { UzayTeknolojileriMissionShell } from './uzay/UzayTeknolojileriMissionShell';
import { ModuleIntroScreen } from './ModuleIntroScreen';
import { getModuleIntroConfig } from '../data/moduleIntros';
import { MissionCompleteModal } from './game-ui';
import { preloadCriticalSceneAssets } from '../game/utils/assetPreloader';

type Panel = 'intro' | 'help' | 'pause' | 'idle' | 'result' | null;

export function KioskShell({ game }: { game: Phaser.Game | null }) {
  // Pre-decode critical background assets in idle time to eliminate scene transition flickers
  useEffect(() => {
    preloadCriticalSceneAssets([
      homeHeroBg,
      hero,
      pau,
      teknofest,
      '/assets/uzay/space_hangar_bg.jpg',
      '/assets/uzay/earth_orbit_cinematic_bg.jpg',
    ]);
  }, []);
  const [sceneKey, setSceneKey] = useState<string>('loading');
  const [state, setState] = useState(GameStore.getState());
  const [selected, setSelected] = useState('gobeklitepe');
  const [panel, setPanel] = useState<Panel>(null);
  const [failure, setFailure] = useState('');
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [civilMission, setCivilMission] = useState('forest_fire');
  const [spaceMission, setSpaceMission] = useState('mapping');
  const [gobeklitepePlacedCount, setGobeklitepePlacedCount] = useState(0);
  const [gobeklitepePlacedIds, setGobeklitepePlacedIds] = useState<string[]>([]);
  const [gobeklitepeSelectedId, setGobeklitepeSelectedId] = useState<string | null>(null);
  const [narrationState, setNarrationState] = useState<NarrationState>(NarrationManager.getState());

  // Player Name & Certificate States
  const [playerNameInput, setPlayerNameInput] = useState(state.playerSession.fullName || '');
  const [nameError, setNameError] = useState('');
  const [landingStep, setLandingStep] = useState<'name' | 'select-game'>(
    state.playerSession.fullName ? 'select-game' : 'name'
  );
  const [activeGameId, setActiveGameId] = useState<GameGroupId>(
    state.selectedGame || 'game-1'
  );
  const [creationStatus, setCreationStatus] = useState<CertificateCreationStatus>('idle');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrTargetUrl, setQrTargetUrl] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [certNumber, setCertNumber] = useState<string>(state.playerSession.certificateNumber || '');

  // Standardized Shared UI States for Demir Cagi and Module Completion
  const [demirCagiHud, setDemirCagiHud] = useState<{
    missionTitle: string;
    progressText: string;
    timeText: string;
  }>({
    missionTitle: 'Demir Cevheri ve Kömürü Ocağa Sürükle',
    progressText: 'İLERLEME: 0/2',
    timeText: '00:00',
  });
  const [demirCagiAssistantMessage, setDemirCagiAssistantMessage] = useState<string>(
    'Ahşap körük kolunu pompalayarak ocağı tavında tut.'
  );
  const [showFinalCelebrationScreen, setShowFinalCelebrationScreen] = useState<boolean>(false);

  const draftRecordRef = useRef<CertificateRecord | null>(null);
  const creatingLockRef = useRef(false);

  const interruptedPanel = useRef<Panel>(null);
  const lastActivity = useRef(Date.now());
  const activeKey = useRef(sceneKey);
  const panelRef = useRef<Panel>(null);
  const transition = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  activeKey.current = sceneKey;
  panelRef.current = panel;
  const moduleIndex = GAME_MODULES.findIndex(m => m.sceneKey === sceneKey);
  const current = GAME_MODULES[moduleIndex];
  const currentNarration = current ? getNarrationByModuleId(current.id) : undefined;
  const isCurrentNarrating = narrationState.isPlaying && narrationState.currentId === current?.id;
  const introConfig = current ? getModuleIntroConfig(current.id) : undefined;
  const menu = sceneKey === SceneKeys.START || sceneKey === SceneKeys.WORLD_MAP;
  const activeGameGroup = GameStore.getCurrentGameGroup() || (current ? getGameGroupByModuleId(current.id) : null);
  const isGameComplete = GameStore.isCurrentGameCompleted();
  const currentStepInGame = current ? getModuleStepInGame(current.id, activeGameGroup?.id) : 1;
  const isCurrentModuleFinal = current ? isSecondModuleOfGame(current.id, activeGameGroup?.id) : false;
  const nextModuleInGame = current ? getNextModuleInGame(current.id, activeGameGroup?.id) : null;

  const pause = (kind: Panel) => {
    stopNarration();
    if (game?.scene.isActive(activeKey.current)) game.scene.pause(activeKey.current);
    setPanel(kind);
  };

  const resume = () => {
    stopNarration();
    lastActivity.current = Date.now();
    if (panel === 'idle' && interruptedPanel.current) {
      setPanel(interruptedPanel.current);
      return;
    }
    if (game?.scene.isPaused(activeKey.current)) game.scene.resume(activeKey.current);
    setPanel(null);
  };

  const navigate = (key: string, reset = false) => {
    if (!game || transition.current) return;

    // Route / Scene Level Guard:
    const targetModule = GAME_MODULES.find(m => m.sceneKey === key);
    if (targetModule) {
      const selectedGame = GameStore.getSelectedGame();
      if (!selectedGame) {
        console.warn(`[KioskShell] No game selected. Redirecting to Start screen.`);
        key = SceneKeys.START;
      } else {
        const group = GAME_GROUPS[selectedGame];
        if (!group || !group.modules.includes(targetModule.id as any)) {
          console.warn(`[KioskShell] Access denied to module ${targetModule.id} not in ${selectedGame}. Redirecting to game start.`);
          const firstMod = GAME_MODULES.find(m => m.id === group.modules[0]);
          key = firstMod ? firstMod.sceneKey : SceneKeys.START;
        } else if (!GameStore.isModuleUnlocked(targetModule.id)) {
          console.warn(`[KioskShell] Access denied to locked module ${targetModule.id}. Redirecting to first module.`);
          const firstMod = GAME_MODULES.find(m => m.id === group.modules[0]);
          key = firstMod ? firstMod.sceneKey : SceneKeys.START;
        }
      }
    }

    transition.current = true;
    stopNarration();
    game.registry.set('civilMission', civilMission);
    game.registry.set('spaceMission', spaceMission);
    if (reset) {
      GameStore.resetSession();
      setPlayerNameInput('');
      setNameError('');
      setCreationStatus('idle');
      setQrDataUrl(null);
      setQrTargetUrl(null);
      setCreationError(null);
      setCertNumber('');
      draftRecordRef.current = null;
      creatingLockRef.current = false;
      setCivilMission('forest_fire');
      setSpaceMission('mapping');
      setLandingStep('name');
      setActiveGameId('game-1');
    }
    setPanel(null);
    setShowFinalCelebrationScreen(false);
    game.scene.getScenes(false).forEach(s => {
      if (s.sys.isActive() || s.sys.isPaused()) game.scene.stop(s.sys.settings.key);
    });
    game.scene.start(key);
  };

  const handleContinueToGameSelection = () => {
    const res = GameStore.setPlayerFullName(playerNameInput);
    if (!res.success) {
      setNameError(res.error || 'Lütfen adınızı ve soyadınızı girin.');
      return;
    }
    setNameError('');
    setLandingStep('select-game');
    SoundFx.playTelemetryBeep();
  };

  const handleStartGame = (gameId: GameGroupId) => {
    const currentName = (state.playerSession.fullName || playerNameInput).trim();
    if (!currentName || currentName.length < 2) {
      setLandingStep('name');
      setNameError('Lütfen adınızı ve soyadınızı girin.');
      return;
    }

    GameStore.setPlayerFullName(currentName);
    GameStore.selectGame(gameId);
    setActiveGameId(gameId);
    setSelected(GAME_GROUPS[gameId].modules[0]);
    SoundFx.playTelemetryBeep();

    const group = GAME_GROUPS[gameId];
    const firstModuleId = group.modules[0];
    const firstMod = GAME_MODULES.find(m => m.id === firstModuleId);
    if (firstMod) {
      navigate(firstMod.sceneKey);
    }
  };

  // Idempotent Certificate Creation & QR Generation
  const handleCreateOrFetchCertificate = useCallback(async (forceRetry = false) => {
    if (creatingLockRef.current) return;
    if (!GameStore.isCurrentGameCompleted()) return;

    const existingCertId = state.playerSession.certificateId || GameStore.getPlayerSession().certificateId;

    // 1. If certificate already exists in session, verify it on remote server first!
    if (existingCertId && !forceRetry) {
      if (creationStatus !== 'created') {
        setCreationStatus('creating');
        creatingLockRef.current = true;
        try {
          const isVerified = await verifyCertificateOnServer(existingCertId);
          if (isVerified) {
            const qrRes = await generateCertificateQr(existingCertId);
            if (qrRes.success && qrRes.dataUrl) {
              setQrDataUrl(qrRes.dataUrl);
              setQrTargetUrl(qrRes.targetUrl || null);
              setCertNumber(state.playerSession.certificateNumber || GameStore.getPlayerSession().certificateNumber || '');
              setCreationStatus('created');
              return;
            }
          }
          // If existingCertId was not verified on server, proceed to authoritative creation below
        } catch (err: any) {
          console.error('[Kiosk] Existing certificate verification error:', err);
        } finally {
          creatingLockRef.current = false;
        }
      } else {
        return;
      }
    }

    if (creationStatus === 'creating' || (creationStatus === 'created' && !forceRetry)) {
      return;
    }

    creatingLockRef.current = true;
    setCreationStatus('creating');
    setCreationError(null);

    try {
      const participantName = (state.playerSession.fullName || GameStore.getPlayerSession().fullName || '').trim() || 'Genç Kâşif';
      const completedAt = state.playerSession.completedAt || GameStore.getPlayerSession().completedAt || new Date().toISOString();
      const currentGroup = GameStore.getCurrentGameGroup();
      const completedModules = currentGroup ? [...currentGroup.modules] : [...GameStore.getState().completedModuleIds];

      // Authoritative remote creation & read-back verification:
      // Backend generates authoritative UUID, persists it, and verifyCertificateOnServer confirms GET 200
      const createdRecord = await createCertificateAuthoritative({
        fullName: participantName,
        completedAt,
        completedModules,
        selectedGame: currentGroup?.id,
        results: GameStore.getState().results,
      });

      // Update central store with server-confirmed certificate data
      GameStore.setCertificateData(createdRecord.certificateId, createdRecord.certificateNumber);
      setCertNumber(createdRecord.certificateNumber);

      // ONLY after backend persistence is 100% verified, generate QR Code with server-confirmed certificateId
      const qrRes = await generateCertificateQr(createdRecord.certificateId);
      if (qrRes.success && qrRes.dataUrl) {
        setQrDataUrl(qrRes.dataUrl);
        setQrTargetUrl(qrRes.targetUrl || null);
        setCreationStatus('created');
      } else {
        setCreationStatus('error');
        setCreationError('Sertifika QR kodu oluşturulamadı. Tekrar deneyiniz.');
      }
    } catch (err: any) {
      console.error('[Kiosk] Certificate creation error:', err);
      setCreationStatus('error');
      setCreationError('Sertifikanız hazırlanıyor... Lütfen bekleyip tekrar deneyin.');
    } finally {
      creatingLockRef.current = false;
    }
  }, [creationStatus, state.playerSession]);

  useEffect(() => {
    if (!game) return;
    const ready = (key: string) => {
      transition.current = false;
      activeKey.current = key;
      setSceneKey(key);
      lastActivity.current = Date.now();
      const module = GAME_MODULES.find(m => m.sceneKey === key);
      if (module) {
        GameStore.setCurrentModule(module.id);
        game.scene.pause(key);
        setPanel('intro');
      } else {
        setPanel(null);
        setSelected(GAME_MODULES.find(m => !GameStore.isModuleCompleted(m.id) && GameStore.isModuleUnlocked(m.id))?.id || 'gobeklitepe');
      }
    };
    const changed = () => setState(GameStore.getState());
    const progress = (value: number) => setLoadingProgress(Math.round(value * 100));
    const result = () => {
      game.scene.pause(activeKey.current);
      setPanel('result');
    };
    const activity = () => {
      if (panelRef.current !== 'idle') lastActivity.current = Date.now();
    };
    const hidden = () => {
      if (document.hidden && GAME_MODULES.some(m => m.sceneKey === activeKey.current) && !panelRef.current) {
        game.scene.pause(activeKey.current);
        setPanel('pause');
      }
    };
    const context = (e: Event) => e.preventDefault();
    const error = () => {
      setFailure('Oyun bir sorunla karşılaştı. Yeni bir oturum başlatabilirsin.');
      game.loop.sleep();
    };
    const fs = () => setFullscreen(!!document.fullscreenElement);
    const gobeklitepeHandler = (count: number, ids: string[], sel: string | null) => {
      setGobeklitepePlacedCount(count);
      setGobeklitepePlacedIds(ids);
      setGobeklitepeSelectedId(sel);
    };

    const onHudUpdate = (data: { missionTitle?: string; progressText?: string; timeText?: string }) => {
      if (!data) return;
      setDemirCagiHud(prev => ({
        missionTitle: data.missionTitle || prev.missionTitle,
        progressText: data.progressText || prev.progressText,
        timeText: data.timeText || prev.timeText,
      }));
    };
    const onAssistantMsg = (msg: string) => {
      if (msg) setDemirCagiAssistantMessage(msg);
    };

    EventBus.on('current-scene-ready', ready);
    EventBus.on('store-changed', changed);
    EventBus.on('mission-result', result);
    EventBus.on('asset-progress', progress);
    EventBus.on('gobeklitepe-progress', gobeklitepeHandler);
    EventBus.on('module-hud-update', onHudUpdate);
    EventBus.on('assistant-message', onAssistantMsg);
    const unsubNarration = onNarrationChange(setNarrationState);

    document.addEventListener('pointerdown', activity);
    document.addEventListener('keydown', activity);
    document.addEventListener('visibilitychange', hidden);
    document.addEventListener('contextmenu', context);
    document.addEventListener('fullscreenchange', fs);
    window.addEventListener('error', error);
    window.addEventListener('unhandledrejection', error);

    const timer = window.setInterval(() => {
      if (activeKey.current === SceneKeys.START || activeKey.current === 'loading') return;
      const idle = Date.now() - lastActivity.current;
      if (idle >= THEME.idleResetMs) {
        // Complete Kiosk Session Reset
        GameStore.resetSession();
        stopNarration();
        setPlayerNameInput('');
        setNameError('');
        setCreationStatus('idle');
        setQrDataUrl(null);
        setQrTargetUrl(null);
        setCreationError(null);
        setCertNumber('');
        draftRecordRef.current = null;
        creatingLockRef.current = false;
        setCivilMission('forest_fire');
        setSpaceMission('mapping');
        setPanel(null);
        game.scene.getScenes(false).forEach(s => {
          if (s.sys.isActive() || s.sys.isPaused()) game.scene.stop(s.sys.settings.key);
        });
        game.scene.start(SceneKeys.START);
      } else if (idle >= THEME.idleWarningMs && panelRef.current !== 'idle') {
        interruptedPanel.current = panelRef.current;
        game.scene.pause(activeKey.current);
        setPanel('idle');
      }
    }, 1000);

    const existing = game.scene.getScenes(true)[0];
    if (existing?.sys.settings.key) ready(existing.sys.settings.key);

    return () => {
      EventBus.off('current-scene-ready', ready);
      EventBus.off('store-changed', changed);
      EventBus.off('mission-result', result);
      EventBus.off('asset-progress', progress);
      EventBus.off('gobeklitepe-progress', gobeklitepeHandler);
      EventBus.off('module-hud-update', onHudUpdate);
      EventBus.off('assistant-message', onAssistantMsg);
      document.removeEventListener('pointerdown', activity);
      document.removeEventListener('keydown', activity);
      document.removeEventListener('visibilitychange', hidden);
      document.removeEventListener('contextmenu', context);
      document.removeEventListener('fullscreenchange', fs);
      window.removeEventListener('error', error);
      window.removeEventListener('unhandledrejection', error);
      unsubNarration();
      stopNarration();
      clearInterval(timer);
    };
  }, [game]);

  // Dialog management
  useEffect(() => {
    const isModuleIntro = panel === 'intro';
    const isSharedComplete = panel === 'result' && (!isGameComplete || !showFinalCelebrationScreen);
    if (panel && !isModuleIntro && !isSharedComplete && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
    if (!panel || isModuleIntro || isSharedComplete) {
      dialogRef.current?.close();
    }
  }, [panel, isGameComplete, showFinalCelebrationScreen]);

  // Automatically trigger certificate creation when 2/2 modules are completed and final screen opens
  useEffect(() => {
    if (panel === 'result' && GameStore.isCurrentGameCompleted() && creationStatus === 'idle') {
      handleCreateOrFetchCertificate();
    }
  }, [panel, creationStatus, handleCreateOrFetchCertificate]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFailure('Tam ekran açılamadı. Tarayıcı iznini kontrol edip tekrar deneyebilirsin.');
    }
  };

  const result = current && state.results[current.id];

  return (
    <>
      {menu && (
        <main
          className={`menu-surface ${sceneKey === SceneKeys.START ? 'landing' : 'map'}`}
          style={{
            backgroundImage:
              sceneKey === SceneKeys.START
                ? `linear-gradient(90deg, rgba(6, 16, 29, 0.68) 0%, rgba(6, 16, 29, 0.42) 22%, rgba(6, 16, 29, 0.12) 34%, transparent 44%), url(${homeHeroBg})`
                : `linear-gradient(180deg, rgba(5,14,27,0.65) 0%, rgba(5,14,27,0.86) 100%), linear-gradient(90deg, rgba(5,14,27,0.72) 0%, rgba(5,14,27,0.42) 50%, rgba(5,14,27,0.72) 100%), url(${hero})`,
          }}
        >
          {sceneKey !== SceneKeys.START && (
            <header className="brand-bar">
              <img className="pau-logo" src={pau} alt="Pamukkale Üniversitesi" />
              <div className="brand-separator" aria-hidden="true" />
              <img className="festival-logo" src={teknofest} alt="TEKNOFEST" />
              {sceneKey === SceneKeys.WORLD_MAP && state.playerSession.fullName && (
                <div className="player-badge">
                  <span>Kâşif:</span>
                  <strong>{state.playerSession.fullName}</strong>
                </div>
              )}
            </header>
          )}

          {sceneKey === SceneKeys.START ? (
            landingStep === 'name' ? (
              <section className="hero-copy">
                <p className="eyebrow">KEŞFET · ÜRET · TASARLA</p>
                <h1>
                  <span>Medeniyetten</span>
                  <em className="title-highlight">Millî Teknolojiye</em>
                </h1>
                <p>
                  Geçmişi keşfet, teknolojiyi deneyimle,<br />
                  geleceği kendi ellerinle tasarla.
                </p>

                {/* Player Name Input Card */}
                <div className="start-player-card">
                  <label htmlFor="player-name-input" className="start-input-label">
                    <span>KAŞİF ADI & SOYADI</span>
                    <small>Başarı sertifikanız bu isimle oluşturulacaktır</small>
                  </label>
                  <div className="start-input-wrap">
                    <input
                      id="player-name-input"
                      type="text"
                      className="start-player-input"
                      placeholder="Adınızı ve soyadınızı yazın..."
                      value={playerNameInput}
                      maxLength={50}
                      autoComplete="off"
                      onChange={e => {
                        setPlayerNameInput(e.target.value);
                        if (nameError) setNameError('');
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleContinueToGameSelection();
                        }
                      }}
                    />
                  </div>
                  {nameError && (
                    <p className="start-name-error" role="alert">
                      {nameError}
                    </p>
                  )}
                  <button
                    type="button"
                    className="primary start-cta-btn"
                    onClick={handleContinueToGameSelection}
                    aria-label="Oyununu Seç"
                  >
                    <span>OYUNUNU SEÇ</span>
                    <svg
                      className="cta-arrow"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>

                <div className="hero-meta-row" aria-label="Keşif Özeti">
                  <span className="hero-meta-item">
                    <svg className="meta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>3 Bağımsız Oyun</span>
                  </span>
                  <span className="meta-divider" aria-hidden="true" />
                  <span className="hero-meta-item">
                    <svg className="meta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>2'şer Bölüm (3–5 dk)</span>
                  </span>
                  <span className="meta-divider" aria-hidden="true" />
                  <span className="hero-meta-item">
                    <svg className="meta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>5–15 yaş</span>
                  </span>
                </div>
              </section>
            ) : (
              /* Step 2: OYUNUNU SEÇ */
              <section className="game-select-section" aria-label="Oyununu Seç">
                <header className="brand-bar game-select-brand-bar">
                  <img className="pau-logo" src={pau} alt="Pamukkale Üniversitesi" />
                  <div className="brand-separator" aria-hidden="true" />
                  <img className="teknokent-logo" src={teknokent} alt="Pamukkale Teknokent" />
                  <div className="brand-separator" aria-hidden="true" />
                  <img className="festival-logo" src={teknofest} alt="TEKNOFEST" />
                  <div className="player-badge">
                    <span>Kâşif:</span>
                    <strong>{playerNameInput || state.playerSession.fullName}</strong>
                    <button
                      type="button"
                      className="badge-edit-btn"
                      onClick={() => setLandingStep('name')}
                      title="Adı Değiştir"
                      aria-label="Adı Değiştir"
                    >
                      ✎
                    </button>
                  </div>
                </header>

                <div className="game-select-header">
                  <p className="eyebrow">TEKNOFEST 2026 ŞANLIURFA</p>
                  <h1 className="game-select-main-title">OYUNUNU SEÇ</h1>
                  <p className="game-select-subtitle">
                    Oynamak istediğin 2 bölümlük keşif yolculuğunu seç ve başla.
                  </p>
                </div>

                <div className="game-select-grid" role="region" aria-label="Oyun Seçenekleri">
                  {GAME_GROUP_LIST.map((group) => {
                    const isSelected = activeGameId === group.id;
                    return (
                      <div
                        key={group.id}
                        className={`game-select-card ${isSelected ? 'is-selected' : ''}`}
                        data-game={group.id}
                        onClick={() => {
                          setActiveGameId(group.id);
                          SoundFx.playTelemetryBeep();
                        }}
                        onDoubleClick={() => handleStartGame(group.id)}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`${group.badge}: ${group.title}`}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleStartGame(group.id);
                          }
                        }}
                      >
                        <div className="game-card-header">
                          <span className="game-card-badge">{group.badge}</span>
                          <span className="game-card-tag">{group.tagline}</span>
                        </div>

                        <div className="game-card-icon-wrap" aria-hidden="true">
                          <span className="game-card-icon">{group.icon}</span>
                        </div>

                        <h2 className="game-card-title">{group.title}</h2>

                        <div className="game-card-modules-box">
                          <div className="game-card-module-row">
                            <span className="mod-number-dot">1</span>
                            <div className="mod-text-group">
                              <strong className="mod-title">{group.moduleNames[0]}</strong>
                              <span className="mod-sub">{group.moduleSubtitles[0]}</span>
                            </div>
                          </div>

                          <div className="game-card-plus-separator" aria-hidden="true">+</div>

                          <div className="game-card-module-row">
                            <span className="mod-number-dot">2</span>
                            <div className="mod-text-group">
                              <strong className="mod-title">{group.moduleNames[1]}</strong>
                              <span className="mod-sub">{group.moduleSubtitles[1]}</span>
                            </div>
                          </div>
                        </div>

                        <div className="game-card-cta-wrap">
                          <button
                            type="button"
                            className={`game-card-btn ${isSelected ? 'is-active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartGame(group.id);
                            }}
                          >
                            <span>{isSelected ? 'BAŞLA' : 'SEÇ'}</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <footer className="game-select-bottom-bar">
                  <button
                    type="button"
                    className="action-btn-back-step"
                    onClick={() => setLandingStep('name')}
                    title="İsmi Değiştir"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>İsmi Değiştir</span>
                  </button>

                  <div className="game-select-summary-pill">
                    <span className="summary-label">Seçilen Macera:</span>
                    <strong className="summary-title">{GAME_GROUPS[activeGameId].title}</strong>
                    <span className="summary-tag">({GAME_GROUPS[activeGameId].tagline})</span>
                  </div>

                  <button
                    type="button"
                    className="primary start-main-btn"
                    onClick={() => handleStartGame(activeGameId)}
                    aria-label={`${GAME_GROUPS[activeGameId].title} Macerasına Başla`}
                  >
                    <span>BAŞLA</span>
                    <svg className="cta-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </footer>
              </section>
            )
          ) : (
            <section className="journey">
              <div className="journey-header-wrap">
                <div className="journey-title-group">
                  <p className="eyebrow">TAŞTAN GELECEĞE</p>
                  <h1 className="journey-main-title">
                    Senin keşif <span className="title-gold">yolculuğun</span>
                  </h1>
                  <p className="journey-subtitle">
                    Geçmişin izinde, bilimin rehberliğinde, daha güçlü bir geleceğe.
                  </p>
                </div>

                <div
                  className="journey-progress-card"
                  role="status"
                  aria-label={`İlerleme: ${state.completedModuleIds.length} / 6 görev tamamlandı`}
                >
                  <div className="progress-card-top">
                    <strong className="progress-card-count">
                      {state.completedModuleIds.length}/6
                    </strong>
                    <span className="progress-card-label">
                      görev<br />tamamlandı
                    </span>
                  </div>
                  <div className="progress-bar-track" aria-hidden="true">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${(state.completedModuleIds.length / GAME_MODULES.length) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="progress-card-note">
                    {state.completedModuleIds.length === 0
                      ? 'Keşif şimdi başlıyor!'
                      : state.completedModuleIds.length === GAME_MODULES.length
                      ? 'Tüm görevler tamamlandı!'
                      : 'Yolculuğun devam ediyor.'}
                  </p>
                </div>
              </div>

              <div className="mission-grid-container" role="region" aria-label="Görev Seçimi">
                {GAME_MODULES.map((m, i) => {
                  const completed = state.completedModuleIds.includes(m.id);
                  const isUnlocked = GameStore.isModuleUnlocked(m.id);
                  const locked = !isUnlocked;
                  const status = locked
                    ? 'locked'
                    : selected === m.id
                    ? 'selected'
                    : completed
                    ? 'completed'
                    : 'available';
                  const isSelected = selected === m.id;

                  return (
                    <MissionCard
                      key={m.id}
                      index={i}
                      id={m.id}
                      title={m.title}
                      era={m.era}
                      description={m.description}
                      icon={m.icon}
                      imageSrc={MISSION_CARD_IMAGES[m.id]}
                      status={status}
                      score={state.results[m.id]?.finalScore}
                      isSelected={isSelected}
                      onSelect={() => {
                        if (selected === m.id) {
                          if (isUnlocked) {
                            navigate(m.sceneKey);
                          }
                        } else {
                          setSelected(m.id);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {selected === 'milli_teknoloji' && (
                <div className="sub-mission-banner">
                  <label className="sub-mission-label">
                    <span>Sivil Görev Tercihi:</span>
                    <select value={civilMission} onChange={e => setCivilMission(e.target.value)}>
                      <option value="forest_fire">Yangın tespiti & İzleme</option>
                      <option value="search_rescue">Afet haritalama & Kurtarma</option>
                      <option value="agricultural">Hassas tarım analizi</option>
                    </select>
                  </label>
                </div>
              )}
              {selected === 'uzay_teknolojileri' && (
                <div className="sub-mission-banner">
                  <label className="sub-mission-label">
                    <span>Uzay Görev Tercihi:</span>
                    <select value={spaceMission} onChange={e => setSpaceMission(e.target.value)}>
                      <option value="mapping">Yüzey haritalama görevi</option>
                      <option value="surface">Gezegen yüzeyi keşif</option>
                      <option value="deep_space">Derin uzay gözlem</option>
                    </select>
                  </label>
                </div>
              )}

              <footer className="journey-action-bar">
                <button
                  type="button"
                  className="action-btn-home"
                  onClick={() => navigate(SceneKeys.START, false)}
                  title="Ana Ekrana Dön"
                  aria-label="Ana Ekran"
                >
                  <svg
                    className="home-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Ana Ekran</span>
                </button>

                <div className="action-desc-container">
                  <span className="action-divider" aria-hidden="true" />
                  <span className="action-context-icon" aria-hidden="true">
                    {GAME_MODULES.find(m => m.id === selected)?.icon || '🏛️'}
                  </span>
                  <p className="action-desc-text">
                    {GAME_MODULES.find(m => m.id === selected)?.description}
                  </p>
                </div>

                <button
                  type="button"
                  className="primary action-btn-start"
                  disabled={!GameStore.isModuleUnlocked(selected)}
                  onClick={() => {
                    const m = GAME_MODULES.find(m => m.id === selected);
                    if (m && GameStore.isModuleUnlocked(m.id)) {
                      navigate(m.sceneKey);
                    }
                  }}
                  aria-label={state.completedModuleIds.includes(selected) ? 'Görevi Tekrar Oyna' : 'Göreve Başla'}
                >
                  <span>{state.completedModuleIds.includes(selected) ? 'Tekrar Oyna' : 'Göreve Başla'}</span>
                  <svg
                    className="cta-arrow"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </footer>
            </section>
          )}
        </main>
      )}

      {sceneKey === 'loading' && (
        <div className="loading" role="status">
          <h1>Keşif hazırlanıyor…</h1>
          <p>Oyun görselleri yükleniyor: %{loadingProgress}</p>
          <progress max={100} value={loadingProgress} />
        </div>
      )}

      {sceneKey === SceneKeys.GOBEKLITEPE && (
        <GobeklitepeMissionShell
          placedCount={gobeklitepePlacedCount}
          placedIds={gobeklitepePlacedIds}
          selectedId={gobeklitepeSelectedId}
          isAudioMuted={state.isAudioMuted}
          fullscreen={fullscreen}
          isIntro={panel === 'intro'}
          isNarrating={narrationState.isPlaying && narrationState.currentId === 'gobeklitepe'}
          onHazirim={resume}
          onListenInstruction={() => toggleNarration('gobeklitepe')}
          onHome={() => navigate(SceneKeys.START, false)}
          onBack={() => navigate(SceneKeys.WORLD_MAP)}
          onToggleAudio={() => {
            GameStore.toggleAudioMuted();
            stopNarration();
          }}
          onHelp={() => pause('help')}
          onPause={() => pause('pause')}
          onToggleFullscreen={toggleFullscreen}
          onSelectAnimal={animalId => EventBus.emit('gobeklitepe-select-piece', animalId)}
        />
      )}

      {sceneKey === SceneKeys.ANADOLU_USTALIGI && (
        <CiniSanatiMissionShell
          isAudioMuted={state.isAudioMuted}
          fullscreen={fullscreen}
          onHome={() => navigate(SceneKeys.START, false)}
          onBack={() => navigate(SceneKeys.START, false)}
          onToggleAudio={() => {
            GameStore.toggleAudioMuted();
            stopNarration();
          }}
          onHelp={() => pause('help')}
          onPause={() => pause('pause')}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {sceneKey === SceneKeys.SANAYILESME && (
        <DevrimOtomobiliMissionShell
          isAudioMuted={state.isAudioMuted}
          fullscreen={fullscreen}
          onHome={() => navigate(SceneKeys.START, false)}
          onBack={() => navigate(SceneKeys.START, false)}
          onToggleAudio={() => {
            GameStore.toggleAudioMuted();
            stopNarration();
          }}
          onHelp={() => pause('help')}
          onPause={() => pause('pause')}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {sceneKey === SceneKeys.MILLI_TEKNOLOJI && (
        <MilliTeknolojiMissionShell
          isAudioMuted={state.isAudioMuted}
          fullscreen={fullscreen}
          onHome={() => navigate(SceneKeys.START, false)}
          onBack={() => navigate(SceneKeys.START, false)}
          onToggleAudio={() => {
            GameStore.toggleAudioMuted();
            stopNarration();
          }}
          onHelp={() => pause('help')}
          onPause={() => pause('pause')}
          onToggleFullscreen={toggleFullscreen}
          onNextMission={() => navigate(SceneKeys.UZAY_TEKNOLOJILERI)}
        />
      )}

      {sceneKey === SceneKeys.UZAY_TEKNOLOJILERI && (
        <UzayTeknolojileriMissionShell
          isAudioMuted={state.isAudioMuted}
          fullscreen={fullscreen}
          onHome={() => navigate(SceneKeys.START, false)}
          onBack={() => navigate(SceneKeys.START, false)}
          onToggleAudio={() => {
            GameStore.toggleAudioMuted();
            stopNarration();
          }}
          onHelp={() => pause('help')}
          onPause={() => pause('pause')}
          onToggleFullscreen={toggleFullscreen}
          onCompleteAdventure={() => {
            setPanel('result');
            handleCreateOrFetchCertificate();
          }}
        />
      )}

      {/* Cinematic Module Intro Screen for modules 2 through 6 */}
      {panel === 'intro' && sceneKey !== SceneKeys.GOBEKLITEPE && introConfig && (
        <ModuleIntroScreen
          config={introConfig}
          isNarrating={isCurrentNarrating}
          onListenInstruction={() => current && toggleNarration(current.id)}
          onHazirim={resume}
          onHome={() => navigate(SceneKeys.START, false)}
        />
      )}

      {/* Module 2: Demir Çağı Unified Mission Shell */}
      {sceneKey === SceneKeys.DEMIR_CAGI && panel !== 'intro' && (
        <DemirCagiMissionShell
          missionTitle={demirCagiHud.missionTitle}
          progressText={demirCagiHud.progressText}
          timeText={demirCagiHud.timeText}
          assistantMessage={demirCagiAssistantMessage || 'Kızıl demir cevheri ve meşe kömürünü ocağa sürükle.'}
          isAudioMuted={state.isAudioMuted}
          fullscreen={fullscreen}
          onBack={() => navigate(SceneKeys.START, false)}
          onToggleAudio={() => {
            GameStore.toggleAudioMuted();
            stopNarration();
          }}
          onPause={() => pause('pause')}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Landing Controls only for Menu Screens (Start & World Map) */}
      {menu && (
        <nav
          className="control-bar landing-controls"
          aria-label="Oyun kontrolleri"
        >
          <button
            onClick={() => {
              GameStore.toggleAudioMuted();
              stopNarration();
            }}
            aria-pressed={!state.isAudioMuted}
            title={state.isAudioMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {state.isAudioMuted ? (
              <svg className="control-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg className="control-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
            <span>{state.isAudioMuted ? 'Ses: Kapalı' : 'Ses: Açık'}</span>
          </button>
          <button onClick={() => pause('help')} title="Yardım ve Oyun Bilgisi">
            <svg className="control-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Yardım</span>
          </button>
          <button onClick={toggleFullscreen} title={fullscreen ? 'Ekranı Küçült' : 'Tam Ekran'}>
            <svg className="control-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {fullscreen ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
            <span>{fullscreen ? 'Ekranı Küçült' : 'Tam Ekran'}</span>
          </button>
        </nav>
      )}

      {/* =========================================================================
          STANDARDIZED MISSION COMPLETE MODAL (2-MODULE GROUP PROGRESSION)
          ========================================================================= */}
      {panel === 'result' && result && (!isGameComplete || !showFinalCelebrationScreen) && (
        <MissionCompleteModal
          isOpen={true}
          moduleNumber={currentStepInGame}
          stepInGame={currentStepInGame}
          moduleTitle={current ? current.title.split('–')[0].trim() : 'BÖLÜM'}
          moduleSubtitle={current && current.title.includes('–') ? current.title.split('–')[1].trim() : ''}
          score={result.finalScore}
          timeText={`${result.elapsedSeconds} sn`}
          mistakesCount={result.errorCount}
          starsCount={result.starCount}
          accentKey={current?.id as any}
          isFinalModule={isCurrentModuleFinal}
          nextModuleTitle={nextModuleInGame ? GAME_MODULES.find(m => m.id === nextModuleInGame)?.title.split('–')[0].trim() : undefined}
          onMapClick={() => {
            setPanel(null);
            navigate(SceneKeys.START, false);
          }}
          onNextClick={() => {
            if (isCurrentModuleFinal) {
              setShowFinalCelebrationScreen(true);
              handleCreateOrFetchCertificate();
            } else if (nextModuleInGame) {
              setPanel(null);
              GameStore.unlockModule(nextModuleInGame);
              const nextModObj = GAME_MODULES.find(m => m.id === nextModuleInGame);
              if (nextModObj) {
                navigate(nextModObj.sceneKey);
              }
            }
          }}
        />
      )}

      {/* Main Kiosk Dialog */}
      <dialog
        ref={dialogRef}
        className={`kiosk-dialog ${isGameComplete && panel === 'result' ? 'kiosk-dialog-final' : ''}`}
        aria-label="Oyun bilgisi"
        onCancel={e => {
          e.preventDefault();
          stopNarration();
          if (panel !== 'result') resume();
        }}
      >
        {panel === 'result' && result ? (
          isGameComplete && showFinalCelebrationScreen ? (
            <div className="final-celebration-container">
              {/* Başlık: 🏆 MACERA BAŞARIYLA TAMAMLANDI */}
              <h2 className="final-title">
                🏆 MACERA BAŞARIYLA TAMAMLANDI
              </h2>

              {/* Altında: Tebrikler, Kaşif! */}
              <p className="final-subtitle" aria-label="TEBRİKLER, KÂŞİF!">
                Tebrikler, Kaşif!
              </p>

              {/* [OYUNCUNUN ADI SOYADI] */}
              <div className="final-player-name-display">
                {((state.playerSession.fullName || GameStore.getPlayerSession().fullName || 'Genç Kâşif').trim()).toLocaleUpperCase('tr-TR')}
              </div>

              {/* Metin */}
              <p className="final-description-text">
                {activeGameGroup?.completionText || 'Medeniyetten Millî Teknolojiye yolculuğundaki 2 bölümü başarıyla tamamladın.'}
              </p>

              {/* 2 / 2 BÖLÜM TAMAMLANDI */}
              <div className="final-status-pill">
                <span className="final-status-dot" aria-hidden="true" />
                <span>2 / 2 BÖLÜM TAMAMLANDI</span>
              </div>

              {/* Büyük ve rahat okutulabilir QR kod alanı */}
              <div className="final-qr-section" data-action="SERTİFİKAMI OLUŞTUR">
                {creationStatus === 'creating' && (
                  <div className="final-qr-loading-box">
                    <div className="cert-spinner" aria-hidden="true" />
                    <span className="final-qr-loading-text">SERTİFİKAN HAZIRLANIYOR...</span>
                  </div>
                )}

                {(creationStatus === 'created' || state.playerSession.certificateId) && qrDataUrl && (
                  <div className="final-qr-ready-card">
                    <div className="final-qr-code-wrapper" title={qrTargetUrl || 'Sertifika Adresi'}>
                      <img
                        src={qrDataUrl}
                        alt="Sertifika QR Kodu"
                        className="final-qr-code-img"
                        width={220}
                        height={220}
                      />
                    </div>
                    <div className="final-qr-info-column">
                      <h3 className="final-qr-heading">SERTİFİKAN HAZIR</h3>
                      <p className="final-qr-instruction">
                        Sana özel hazırlanan başarı sertifikanı görüntülemek için QR kodu telefonunla okut.
                      </p>
                      {certNumber && (
                        <span className="final-cert-number-tag">
                          Belge No: {certNumber}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {creationStatus === 'error' && (
                  <div className="final-cert-error-box">
                    <p>{creationError || 'Sertifika hazırlanamadı.'}</p>
                    <button
                      type="button"
                      className="btn-retry-cert"
                      onClick={() => handleCreateOrFetchCertificate(true)}
                    >
                      TEKRAR DENE
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="final-actions-row">
                <button
                  type="button"
                  className="final-btn-secondary"
                  onClick={() => navigate(SceneKeys.START, true)}
                  aria-label="Yeni Kaşif Başlat"
                >
                  YENİ KAŞİF BAŞLAT
                </button>
              </div>
            </div>
          ) : null
        ) : (
          /* Intro / Pause / Help dialogs */
          <>
            <p className="eyebrow">
              {panel === 'intro' ? `${moduleIndex + 1}. DURAK` : 'MEDENİYETTEN MİLLÎ TEKNOLOJİYE'}
            </p>
            <h2>
              {panel === 'idle'
                ? 'Keşfe devam ediyor musun?'
                : panel === 'pause'
                ? 'Kısa bir mola'
                : current?.title || 'Nasıl oynanır?'}
            </h2>
            <div className="touch-demo" aria-hidden="true">☝ → ◎</div>
            <p>
              {panel === 'idle'
                ? '20 saniye içinde ana ekrana dönülecek ve bu oturum temizlenecek.'
                : currentNarration
                ? currentNarration.displayInstruction
                : 'Bölümleri sırayla aç. Dokun, seç veya sürükle; yanlış yaptığında yeniden dene.'}
            </p>
            {currentNarration && !state.isAudioMuted && (panel === 'intro' || panel === 'help') && (
              <button
                type="button"
                className={`btn-dialog-listen ${isCurrentNarrating ? 'is-playing' : ''}`}
                onClick={() => toggleNarration(currentNarration)}
                aria-label={isCurrentNarrating ? 'Yönergeyi Durdur' : 'Yönergeyi Dinle'}
                title={isCurrentNarrating ? 'Yönergeyi Durdur' : 'Yönergeyi Dinle'}
              >
                <span className="dialog-listen-icon" aria-hidden="true">
                  {isCurrentNarrating ? (
                    <span className="audio-wave-bars">
                      <span className="bar bar-1" />
                      <span className="bar bar-2" />
                      <span className="bar bar-3" />
                    </span>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  )}
                </span>
                <span>{isCurrentNarrating ? 'Yönerge Çalıyor (Durdur)' : 'Yönergeyi Dinle'}</span>
              </button>
            )}
            {panel === 'intro' && <p>Süre, “Hazırım” düğmesine dokunduğunda başlar.</p>}
            <div className="dialog-actions">
              <button className="primary" onClick={resume}>
                {panel === 'intro' ? 'Hazırım' : 'Devam Et'}
              </button>
              {current && panel !== 'intro' && (
                <button onClick={() => navigate(sceneKey)}>Bölümü Yeniden Başlat</button>
              )}
              <button onClick={() => navigate(SceneKeys.START, false)}>Ana Ekran</button>
            </div>
          </>
        )}
      </dialog>

      {failure && (
        <div className="recovery" role="alert">
          <h2>Birlikte devam edelim</h2>
          <p>{failure}</p>
          <button onClick={() => location.reload()}>Oyunu Yeniden Aç</button>
          <button onClick={() => setFailure('')}>Kapat</button>
        </div>
      )}
    </>
  );
}
