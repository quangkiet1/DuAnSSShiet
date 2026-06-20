/**
 * useGsapEntrance - Hook dùng GSAP để animate các phần tử khi mount
 * @param {object} options - GSAP animation options
 * @returns {React.RefObject} ref để gán vào container
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function useGsapEntrance(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const tween = gsap.fromTo(el,
      { opacity: 0, y: options.y ?? 20, scale: options.scale ?? 1 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: options.duration ?? 0.4,
        ease: options.ease ?? 'power2.out',
        delay: options.delay ?? 0,
      }
    );

    return () => tween.kill();
  }, []);

  return ref;
}

/**
 * useGsapStagger - Animate danh sách con với stagger
 * @param {string} selector - CSS selector con (vd: '.card')
 * @param {object} options
 */
export function useGsapStagger(selector = '*', options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const children = ref.current.querySelectorAll(selector);
    if (!children.length) return;

    const tween = gsap.fromTo(children,
      { opacity: 0, y: options.y ?? 24, scale: options.scale ?? 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: options.duration ?? 0.35,
        ease: options.ease ?? 'power2.out',
        stagger: options.stagger ?? 0.08,
        delay: options.delay ?? 0,
      }
    );

    return () => tween.kill();
  }, []);

  return ref;
}

/**
 * animateStatCard - Animate số đếm lên (counter animation)
 */
export function animateCounter(element, endValue, duration = 0.8) {
  if (!element || isNaN(endValue)) return;
  const obj = { value: 0 };
  gsap.to(obj, {
    value: endValue,
    duration,
    ease: 'power1.out',
    onUpdate: () => {
      element.textContent = Math.round(obj.value);
    },
  });
}
