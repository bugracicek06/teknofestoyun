import React, { useEffect, useRef, useState, useCallback } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

export const IntroVideo: React.FC<IntroVideoProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasFinishedRef = useRef(false);
  const fadeTimeoutRef = useRef<number | null>(null);
  const safetyTimeoutRef = useRef<number | null>(null);

  const triggerExit = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fadeDuration = prefersReducedMotion ? 50 : 600;

    setIsFadingOut(true);

    if (videoRef.current) {
      // Gently lower audio volume if playing unmuted
      try {
        if (!videoRef.current.muted && videoRef.current.volume > 0) {
          const fadeAudio = setInterval(() => {
            if (videoRef.current && videoRef.current.volume > 0.1) {
              videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.2);
            } else {
              clearInterval(fadeAudio);
            }
          }, 100);
        }
      } catch {
        // Non-critical audio fade
      }
    }

    fadeTimeoutRef.current = window.setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      onComplete();
    }, fadeDuration);
  }, [onComplete]);

  const handleError = useCallback(() => {
    // If video fails to load or error occurs, safely bypass intro to main menu
    triggerExit();
  }, [triggerExit]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 1. Attempt unmuted autoplay; fallback to muted autoplay if browser policy blocks audio
    const attemptPlay = async () => {
      try {
        video.muted = false;
        await video.play();
      } catch {
        // Autoplay with audio was blocked by the browser; fallback to muted autoplay
        try {
          video.muted = true;
          await video.play();
        } catch {
          // If playback is completely blocked or failed, safely bypass
          triggerExit();
        }
      }
    };

    attemptPlay();

    // 2. Keyboard ESC key to skip intro
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        triggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 3. Safety timeout: video is ~10s. If stuck buffering or loading past 14s, bypass intro safely
    safetyTimeoutRef.current = window.setTimeout(() => {
      if (!hasFinishedRef.current) {
        triggerExit();
      }
    }, 14000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (video) {
        video.pause();
      }
    };
  }, [triggerExit]);

  return (
    <div
      className={`intro-overlay ${isFadingOut ? 'fade-out' : ''}`}
      role="region"
      aria-label="Açılış İntro Videosu"
    >
      <div className="intro-media-wrapper">
        <video
          ref={videoRef}
          className="intro-video-element"
          src="/videos/intro.mp4"
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          onEnded={triggerExit}
          onError={handleError}
        />
        {/* Bottom-right watermark mask to cleanly conceal the Gemini watermark */}
        <div className="intro-watermark-mask" aria-hidden="true" />
      </div>

      <button
        className="intro-skip-btn"
        onClick={triggerExit}
        type="button"
        aria-label="Videoyu Geç"
        title="Videoyu Geç (ESC)"
      >
        <span>Geç</span>
        <svg
          className="intro-skip-arrow"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};
