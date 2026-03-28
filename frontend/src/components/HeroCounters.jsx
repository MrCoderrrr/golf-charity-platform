import { useEffect, useRef, useState } from "react";

const heroStats = [
  { label: "Donated", value: 234000, prefix: "₹" },
  { label: "Players", value: 1200 },
  { label: "Charities", value: 82 },
];

const useCountUp = (target, duration = 1600) => {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCurrent(target);
      return;
    }

    startRef.current = null;
    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      setCurrent(Math.floor(progress * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
};

const HeroCounters = () => {
  const animatedStats = heroStats.map((stat) => ({
    ...stat,
    current: useCountUp(stat.value),
  }));

  return (
    <div className="hero-counters">
      {animatedStats.map((stat) => (
        <div key={stat.label} className="hero-counter">
          <span className="hero-counter-value">
            <span className="functional-number">
              {stat.prefix ?? ""}
              {stat.current.toLocaleString()}
            </span>
          </span>
          <span className="hero-counter-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
};

export default HeroCounters;
