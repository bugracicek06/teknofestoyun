import { GameStore } from '../state/GameStore.ts';
import { SoundFx, NARRATION_DUCK_LEVEL } from '../utils/audio.ts';
import type { NarrationItem } from '../../data/narrations.ts';
import {
  MODULE_NARRATIONS,
  getNarrationByModuleId,
  getNarrationBySceneKey,
} from '../../data/narrations.ts';

export interface NarrationState {
  isPlaying: boolean;
  currentId: string | null;
  providerName: string | null;
}

export interface INarrationProvider {
  name: string;
  play(
    item: NarrationItem,
    onStart: () => void,
    onEnd: () => void,
    onError: (err: unknown) => void
  ): Promise<boolean>;
  stop(): void;
  isPlaying(): boolean;
}

/**
 * Fast pre-flight check to verify if a media file exists on the server
 * and is not an HTML SPA fallback (which servers like Vite return with 200 text/html).
 */
async function checkAudioFileExists(url: string): Promise<boolean> {
  if (!url || typeof window === 'undefined') return false;
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
    if (!res.ok) return false;
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    // In SPA servers (like Vite dev), non-existent assets return 200 with text/html
    if (contentType.includes('text/html')) {
      return false;
    }
    // Check for standard audio mime types or raw binary octet-stream
    if (
      contentType.includes('audio') ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('video/mp4')
    ) {
      return true;
    }
    return res.status === 200;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------
// 1. AudioFileNarrationProvider
// Plays pre-recorded professional studio/neural audio files (/audio/narration/*.mp3)
// If file is missing or unplayable, fast-fails immediately to WebSpeech.
// ----------------------------------------------------------------------
export class AudioFileNarrationProvider implements INarrationProvider {
  public readonly name = 'AudioFile';
  private currentAudio: HTMLAudioElement | null = null;
  private playing = false;

  public async play(
    item: NarrationItem,
    onStart: () => void,
    onEnd: () => void,
    onError: (err: unknown) => void
  ): Promise<boolean> {
    this.stop();

    if (!item.audioPath) {
      return false;
    }

    // Fast check: avoid creating an Audio element on a missing file or SPA HTML fallback
    const exists = await checkAudioFileExists(item.audioPath);
    if (!exists) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      try {
        const audio = new Audio();
        this.currentAudio = audio;
        let resolved = false;

        const cleanup = () => {
          this.playing = false;
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          audio.onplay = null;
          audio.onended = null;
          audio.onerror = null;
        };

        const safeResolve = (success: boolean) => {
          if (!resolved) {
            resolved = true;
            resolve(success);
          }
        };

        audio.onplay = () => {
          this.playing = true;
          onStart();
          safeResolve(true);
        };

        audio.onended = () => {
          cleanup();
          onEnd();
        };

        audio.onerror = (e) => {
          cleanup();
          if (!this.playing) {
            safeResolve(false);
          } else {
            onError(e);
          }
        };

        // Safety timeout: If audio cannot start playing within 1200ms, fail over to WebSpeech
        const timerId = window.setTimeout(() => {
          if (!this.playing) {
            cleanup();
            safeResolve(false);
          }
        }, 1200);

        audio.src = item.audioPath;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              window.clearTimeout(timerId);
            })
            .catch((err) => {
              window.clearTimeout(timerId);
              cleanup();
              if (!this.playing) {
                console.warn('[Narration] Audio file play() failed, falling back to WebSpeech:', err);
                safeResolve(false);
              } else {
                onError(err);
              }
            });
        }
      } catch {
        this.stop();
        resolve(false);
      }
    });
  }

  public stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Safe fallback
      }
      this.currentAudio = null;
    }
    this.playing = false;
  }

  public isPlaying(): boolean {
    return this.playing && !!this.currentAudio && !this.currentAudio.paused;
  }
}

