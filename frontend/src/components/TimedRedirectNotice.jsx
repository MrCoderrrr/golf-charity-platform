import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const TimedRedirectNotice = ({ message, to, seconds = 5 }) => {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(seconds);

  const safeSeconds = useMemo(() => {
    const n = Number(seconds);
    if (!Number.isFinite(n)) return 5;
    return Math.max(1, Math.min(30, Math.floor(n)));
  }, [seconds]);

  useEffect(() => setRemaining(safeSeconds), [safeSeconds, message, to]);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const next = Math.max(0, safeSeconds - elapsed);
      setRemaining(next);
      if (next <= 0) {
        clearInterval(id);
        navigate(to, { replace: true });
      }
    }, 250);
    return () => clearInterval(id);
  }, [navigate, to, safeSeconds]);

  return (
    <div className="auth-shell">
      <div className="auth-ambient" />
      <div className="auth-card glass-card">
        <div className="auth-glow" />
        <div className="title auth-title">
          <p className="badge badge-soft">Notice</p>
          <h2 className="premium-serif">Redirecting</h2>
          <p className="auth-sub">{message}</p>
          <p className="auth-sub" style={{ marginTop: 10 }}>
            Redirecting in <span className="functional-number">{remaining}</span>s…
          </p>
        </div>
        <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
          <button className="btn frost-sapphire" type="button" onClick={() => navigate(to, { replace: true })}>
            Go now
          </button>
          <Link className="btn glass-btn" to="/">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TimedRedirectNotice;

