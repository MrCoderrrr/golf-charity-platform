import { useEffect, useRef, useState } from "react";
import api from "../api/client";

const CounterItem = ({ target, label, prefix = "" }) => {
  const elRef = useRef(null);
  
  useEffect(() => {
    let start = null;
    const duration = 1600;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (reduced) {
      if (elRef.current) elRef.current.innerText = `${prefix}${target.toLocaleString("en-US")}`;
      return;
    }

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      const current = Math.floor(progress * target);
      if (elRef.current) {
        elRef.current.innerText = `${prefix}${current.toLocaleString("en-US")}`;
      }
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, prefix]);

  return (
    <div className="hero-counter">
      <span className="hero-counter-value">
        <span className="functional-number" ref={elRef}>
          {prefix}0
        </span>
      </span>
      <span className="hero-counter-label">{label}</span>
    </div>
  );
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

  return (
    <div className="hero-counters">
      <CounterItem target={stats.donatedTotal} label="Donated" prefix="$" />
      <CounterItem target={stats.players} label="Players" />
      <CounterItem target={stats.charities} label="Charities" />
    </div>
  );
};


export default HeroCounters;
