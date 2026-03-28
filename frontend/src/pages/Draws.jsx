import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const Draws = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [draws, setDraws] = useState([]);
  const [nextDraw, setNextDraw] = useState(null);
  const [countdown, setCountdown] = useState("-");

  const [filterParticipated, setFilterParticipated] = useState(false);
  const [filterWon, setFilterWon] = useState(false);

  const [payoutData, setPayoutData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data: drawData }, { data: next }, { data: stats }] = await Promise.all([
        api.get("/draws"),
        api.get("/draws/next"),
        api.get("/stats/hero").catch(() => ({ data: null }))
      ]);
      setDraws(Array.isArray(drawData) ? drawData : []);
      setNextDraw(next || null);
      setPayoutData(stats || null);
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
    if (!nextDrawAt) {
      setCountdown("-");
      return;
    }

    const tick = () => {
      const diff = nextDrawAt.getTime() - Date.now();
      // If the draw time has just passed, show LIVE briefly; if it's overdue, show a ticking overdue timer.
      if (diff <= 0) {
        const overdue = Math.abs(diff);
        if (overdue < 2 * 60 * 1000) return setCountdown("LIVE");
        const days = Math.floor(overdue / (1000 * 60 * 60 * 24));
        const hours = Math.floor((overdue / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((overdue / (1000 * 60)) % 60);
        const secs = Math.floor((overdue / 1000) % 60);
        const hh = String(hours).padStart(2, "0");
        const mm = String(mins).padStart(2, "0");
        const ss = String(secs).padStart(2, "0");
        return setCountdown(`OVERDUE ${days}D ${hh}H ${mm}M ${ss}S`);
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      // Pad smaller units so the counter visibly "ticks" and feels intentional.
      const hh = String(hours).padStart(2, "0");
      const mm = String(mins).padStart(2, "0");
      const ss = String(secs).padStart(2, "0");
      setCountdown(`${days}D ${hh}H ${mm}M ${ss}S`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextDrawAt?.getTime()]);

  const filteredDraws = draws.filter((d) => {
    const participatedOk = filterParticipated ? d.participated : true;
    const wonOk = filterWon ? d.won : true;
    return participatedOk && wonOk;
  });

  const myEntries = draws.filter((d) => d.participated).length || 0;
  const nextParticipated = useMemo(() => {
    if (!nextDraw?._id) return false;
    const hit = draws.find((d) => String(d._id) === String(nextDraw._id));
    return Boolean(hit?.participated);
  }, [draws, nextDraw?._id]);

  const participate = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!nextDraw?._id) return;
    try {
      await api.post(`/draws/${nextDraw._id}/participate`);
      toast.success("Entered the next draw.");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not participate.");
    }
  };

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

      {/* THE CROWN JEWEL (Multi-Tier Prize Chamber) */}
      <div className="crown-jewel-bar glass-card" style={{ marginBottom: 30 }}>
        <div className="pool-tier-suite">
          <div className="tier-brick">
            <span className="tier-label gold-leaf-text">JACKPOT (5-MATCH)</span>
            <h2 className="tier-amount gold-leaf-heading">
              ${payoutData?.activePool?.tier5?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "194,200"}
            </h2>
            {payoutData?.activePool?.rollover > 0 && (
               <span className="rollover-tag">+${payoutData.activePool.rollover.toLocaleString("en-US")} Rollover</span>
            )}
          </div>
          <div className="tier-brick border-sides">
            <span className="tier-label gold-leaf-text">PRESTIGE (4-MATCH)</span>
            <h2 className="tier-amount gold-leaf-heading">
              ${payoutData?.activePool?.tier4?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "169,925"}
            </h2>
          </div>
          <div className="tier-brick">
            <span className="tier-label gold-leaf-text">IMPACT (3-MATCH)</span>
            <h2 className="tier-amount gold-leaf-heading">
              ${payoutData?.activePool?.tier3?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "121,375"}
            </h2>
          </div>
        </div>
      </div>

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

          {nextDraw?._id && (
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn"
                type="button"
                onClick={participate}
                disabled={!user || nextParticipated || String(nextDraw?.status || "").toLowerCase() === "cancelled"}
                title={!user ? "Login required" : nextParticipated ? "Already participated" : "Enter draw"}
              >
                {!user ? "Login to participate" : nextParticipated ? "Participated" : "Participate"}
              </button>
            </div>
          )}
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
