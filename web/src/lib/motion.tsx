import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

// Impeccable-grade easing: ease-out-expo. No bounce, no elastic.
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/* Content is visible by default; motion enhances. Reduced-motion → final state,
   no transform. Client SPA, so JS always runs (no blank-on-headless risk). */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT_EXPO }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* Animates a number up to `target` the first time it scrolls into view.
   The verdict card "computing itself" is the trust-building motion. */
export function useCountUp(target: number, duration = 1.15) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    if (!inView) return;
    const controls = animate(0, target, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate: setValue,
    });
    return () => controls.stop();
  }, [inView, target, duration, reduce]);

  return { ref, value };
}