// ----------------------------------------------------------------------
// 2. WebSpeechNarrationProvider
// High-grade Turkish voice selection with asynchronous voice initialization,
// quality scoring, race-condition mitigation, and Chrome bug protection.
// ----------------------------------------------------------------------
export class WebSpeechNarrationProvider implements INarrationProvider {
  public readonly name = 'WebSpeech';
  private playing = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private cachedBestVoice: SpeechSynthesisVoice | null = null;
  private heartbeatTimer: number | null = null;

  constructor() {
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          this.cachedBestVoice = this.pickBestTurkishVoice(voices);
        }
      } catch {
        // Voice loading safe fallback
      }
    };

    loadVoices();
    try {
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
    } catch {
      // Safe fallback
    }
  }

  /**
   * Scores voices based on language match and natural neural quality.
   * Priority:
   * 1. tr-TR / tr language filter
   * 2. Microsoft Online Natural (Ahmet / Emel)
   * 3. Google Türkçe
   * 4. Apple Siri / Enhanced / Yelda / Cem
   * 5. Local standard Turkish voices (Tolga / Filiz)
   * 6. Default fallback (never blocks speech)
   */
  public pickBestTurkishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    // 1. Strict tr-TR match
    const trTRVoices = voices.filter((v) => {
      const lang = (v.lang || '').replace('_', '-').toLowerCase();
      return lang === 'tr-tr';
    });

    // 2. Any tr* match
    const anyTrVoices = voices.filter((v) => {
      const lang = (v.lang || '').replace('_', '-').toLowerCase();
      return lang.startsWith('tr');
    });

    const candidates = trTRVoices.length > 0 ? trTRVoices : anyTrVoices;

    if (candidates.length === 0) {
      // No Turkish voices installed on this OS/browser.
      // Return default voice or null so browser uses system default with lang = 'tr-TR'
      return voices.find((v) => v.default) || null;
    }

    let bestVoice = candidates[0];
    let bestScore = -1;

    for (const voice of candidates) {
      let score = 10;
      const name = (voice.name || '').toLowerCase();

      // Priority 1: Natural / Online Neural voices (Edge/Chrome/Windows)
      if (name.includes('natural') || name.includes('online') || name.includes('neural')) {
        score += 100;
      }
      if (name.includes('ahmet') || name.includes('emel')) {
        score += 30;
      }
      // Priority 2: Google Turkish
      if (name.includes('google')) {
        score += 70;
      }
      // Priority 3: Apple Siri & Enhanced
      if (name.includes('siri') || name.includes('enhanced') || name.includes('premium')) {
        score += 60;
      }
      if (name.includes('yelda') || name.includes('cem')) {
        score += 25;
      }
      // Priority 4: High quality remote service
      if (voice.localService === false) {
        score += 40;
      }
      // Priority 5: Standard local Microsoft Turkish voices
      if (name.includes('tolga') || name.includes('filiz')) {
        score += 20;
      }
      if (voice.default) {
        score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestVoice = voice;
      }
    }

    return bestVoice;
  }

  public async play(
    item: NarrationItem,
    onStart: () => void,
    onEnd: () => void,
    onError: (err: unknown) => void
  ): Promise<boolean> {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      !('SpeechSynthesisUtterance' in window)
    ) {
      console.warn('[Narration] Web Speech API not supported in this environment');
      return false;
    }

    try {
      // 1. Cancel any ongoing speech and unpause if browser got stuck in paused state
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // 2. Select voice safely (never throws, never blocks)
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice =
        (voices && voices.length > 0 ? this.pickBestTurkishVoice(voices) : null) ||
        this.cachedBestVoice ||
        null;

      if (selectedVoice) {
        this.cachedBestVoice = selectedVoice;
      }

      // 3. Create utterance
      const utterance = new SpeechSynthesisUtterance(item.narrationText);
      utterance.lang = 'tr-TR';
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Prosody tailored for friendly, clear museum narrator
      utterance.rate = 0.94;
      utterance.pitch = 1.02;
      utterance.volume = 1.0;

      this.currentUtterance = utterance;

      let started = false;

      const cleanup = () => {
        this.playing = false;
        this.currentUtterance = null;
        if (this.heartbeatTimer !== null) {
          window.clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
      };

      utterance.onstart = () => {
        if (!started) {
          started = true;
          this.playing = true;
          onStart();

          // Workaround for Chrome 14s silence bug: periodically pulse pause/resume
          if (this.heartbeatTimer !== null) window.clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = window.setInterval(() => {
            if (this.playing && window.speechSynthesis.speaking) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }
          }, 10000);
        }
      };

      utterance.onend = () => {
        cleanup();
        onEnd();
      };

      utterance.onerror = (event) => {
        cleanup();
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.warn('[Narration] WebSpeech error:', event.error);
          onError(event);
        } else {
          onEnd();
        }
      };

      // 4. Speak immediately in the execution context
      window.speechSynthesis.speak(utterance);

      // Fallback safety check: in case browser delays onstart event, trigger started state
      window.setTimeout(() => {
        if (!started && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
          started = true;
          this.playing = true;
          onStart();
        }
      }, 80);

      return true;
    } catch (err) {
      console.error('[Narration] WebSpeech failed to initiate:', err);
      onError(err);
      return false;
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // Safe fallback
      }
    }
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
    }
    this.currentUtterance = null;
    this.playing = false;
  }

  public isPlaying(): boolean {
    return this.playing;
  }
}

