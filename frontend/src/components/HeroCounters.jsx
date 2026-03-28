import { useEffect, useRef, useState } from "react";
import api from "../api/client";

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
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
};

const HeroCounters = () => {
  const [stats, setStats] = useState({ donatedTotal: 0, players: 0, charities: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/stats/hero");
        setStats({
          donatedTotal: Number(data?.donatedTotal) || 0,
          players: Number(data?.players) || 0,
          charities: Number(data?.charities) || 0,
        });
      } catch {
        setStats({ donatedTotal: 0, players: 0, charities: 0 });
      }
    };
    load();
  }, []);

  const donated = useCountUp(stats.donatedTotal);
  const players = useCountUp(stats.players);
  const charities = useCountUp(stats.charities);

  return (
    <div className="hero-counters">
      <div className="hero-counter">
        <span className="hero-counter-value">
          <span className="functional-number">Rs {donated.toLocaleString("en-IN")}</span>
        </span>
        <span className="hero-counter-label">Donated</span>
      </div>
      <div className="hero-counter">
        <span className="hero-counter-value">
          <span className="functional-number">{players.toLocaleString("en-IN")}</span>
        </span>
        <span className="hero-counter-label">Players</span>
      </div>
      <div className="hero-counter">
        <span className="hero-counter-value">
          <span className="functional-number">{charities.toLocaleString("en-IN")}</span>
        </span>
        <span className="hero-counter-label">Charities</span>
      </div>
    </div>
  );
};

export default HeroCounters;

