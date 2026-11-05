import { useState, useEffect, useRef } from "react";

/**
 * CountUp Component
 * Animates actual dashboard statistics when they become visible in the viewport.
 * Does not generate fake numbers; animates precisely to the target value.
 */
export function CountUp({
  value = 0,
  duration = 1000,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayValue(Number(value) || 0);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const target = Number(value) || 0;
          const startTime = performance.now();

          const update = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const current = easedProgress * target;

            setDisplayValue(current);

            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              setDisplayValue(target);
            }
          };

          requestAnimationFrame(update);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
