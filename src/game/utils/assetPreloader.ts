/**
 * Asset Preloader Utility
 * Preloads and pre-decodes critical background images into GPU memory
 * to eliminate the 50-150ms decoding blank frame / flash when switching modules.
 */

const preloadedUrls = new Set<string>();

export const preloadAndDecodeImage = (src: string): Promise<void> => {
  if (!src || typeof window === 'undefined' || preloadedUrls.has(src)) {
    return Promise.resolve();
  }
  preloadedUrls.add(src);

  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    if (typeof img.decode === 'function') {
      img.decode().then(resolve).catch(() => resolve());
    } else {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }
  });
};

export const preloadCriticalSceneAssets = (urls: string[]): void => {
  if (typeof window === 'undefined') return;

  const scheduleIdle = window.requestIdleCallback || ((cb: () => void) => window.setTimeout(cb, 100));

  scheduleIdle(() => {
    urls.forEach(url => {
      if (url) {
        preloadAndDecodeImage(url).catch(() => {});
      }
    });
  });
};
