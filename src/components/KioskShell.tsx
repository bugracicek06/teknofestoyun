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
  generateCertificateId,
  generateCertificateNumber,
  formatCertificateDate,
  MODULE_DISPLAY_INFO,
  REQUIRED_MODULE_IDS,
  certificateRepository,
} from '../game/systems/certificate.ts';
import { generateCertificateQr } from '../game/systems/qr';
import hero from '../assets/landing_hero_bg.jpg';
import pau from '../assets/logos/pau_logo.png';
import teknofest from '../assets/logos/teknofest_logo.png';
import { MissionCard } from './MissionCard';
import { MISSION_CARD_IMAGES } from '../data/cardImages';
import { GobeklitepeMissionShell } from './GobeklitepeMissionShell';
import { CiniSanatiMissionShell } from './CiniSanatiMissionShell';
import { DevrimOtomobiliMissionShell } from './devrim/DevrimOtomobiliMissionShell';
import { ModuleIntroScreen } from './ModuleIntroScreen';
import { getModuleIntroConfig } from '../data/moduleIntros';
import { DEV_UNLOCK_ALL_LEVELS } from '../config/devConfig';

type Panel = 'intro' | 'help' | 'pause' | 'idle' | 'result' | null;

export function KioskShell({ game }: { game: Phaser.Game | null }) {
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
  const [creationStatus, setCreationStatus] = useState<CertificateCreationStatus>('idle');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrTargetUrl, setQrTargetUrl] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [certNumber, setCertNumber] = useState<string>(state.playerSession.certificateNumber || '');

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
  const allComplete = GameStore.isAllModulesCompleted();
  const next = GAME_MODULES.find(m => !state.completedModuleIds.includes(m.id));

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
    }
    setPanel(null);
    game.scene.getScenes(false).forEach(s => {
      if (s.sys.isActive() || s.sys.isPaused()) game.scene.stop(s.sys.settings.key);
    });
    game.scene.start(key);
  };

  const handleStartJourney = () => {
    const res = GameStore.setPlayerFullName(playerNameInput);
    if (!res.success) {
      setNameError(res.error || 'Lütfen adınızı ve soyadınızı girin.');
      return;
    }
    SoundFx.playTelemetryBeep();
    navigate(SceneKeys.WORLD_MAP);
  };

  // Idempotent Certificate Creation & QR Generation
  const handleCreateOrFetchCertificate = useCallback(async (forceRetry = false) => {
    if (creatingLockRef.current) return;
    if (!allComplete) return;

    const existingCertId = state.playerSession.certificateId;

    // 1. If certificate already exists in session, don't create duplicate!
    if (existingCertId && !forceRetry) {
      if (creationStatus !== 'created') {
        setCreationStatus('creating');
        creatingLockRef.current = true;
        try {
          const qrRes = await generateCertificateQr(existingCertId);
          if (qrRes.success && qrRes.dataUrl) {
            setQrDataUrl(qrRes.dataUrl);
            setQrTargetUrl(qrRes.targetUrl || null);
            setCertNumber(state.playerSession.certificateNumber || '');
            setCreationStatus('created');
          } else {
            setCreationStatus('error');
            setCreationError(qrRes.error || 'QR kod oluşturulamadı.');
          }
        } catch (err: any) {
          setCreationStatus('error');
          setCreationError(err?.message || 'Sertifika bağlantısı şu anda oluşturulamıyor.');
        } finally {
          creatingLockRef.current = false;
        }
      }
      return;
    }

    if (creationStatus === 'creating' || (creationStatus === 'created' && !forceRetry)) {
      return;
    }

    creatingLockRef.current = true;
    setCreationStatus('creating');
    setCreationError(null);

    try {
      const certId = draftRecordRef.current?.certificateId || generateCertificateId();
      const completedAt = state.playerSession.completedAt || new Date().toISOString();
      const cNumber = draftRecordRef.current?.certificateNumber || generateCertificateNumber(completedAt);

      const record: CertificateRecord = {
        certificateId: certId,
        certificateNumber: cNumber,
        fullName: state.playerSession.fullName || 'Genç Kâşif',
        completedAt,
        completedModules: [...state.completedModuleIds],
        projectName: 'Medeniyetten Millî Teknolojiye',
        results: state.results,
      };

      draftRecordRef.current = record;

      // Persist certificate on authoritative server API
      const createdRecord = await certificateRepository.create(record);

      // Update central store with server-confirmed certificate data
      GameStore.setCertificateData(createdRecord.certificateId, createdRecord.certificateNumber);
      setCertNumber(createdRecord.certificateNumber);

      // Generate QR Code with server-confirmed certificateId
      const qrRes = await generateCertificateQr(createdRecord.certificateId);
      if (qrRes.success && qrRes.dataUrl) {
        setQrDataUrl(qrRes.dataUrl);
        setQrTargetUrl(qrRes.targetUrl || null);
        setCreationStatus('created');
      } else {
        setCreationStatus('error');
        setCreationError(qrRes.error || 'Sertifika bağlantısı oluşturulamadı.');
      }
    } catch (err: any) {
      console.error('[Kiosk] Certificate creation error:', err);
      setCreationStatus('error');
      setCreationError('Sertifika bağlantısı oluşturulamadı.');
    } finally {
      creatingLockRef.current = false;
    }
  }, [allComplete, creationStatus, state.playerSession, state.completedModuleIds, state.results]);

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
        setSelected(GAME_MODULES.find(m => !GameStore.isModuleCompleted(m.id))?.id || 'uzay_teknolojileri');
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

    EventBus.on('current-scene-ready', ready);
    EventBus.on('store-changed', changed);
    EventBus.on('mission-result', result);
    EventBus.on('asset-progress', progress);
    EventBus.on('gobeklitepe-progress', gobeklitepeHandler);
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
    if (panel && !isModuleIntro && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
    if (!panel || isModuleIntro) {
      dialogRef.current?.close();
    }
  }, [panel]);

  // Trigger certificate creation once when final screen opens with all 6 modules completed
  useEffect(() => {
    if (panel === 'result' && allComplete && creationStatus === 'idle') {
      handleCreateOrFetchCertificate();
    }
  }, [panel, allComplete, creationStatus, handleCreateOrFetchCertificate]);

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
                ? `linear-gradient(90deg, rgba(7,17,31,0.94) 0%, rgba(7,17,31,0.84) 30%, rgba(7,17,31,0.48) 52%, rgba(7,17,31,0.12) 72%, rgba(7,17,31,0.04) 86%, rgba(7,17,31,0.22) 100%), linear-gradient(180deg, rgba(7,17,31,0.45) 0%, transparent 20%, transparent 78%, rgba(7,17,31,0.72) 100%), url(${hero})`
                : `linear-gradient(180deg, rgba(5,14,27,0.65) 0%, rgba(5,14,27,0.86) 100%), linear-gradient(90deg, rgba(5,14,27,0.72) 0%, rgba(5,14,27,0.42) 50%, rgba(5,14,27,0.72) 100%), url(${hero})`,
          }}
        >
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

          {sceneKey === SceneKeys.START ? (
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
                  <span>Kâşif Adı & Soyadı</span>
                  <small>Başarı sertifikanız bu isimle oluşturulacaktır</small>
                </label>
                <div className="start-input-wrap">
                  <input
                    id="player-name-input"
                    type="text"
                    className="start-player-input"
                    placeholder="Örn. Ahmet Yılmaz"
                    value={playerNameInput}
                    maxLength={50}
                    autoComplete="off"
                    onChange={e => {
                      setPlayerNameInput(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleStartJourney();
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
                  onClick={handleStartJourney}
                  aria-label="Yolculuğa Başla"
                >
                  <span>Yolculuğa Başla</span>
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
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>6 durak</span>
                </span>
                <span className="meta-divider" aria-hidden="true" />
                <span className="hero-meta-item">
                  <svg className="meta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>4–6 dakikalık keşif</span>
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
                  const isUnlocked = DEV_UNLOCK_ALL_LEVELS || state.unlockedModuleIds.includes(m.id);
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
                            if (DEV_UNLOCK_ALL_LEVELS && !state.unlockedModuleIds.includes(m.id)) {
                              GameStore.unlockModule(m.id);
                            }
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
                  disabled={!DEV_UNLOCK_ALL_LEVELS && !GameStore.isModuleUnlocked(selected)}
                  onClick={() => {
                    const m = GAME_MODULES.find(m => m.id === selected);
                    if (m && (DEV_UNLOCK_ALL_LEVELS || GameStore.isModuleUnlocked(m.id))) {
                      if (DEV_UNLOCK_ALL_LEVELS && !state.unlockedModuleIds.includes(m.id)) {
                        GameStore.unlockModule(m.id);
                      }
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
          onBack={() => navigate(SceneKeys.WORLD_MAP)}
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
          onBack={() => navigate(SceneKeys.WORLD_MAP)}
          onToggleAudio={() => {
            GameStore.toggleAudioMuted();
            stopNarration();
          }}
          onHelp={() => pause('help')}
          onPause={() => pause('pause')}
          onToggleFullscreen={toggleFullscreen}
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

      {sceneKey !== SceneKeys.GOBEKLITEPE && sceneKey !== SceneKeys.ANADOLU_USTALIGI && sceneKey !== SceneKeys.SANAYILESME && (
        <nav
          className={`control-bar ${menu ? 'landing-controls' : 'in-game'}`}
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
          {!menu && sceneKey !== 'loading' && (
            <button onClick={() => pause('pause')} title="Oyunu Duraklat">
              <svg className="control-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              <span>Duraklat</span>
            </button>
          )}
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

      {/* Main Kiosk Dialog */}
      <dialog
        ref={dialogRef}
        className={`kiosk-dialog ${allComplete && panel === 'result' ? 'kiosk-dialog-final' : ''}`}
        aria-label="Oyun bilgisi"
        onCancel={e => {
          e.preventDefault();
          stopNarration();
          if (panel !== 'result') resume();
        }}
      >
        {panel === 'result' && result ? (
          allComplete ? (
            /* ALL 6 MODULES COMPLETED: FINAL CELEBRATION & DIGITAL CERTIFICATE SCREEN */
            <div className="final-celebration-container">
              <div className="final-confetti-badge">🎉 BÜYÜK BAŞARI · 6 GÖREV TAMAMLANDI</div>
              <h2 className="final-title">
                Tebrikler, <span className="final-title-name">{state.playerSession.fullName || 'Genç Kâşif'}</span>!
              </h2>
              <p className="final-subtitle">
                Medeniyetten Millî Teknolojiye yolculuğunu başarıyla tamamladın.
              </p>

              {/* 6 Stage Timeline */}
              <div className="final-timeline" aria-label="6 Aşamalı Keşif Yolculuğu">
                {REQUIRED_MODULE_IDS.map(modId => {
                  const info = MODULE_DISPLAY_INFO[modId];
                  return (
                    <div key={modId} className="final-timeline-step">
                      <span className="final-step-badge">{info.step}</span>
                      <span className="final-step-name">{info.title}</span>
                      <span className="final-step-check" aria-label="Tamamlandı">✓</span>
                    </div>
                  );
                })}
              </div>

              {/* Digital Certificate Ready Area */}
              <div className="final-cert-card">
                <div className="final-cert-content">
                  <div className="final-cert-info-col">
                    <h3>Dijital Sertifikan Hazır!</h3>
                    <p>
                      Pamukkale Üniversitesi ve TEKNOFEST onaylı resmi başarı sertifikan senin adına oluşturuldu.
                      Telefonunla QR kodu okutarak sertifikanı yüksek kalitede görüntüleyebilir ve PDF veya görsel olarak indirebilirsin.
                    </p>
                    <div className="final-cert-meta-row">
                      <div className="final-meta-item">
                        <span>Katılımcı</span>
                        <strong>{state.playerSession.fullName || 'Genç Kâşif'}</strong>
                      </div>
                      <div className="final-meta-item">
                        <span>Tamamlanma Tarihi</span>
                        <strong>
                          {formatCertificateDate(state.playerSession.completedAt || new Date().toISOString())}
                        </strong>
                      </div>
                      {certNumber && (
                        <div className="final-meta-item">
                          <span>Sertifika No</span>
                          <strong className="final-meta-code">{certNumber}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Code Section (ONLY ON FINAL SCREEN, NOT ON CERTIFICATE) */}
                  <div className="final-qr-col">
                    {creationStatus === 'creating' && (
                      <div className="final-cert-qr-placeholder">
                        <div className="cert-spinner" />
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sertifikan hazırlanıyor…</span>
                      </div>
                    )}

                    {creationStatus === 'created' && qrDataUrl && (
                      <>
                        <div className="final-qr-box" title={qrTargetUrl || 'Sertifika İndirme Adresi'}>
                          <img
                            src={qrDataUrl}
                            alt="Sertifika İndirme QR Kodu"
                            className="final-qr-image"
                          />
                        </div>
                        <p className="final-qr-caption">
                          Telefonunla QR kodu okut ve sertifikanı indir.
                        </p>
                        {certNumber && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {certNumber}
                          </span>
                        )}
                      </>
                    )}

                    {creationStatus === 'error' && (
                      <div className="final-cert-error-box">
                        <p>{creationError || 'Sertifika bağlantısı oluşturulamadı.'}</p>
                        <button
                          type="button"
                          className="btn-retry-cert"
                          onClick={() => handleCreateOrFetchCertificate(true)}
                        >
                          Tekrar Dene
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="final-actions-row">
                <button type="button" onClick={() => navigate(SceneKeys.WORLD_MAP)}>
                  Görev Haritası
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => navigate(SceneKeys.START, true)}
                  aria-label="Yeni Oyuncu Başlat"
                >
                  Yeni Kâşif / Çıkış
                </button>
              </div>
            </div>
          ) : (
            /* Single module result (not all 6 finished yet) */
            <>
              <p className="eyebrow">GÖREV TAMAMLANDI</p>
              <h2>{current.title}</h2>
              <div className="stars" aria-label={`${result.starCount} yıldız`}>
                {'★'.repeat(result.starCount)}
                {'☆'.repeat(3 - result.starCount)}
              </div>
              <div className="result-metrics">
                <span><b>{result.finalScore}</b>puan</span>
                <span><b>{result.elapsedSeconds} sn</b>oyun süresi</span>
                <span><b>{result.errorCount}</b>yeniden deneme</span>
              </div>
              <p>
                1000 puandan her hatalı deneme için 40 puan düşer; en az 300 puan. 0–2 hata: 3, 3–5 hata: 2, daha fazlası: 1 yıldız. Süre puanı etkilemez.
              </p>

              <div className="dialog-actions">
                <button onClick={() => navigate(SceneKeys.WORLD_MAP)}>Görev Haritası</button>
                <button
                  className="primary"
                  onClick={() => next && navigate(next.sceneKey)}
                >
                  Sonraki Görev →
                </button>
              </div>
            </>
          )
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
