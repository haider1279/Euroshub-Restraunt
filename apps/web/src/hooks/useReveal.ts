import { useEffect, useRef, useState } from 'react';

/**
 * Adds `is-visible` to an element the first time it scrolls into view.
 * Pair with the `.reveal` class (fade + 12px rise, see index.css).
 */
export function useReveal<T extends HTMLElement = HTMLElement>(options?: { rootMargin?: string }) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: options?.rootMargin ?? '0px 0px -10% 0px', threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.rootMargin]);

  return ref;
}

/** True once the page has scrolled past `offset` pixels. */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > offset);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > offset));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [offset]);
  return scrolled;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
