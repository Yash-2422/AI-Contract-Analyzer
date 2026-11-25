import { useEffect, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
  duration?: number;
}

/**
 * Small, purposeful count-up for dashboard statistics. It settles in under
 * 700ms and never blocks interaction; reduced-motion users see the final
 * value immediately.
 */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className,
  duration = 0.65,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      setDisplay(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [duration, motionValue, reduceMotion, value]);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplay(latest);
  });

  return (
    <span className={className} aria-label={format(value)}>
      {format(display)}
    </span>
  );
}
