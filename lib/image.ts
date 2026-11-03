/**
 * Image shrinking for Gemini calls.
 *
 * Gemini image tokens scale with resolution, and phone photos are several
 * megapixels. Food recognition does not need that: a 1024px-longest-side
 * JPEG at 0.75 quality is plenty for a plate, and is a fraction of the
 * tokens (and upload bytes) of the original. This runs in the browser
 * before any API call, so a parse that never happens (favorites, repeats,
 * Quick Add) costs nothing at all.
 *
 * Fail-open by design: if the image cannot be resized for any reason, the
 * original is returned unchanged rather than blocking the user.
 */

/** Pure size math, kept separate so it is unit-testable without a canvas. */
export function calculateDownscaleSize(
  width: number,
  height: number,
  maxSide: number
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide || longest <= 0) return { width, height };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function downscaleImage(
  dataUrl: string,
  maxSide = 1024,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const { width, height } = calculateDownscaleSize(img.width, img.height, maxSide);
          if (width === img.width && height === img.height) {
            resolve(dataUrl);
            return;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // Redrawing as JPEG also strips EXIF (location, device) metadata.
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}
