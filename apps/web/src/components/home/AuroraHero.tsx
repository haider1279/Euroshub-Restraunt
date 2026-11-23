import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { createAurora } from './aurora';
import { prefetchMenu } from '../../api/queries';
import { prefersReducedMotion } from '../../hooks/useReveal';
import { ButtonLink } from '../ui/Button';

// Static film grain (no animation), tiled at low opacity over the sky.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

interface AuroraHeroProps {
  /** e.g. "Closed now · opens at 9:00 AM". Hidden when the restaurant is open. */
  statusLine?: string | null;
}

const stagger = (i: number): React.CSSProperties => ({ animationDelay: `${120 + i * 90}ms` });

export const AuroraHero: React.FC<AuroraHeroProps> = ({ statusLine }) => {
  const containerRef = useRef<HTMLElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const container = containerRef.current;
    const aurora = auroraRef.current;
    const stars = starsRef.current;
    if (!container || !aurora || !stars) return;

    let instance: { destroy(): void } | null = null;
    let cancelled = false;
    const reducedMotion = prefersReducedMotion();

    // Start after first paint so the canvas never blocks the headline.
    const boot = () => {
      if (cancelled) return;
      instance = createAurora(container, aurora, stars, {
        reducedMotion,
        onFirstFrame: () => skyRef.current?.classList.add('opacity-100'),
      });
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const rafId = requestAnimationFrame(() => {
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(boot, { timeout: 700 });
      else timeoutId = setTimeout(boot, 60);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      clearTimeout(timeoutId);
      instance?.destroy();
    };
  }, []);

  const warmMenu = () => prefetchMenu(queryClient);

  return (
    <section
      ref={containerRef}
      aria-labelledby="hero-title"
      className="hero-h relative isolate flex flex-col overflow-hidden bg-night"
    >
      {/* Sky */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(180deg, #02040A 0%, #040912 55%, #08151F 82%, #050B14 100%)' }}
      />
      <div
        ref={skyRef}
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-700 ease-out motion-reduce:transition-none"
      >
        <canvas ref={starsRef} className="absolute inset-0 h-full w-full" />
        <canvas ref={auroraRef} className="absolute inset-0 h-full w-full" />
      </div>

      {/* Ridges: back ridge catches a faint rim of aurora light; the front one
          is the page color so the hero flows straight into the content. */}
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-[34%] w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          d="M0 170 L92 132 L168 150 L262 96 L340 128 L430 84 L512 118 L610 70 L700 112 L792 92 L880 136 L968 104 L1060 140 L1150 88 L1240 120 L1334 98 L1440 128 L1440 320 L0 320 Z"
          fill="#040912"
        />
        <path
          d="M0 170 L92 132 L168 150 L262 96 L340 128 L430 84 L512 118 L610 70 L700 112 L792 92 L880 136 L968 104 L1060 140 L1150 88 L1240 120 L1334 98 L1440 128"
          fill="none"
          stroke="rgba(61,245,166,0.10)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M0 236 L120 206 L236 226 L352 188 L470 214 L600 182 L716 208 L842 176 L964 204 L1090 186 L1210 214 L1330 194 L1440 210 L1440 320 L0 320 Z"
          fill="#050B14"
        />
      </svg>

      {/* Grain */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]" style={{ backgroundImage: GRAIN }} />

      {/* Copy sits bottom-left, over the dark sky and ridges, away from the bright aurora. */}
      <div className="container-content flex flex-1 flex-col justify-end pb-[clamp(56px,11vh,120px)] pt-28">
        <div className="max-w-[36rem]">
          <p className="hero-in eyebrow" style={stagger(0)}>
            Euroshub Kitchen · Saddar, Rawalpindi
          </p>
          <h1 id="hero-title" className="hero-in mt-5 font-serif text-5xl text-ink" style={stagger(1)}>
            Good food, made to order.
          </h1>
          <p className="hero-in mt-6 max-w-[30rem] text-lg text-muted" style={stagger(2)}>
            Fresh fast food from our kitchen to your table. Order for dine-in or takeaway, or book a table in seconds.
          </p>
          <div className="hero-in mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={stagger(3)}>
            <ButtonLink to="/menu" size="lg" onMouseEnter={warmMenu} onFocus={warmMenu} onTouchStart={warmMenu}>
              Order now
            </ButtonLink>
            <Link
              to="/reservation"
              className="group inline-flex min-h-11 items-center gap-1.5 text-base text-ink underline-offset-4 hover:underline"
            >
              Book a table
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
          {statusLine && (
            <p className="hero-in mt-6 inline-flex items-center gap-2 text-sm text-muted" style={stagger(4)}>
              <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
              {statusLine}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
