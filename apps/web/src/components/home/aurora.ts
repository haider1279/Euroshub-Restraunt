/**
 * Aurora renderer for the home hero. Plain TypeScript, no React: the component
 * only creates it, and every frame happens here, so nothing re-renders per frame.
 *
 * - Aurora: drawn into a buffer at 1/3 of the CSS size and upscaled by the
 *   browser, which gives the soft look for free and keeps fill cost low.
 * - Stars: a separate full-resolution canvas, seeded with mulberry32(7) so the
 *   sky is identical on every visit, redrawn only on resize.
 * - Runs at ~30fps, pauses when the tab is hidden or the hero is off screen,
 *   debounces resize, and draws a single still frame for reduced motion.
 */

/** Small deterministic PRNG. Same seed, same sky. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Ribbon {
  rgb: [number, number, number];
  /** Vertical position of the bright lower edge, 0..1 of height */
  base: number;
  /** Wave amplitude, 0..1 of height */
  amp: number;
  /** Curtain height, 0..1 of height */
  thickness: number;
  freq: number;
  speed: number;
  phase: number;
  alpha: number;
}

// Mostly green, a supporting cyan band, and a very faint rose trace.
const RIBBONS: Ribbon[] = [
  { rgb: [61, 245, 166], base: 0.4, amp: 0.07, thickness: 0.34, freq: 1.5, speed: 0.11, phase: 0, alpha: 0.5 },
  { rgb: [44, 198, 224], base: 0.3, amp: 0.05, thickness: 0.24, freq: 2.1, speed: 0.08, phase: 1.9, alpha: 0.32 },
  { rgb: [255, 95, 162], base: 0.22, amp: 0.035, thickness: 0.1, freq: 2.9, speed: 0.14, phase: 3.4, alpha: 0.07 },
];

const BUFFER_SCALE = 1 / 3;
const COLUMN = 2; // buffer px per curtain column
const FRAME_MS = 1000 / 30;
const STILL_TIME = 42; // time used for the reduced-motion still frame

/**
 * Horizontal brightness envelope: dark on the left where the text sits,
 * brightest around 70% across, easing off at the right edge.
 */
const envelope = (x: number) => {
  const rise = Math.min(1, Math.max(0, (x - 0.18) / 0.5));
  const smooth = rise * rise * (3 - 2 * rise);
  const fall = 1 - Math.max(0, (x - 0.9) / 0.1) * 0.5;
  return 0.12 + 0.88 * smooth * fall;
};

/** 1px-wide vertical gradient: soft top, bright lower edge, quick falloff. */
function makeCurtainSprite([r, g, b]: Ribbon['rgb']) {
  const sprite = document.createElement('canvas');
  sprite.width = 1;
  sprite.height = 128;
  const ctx = sprite.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  grad.addColorStop(0.55, `rgba(${r},${g},${b},0.35)`);
  grad.addColorStop(0.82, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, 128);
  return sprite;
}

export interface AuroraOptions {
  reducedMotion: boolean;
  /** Called once the first frame is on screen (used to fade the layer in). */
  onFirstFrame?: () => void;
}

export interface Aurora {
  destroy(): void;
}

export function createAurora(
  container: HTMLElement,
  auroraCanvas: HTMLCanvasElement,
  starCanvas: HTMLCanvasElement,
  options: AuroraOptions
): Aurora {
  const ctx = auroraCanvas.getContext('2d', { alpha: true });
  const starCtx = starCanvas.getContext('2d', { alpha: true });
  if (!ctx || !starCtx) return { destroy() {} };

  const sprites = RIBBONS.map((r) => makeCurtainSprite(r.rgb));

  // Stars are generated once from the fixed seed; resize only re-projects them.
  const rand = mulberry32(7);
  const stars = Array.from({ length: 360 }, () => ({
    x: rand(),
    // Bias toward the upper sky; the ridges cover the bottom.
    y: Math.pow(rand(), 1.4) * 0.78,
    r: 0.35 + rand() * 0.9,
    a: 0.18 + rand() * 0.62,
  }));

  let width = 0;
  let height = 0;
  let raf = 0;
  let running = false;
  let lastFrame = 0;
  let firstFrameDone = false;
  let inView = true;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const startTime = performance.now();

  function measure() {
    const rect = container.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));

    auroraCanvas.width = Math.max(1, Math.round(width * BUFFER_SCALE));
    auroraCanvas.height = Math.max(1, Math.round(height * BUFFER_SCALE));

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    starCanvas.width = Math.round(width * dpr);
    starCanvas.height = Math.round(height * dpr);
    starCtx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawStars();
  }

  function drawStars() {
    starCtx!.clearRect(0, 0, width, height);
    // Fewer stars on small screens so the sky never looks busy.
    const count = Math.round(Math.min(stars.length, Math.max(90, (width * height) / 5200)));
    for (let i = 0; i < count; i++) {
      const s = stars[i];
      starCtx!.globalAlpha = s.a;
      starCtx!.fillStyle = '#EEF6F3';
      starCtx!.beginPath();
      starCtx!.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
      starCtx!.fill();
    }
    starCtx!.globalAlpha = 1;
  }

  function drawAurora(t: number) {
    const w = auroraCanvas.width;
    const h = auroraCanvas.height;
    ctx!.clearRect(0, 0, w, h);
    ctx!.globalCompositeOperation = 'lighter';

    for (let i = 0; i < RIBBONS.length; i++) {
      const rb = RIBBONS[i];
      const sprite = sprites[i];
      const drift = t * rb.speed;
      for (let x = 0; x < w; x += COLUMN) {
        const u = x / w;
        // Two layered waves give the slow, folding curtain shape.
        const wave =
          Math.sin(u * rb.freq * Math.PI * 2 + drift + rb.phase) * rb.amp +
          Math.sin(u * rb.freq * 3.1 - drift * 1.6 + rb.phase * 2) * rb.amp * 0.35;
        // Vertical rays: brightness varies across columns and drifts slowly.
        const rays =
          0.55 +
          0.45 * Math.sin(u * 37 + drift * 2.3 + rb.phase) * Math.sin(u * 13 - drift * 1.1 + rb.phase * 0.7);
        const alpha = rb.alpha * envelope(u) * Math.max(0, rays);
        if (alpha < 0.004) continue;

        const curtain = rb.thickness * h * (0.75 + 0.35 * rays);
        const edge = (rb.base + wave) * h;
        ctx!.globalAlpha = alpha;
        ctx!.drawImage(sprite, 0, 0, 1, 128, x, edge - curtain * 0.82, COLUMN + 0.5, curtain);
      }
    }

    ctx!.globalAlpha = 1;
    ctx!.globalCompositeOperation = 'source-over';

    if (!firstFrameDone) {
      firstFrameDone = true;
      options.onFirstFrame?.();
    }
  }

  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;
    drawAurora((now - startTime) / 1000);
  }

  function start() {
    if (running || options.reducedMotion || document.hidden || !inView) return;
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      measure();
      // Resizing clears the canvas; repaint immediately so there is no blank frame.
      drawAurora(options.reducedMotion ? STILL_TIME : (performance.now() - startTime) / 1000);
    }, 150);
  }

  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          if (inView) start();
          else stop();
        })
      : null;

  measure();
  if (options.reducedMotion) {
    drawAurora(STILL_TIME);
  } else {
    drawAurora(0);
    start();
  }

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', onResize, { passive: true });
  io?.observe(container);

  return {
    destroy() {
      stop();
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      io?.disconnect();
    },
  };
}