// ----------------------------------------------------------------------
// 3. NarrationCoordinator (Singleton Manager)
// Orchestrates AudioFile -> WebSpeech -> Fallback chain,
// manages audio ducking, single-playback isolation, and state listeners.
// ----------------------------------------------------------------------
class NarrationCoordinator {
  private providers: INarrationProvider[] = [
    new AudioFileNarrationProvider(),
    new WebSpeechNarrationProvider(),
  ];

  private currentState: NarrationState = {
    isPlaying: false,
    currentId: null,
    providerName: null,
  };

  private listeners = new Set<(state: NarrationState) => void>();
  private activeSessionToken = 0;

  private emitState(): void {
    const copy = { ...this.currentState };
    for (const listener of this.listeners) {
      try {
        listener(copy);
      } catch {
        // Safe listener error boundary
      }
    }
  }

  public subscribe(listener: (state: NarrationState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.currentState });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): NarrationState {
    return { ...this.currentState };
  }

  public isPlaying(): boolean {
    return this.currentState.isPlaying;
  }

  public getCurrentId(): string | null {
    return this.currentState.currentId;
  }

  public stop(): void {
    this.activeSessionToken++;
    for (const provider of this.providers) {
      try {
        provider.stop();
      } catch {
        // Safe fallback
      }
    }
    // Restore sound effects gain unconditionally
    try {
      SoundFx.unduck();
    } catch {
      // Non-critical ducking recovery
    }

    if (this.currentState.isPlaying || this.currentState.currentId !== null) {
      this.currentState = {
        isPlaying: false,
        currentId: null,
        providerName: null,
      };
      this.emitState();
    }
  }

  public async play(itemOrKey: NarrationItem | string): Promise<void> {
    if (GameStore.getState().isAudioMuted) {
      console.log('[Narration] Audio is muted in game settings');
      return;
    }

    // Resolve NarrationItem data-driven
    let item: NarrationItem | undefined;
    if (typeof itemOrKey === 'string') {
      item =
        getNarrationByModuleId(itemOrKey) ||
        getNarrationBySceneKey(itemOrKey) ||
        MODULE_NARRATIONS[itemOrKey];

      if (!item) {
        // Wrap raw instruction string into a dynamic item
        item = {
          id: 'dynamic',
          moduleId: 'dynamic',
          sceneKey: '',
          title: 'Yönerge',
          audioPath: '',
          displayInstruction: itemOrKey,
          narrationText: itemOrKey,
        };
      }
    } else {
      item = itemOrKey;
    }

    if (!item || !item.narrationText) {
      console.error('[Narration] Missing narration text for module:', itemOrKey);
      return;
    }

    console.log('[Narration] Listen button clicked');
    console.log('[Narration] Module:', item.moduleId || item.id);
    console.log('[Narration] Text:', item.narrationText);

    // Stop previous playback before starting new one
    this.stop();

    const sessionToken = ++this.activeSessionToken;

    // Execute provider fallback chain: AudioFile -> WebSpeech -> Safe Fallback
    for (const provider of this.providers) {
      if (sessionToken !== this.activeSessionToken) return;

      const success = await provider.play(
        item,
        // onStart
        () => {
          if (sessionToken !== this.activeSessionToken) {
            provider.stop();
            return;
          }
          try {
            SoundFx.duck(NARRATION_DUCK_LEVEL);
          } catch {
            // Non-critical ducking
          }
          this.currentState = {
            isPlaying: true,
            currentId: item.id,
            providerName: provider.name,
          };
          console.log('[Narration] Provider:', provider.name);
          console.log('[Narration] Playback started');
          this.emitState();
        },
        // onEnd
        () => {
          if (sessionToken === this.activeSessionToken) {
            try {
              SoundFx.unduck();
            } catch {
              // Non-critical
            }
            this.currentState = {
              isPlaying: false,
              currentId: null,
              providerName: null,
            };
            this.emitState();
          }
        },
        // onError
        (err) => {
          if (sessionToken === this.activeSessionToken) {
            console.error('[Narration] Playback failed:', err);
            try {
              SoundFx.unduck();
            } catch {
              // Non-critical
            }
            this.currentState = {
              isPlaying: false,
              currentId: null,
              providerName: null,
            };
            this.emitState();
          }
        }
      );

      if (success) {
        // Successfully started with this provider, break chain
        return;
      }
    }

    // If all providers fail or are unavailable, ensure ducking is restored
    console.warn('[Narration] All providers failed or not available for:', item.id);
    try {
      SoundFx.unduck();
    } catch {
      // Non-critical
    }
    this.currentState = {
      isPlaying: false,
      currentId: null,
      providerName: null,
    };
    this.emitState();
  }

  public toggle(itemOrKey: NarrationItem | string): Promise<void> {
    const targetId = typeof itemOrKey === 'string' ? itemOrKey : itemOrKey.id;
    if (this.currentState.isPlaying && (this.currentState.currentId === targetId || !targetId)) {
      this.stop();
      return Promise.resolve();
    }
    return this.play(itemOrKey);
  }
}

export const NarrationManager = new NarrationCoordinator();

// ----------------------------------------------------------------------
// Public API Functions
// ----------------------------------------------------------------------
export function speakInstruction(itemOrKey: NarrationItem | string): void {
  NarrationManager.play(itemOrKey).catch(() => {
    try {
      SoundFx.unduck();
    } catch {
      // Non-critical
    }
  });
}

export function toggleNarration(itemOrKey: NarrationItem | string): void {
  NarrationManager.toggle(itemOrKey).catch(() => {
    try {
      SoundFx.unduck();
    } catch {
      // Non-critical
    }
  });
}

export function stopNarration(): void {
  NarrationManager.stop();
}

export function isNarrationPlaying(): boolean {
  return NarrationManager.isPlaying();
}

export function onNarrationChange(listener: (state: NarrationState) => void): () => void {
  return NarrationManager.subscribe(listener);
}

/**
 * Non-blocking audio preloading helper for future mp3 assets
 */
export function preloadNarrationAudio(item: NarrationItem): void {
  if (typeof window === 'undefined' || !item.audioPath) return;
  try {
    const a = new Audio();
    a.preload = 'metadata';
    a.src = item.audioPath;
  } catch {
    // Non-critical preload
  }
}
