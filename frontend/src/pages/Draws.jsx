import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const Draws = () => {
  const { user } = useAuth();

  const [draws, setDraws] = useState([]);
  const [nextDraw, setNextDraw] = useState(null);
  const [countdown, setCountdown] = useState("-");

  const [filterParticipated, setFilterParticipated] = useState(false);
  const [filterWon, setFilterWon] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data: drawData }, { data: next }] = await Promise.all([
        api.get("/draws"),
        api.get("/draws/next"),
      ]);
      setDraws(Array.isArray(drawData) ? drawData : []);
      setNextDraw(next || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load draws.");
      setDraws([]);
      setNextDraw(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const nextDrawAt = useMemo(() => {
    const raw = nextDraw?.drawAt || nextDraw?.drawDate;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }, [nextDraw?.drawAt, nextDraw?.drawDate]);

  useEffect(() => {
    if (!nextDrawAt) return setCountdown("-");

    const tick = () => {
      const diff = nextDrawAt.getTime() - Date.now();
      if (diff <= 0) return setCountdown("Live");
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setCountdown(`${days}D ${hours}H ${mins}M ${secs}S`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextDrawAt]);

  const filteredDraws = draws.filter((d) => {
    const participatedOk = filterParticipated ? d.participated : true;
    const wonOk = filterWon ? d.won : true;
    return participatedOk && wonOk;
  });

  const myEntries = draws.filter((d) => d.participated).length || 0;

  if (loading) {
    return <div className="card glass-card">Loading draws...</div>;
  }

  return (
    <div className="draws-shell card card--section glass-card">
      {error && (
        <div className="card glass-card" style={{ padding: 14, marginBottom: 12 }}>
          <div className="badge error-badge">{error}</div>
          <div style={{ marginTop: 10 }}>
            <button className="btn secondary" type="button" onClick={load}>
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="next-draw-card glass-card">
        <div className="next-draw-hero">
          <div className="badge-row">
            <span className="badge">Next draw</span>
            <span className="badge subtle">
              {user ? `Your entries: ${myEntries}` : "Sign in to enter"}
            </span>
          </div>

          <h2 className="premium-serif next-draw-date">
            {nextDrawAt ? nextDrawAt.toLocaleDateString() : "Not scheduled"}
          </h2>
          <div className="next-draw-time">
            {nextDrawAt ? nextDrawAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "9:00 a.m."}
          </div>

          <p className="countdown">
            Countdown: <span className="gold-leaf-heading">{countdown}</span>
          </p>
        </div>

        <div className="next-draw-meta">
          <div className="payouts next-draw-payouts">
            <div className="payout-tile">
              <span className="label payout-label">Status</span>
              <span className="gold-leaf-heading payout-amount">
                {nextDraw?.status ? String(nextDraw.status).toUpperCase() : "TBD"}
              </span>
            </div>
            <div className="payout-tile">
              <span className="label payout-label">Type</span>
              <span className="functional-number payout-amount">
                {nextDraw?.type || "random"}
              </span>
            </div>
            <div className="payout-tile">
              <span className="label payout-label">Month</span>
              <span className="functional-number payout-amount">
                {nextDraw?.month && nextDraw?.year ? `${nextDraw.month}/${nextDraw.year}` : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="draws-head draws-title-centered">
        <h3 className="draws-title">DRAW HISTORY</h3>
      </div>

      <div className="draw-filters">
        <button
          type="button"
          className={`filter-pill ${filterParticipated ? "active" : ""}`}
          onClick={() => setFilterParticipated((v) => !v)}
        >
          Participated
        </button>
        <button
          type="button"
          className={`filter-pill ${filterWon ? "active" : ""}`}
          onClick={() => setFilterWon((v) => !v)}
        >
          Won
        </button>
      </div>

      <div className="draws-meta draws-meta-below">
        Total draws: <span className="functional-number">{filteredDraws.length}</span>
      </div>

      {filteredDraws.length === 0 ? (
        <div className="empty">No draws yet.</div>
      ) : (
        <div className="draws-grid">
          {filteredDraws.map((d) => (
            <div key={d._id} className="draw-card card glass-card">
              <div className="draw-card__row">
                <span className="draw-date functional-number">
                  {d.drawDate
                    ? new Date(d.drawDate).toLocaleString("en-US", {
                        month: "long",
                        year: "numeric",
                      })
                    : `${String(d.month).padStart(2, "0")}/${d.year}`}
                </span>
                <span className="badge badge-soft">{d.status}</span>
              </div>
              <p className="draw-type">{d.type}</p>
              {Array.isArray(d.drawNumbers) && d.drawNumbers.length > 0 && (
                <div className="draw-numbers">
                  {d.drawNumbers.map((n) => (
                    <span key={n} className="draw-number-pill functional-number">
                      {n}
                    </span>
                  ))}
                </div>
              )}
              {user && (
                <div className="draw-flags">
                  <span className={`chip ${d.participated ? "chip-on" : ""}`}>
                    {d.participated ? "Participated" : "Not in draw"}
                  </span>
                  <span className={`chip ${d.won ? "chip-win" : ""}`}>
                    {d.won ? "Winner" : "Not won"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Draws;

