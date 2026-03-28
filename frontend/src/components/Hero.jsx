import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HeroCounters from "./HeroCounters";

const charityTray = [
  {
    _id: "demo-1",
    name: "Fairway Futures",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    _id: "demo-2",
    name: "Birdies for Relief",
    image:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    _id: "demo-3",
    name: "Green Horizons",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    _id: "demo-4",
    name: "Youth Caddies Fund",
    image:
      "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    _id: "demo-5",
    name: "Links for Life",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
  },
];

const Hero = () => {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(" ")[0] : "Golfer";
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);
  const magneticBtnsRef = useRef([]);
  const [trayIndex, setTrayIndex] = useState(0);

  const registerMagneticBtn = (el) => {
    if (!el) return;
    if (!magneticBtnsRef.current.includes(el)) {
      magneticBtnsRef.current.push(el);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const initParticles = (count = 55) => {
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.4 + 0.4,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          alpha: Math.random() * 0.5 + 0.2,
        });
      }
      particlesRef.current = arr;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      particlesRef.current.forEach((p) => {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      rafRef.current = requestAnimationFrame(draw);
    };

    initParticles();
    draw();

    const handleVisibility = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      } else {
        draw();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const magneticRadius = 26;
    const maxShift = 4;

    const moveMagnet = (event) => {
      magneticBtnsRef.current.forEach((btn) => {
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const distance = Math.hypot(dx, dy);
        if (distance < magneticRadius) {
          const strength = (magneticRadius - distance) / magneticRadius;
          const offsetX = Math.max(-maxShift, Math.min(maxShift, dx * strength * 0.3));
          const offsetY = Math.max(-maxShift, Math.min(maxShift, dy * strength * 0.3));
          btn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        } else {
          btn.style.transform = "";
        }
      });
    };

    const resetMagnet = () => {
      magneticBtnsRef.current.forEach((btn) => {
        if (!btn) return;
        btn.style.transform = "";
      });
    };

    window.addEventListener("pointermove", moveMagnet);
    window.addEventListener("mouseleave", resetMagnet);
    window.addEventListener("blur", resetMagnet);

    return () => {
      window.removeEventListener("pointermove", moveMagnet);
      window.removeEventListener("mouseleave", resetMagnet);
      window.removeEventListener("blur", resetMagnet);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrayIndex((i) => (i + 1) % charityTray.length);
    }, 4800);
    return () => clearInterval(interval);
  }, []);

  const visibleSlots = [-2, -1, 0, 1, 2];
  const slotItem = (offset) => {
    const len = charityTray.length;
    const idx = (trayIndex + offset + len) % len;
    return charityTray[idx];
  };

  const scrollToContent = () => {
    const el = document.getElementById("dashboard-content");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section className="hero-full">
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
        <div className="hero-overlay" />
        <div className="hero-gradient" />
        <div className="hero-inner">
          <p
            className="badge hero-pill"
            style={{
              justifyContent: "space-between",
              gap: "12px",
              minWidth: "0",
              maxWidth: "320px",
              width: "fit-content",
              paddingInline: "18px",
              marginInline: "auto"
            }}
          >
            <span>Golf</span>
            <span>·</span>
            <span>Charity</span>
            <span>·</span>
            <span>Rewards</span>
          </p>
          <h1 className="hero-serif">
            Play. <span className="gold-leaf-text">WIN.</span> Give Back.
          </h1>
          <p className="hero-sub">
            Hi <span className="gold-leaf-text">{firstName}</span>, your swings unlock real impact—drop your latest scores, keep eligibility glowing, and let’s turn the next draw into a win for you and your charity.
          </p>
          <HeroCounters />
          <div className="hero-actions">
            <button
              className="btn primary-trace"
              onClick={scrollToContent}
            >
              View dashboard stats
            </button>
            <Link
              className="btn frost-sapphire magnetic-btn"
              to="/charities"
              ref={registerMagneticBtn}
            >
              Choose charity
            </Link>
          </div>
        </div>
      </section>

      {/* Charity tray removed from dashboard view per request */}
    </>
  );
};

export default Hero;
