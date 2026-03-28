import { useEffect, useState } from "react";
import api from "../api/client";

const sampleDraws = [
  { _id: "d1", month: 3, year: 2026, type: "random", status: "completed", drawNumbers: [3, 12, 19, 27, 42], participated: true, won: false },
  { _id: "d2", month: 2, year: 2026, type: "algorithm", status: "completed", drawNumbers: [5, 9, 18, 25, 44], participated: true, won: true },
];

const Draws = () => {
  const [draws, setDraws] = useState(sampleDraws);
  const [filterParticipated, setFilterParticipated] = useState(false);
  const [filterWon, setFilterWon] = useState(false);
  const [nextDrawDate, setNextDrawDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  });
  const [countdown, setCountdown] = useState("—");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/draws");
        setDraws(data);
        const upcoming = Array.isArray(data)
          ? data.find((d) => (d.status || "").toLowerCase() === "upcoming")
          : null;
        if (upcoming?.year && upcoming?.month) {
          const nd = new Date(upcoming.year, (upcoming.month || 1) - 1, upcoming.day || 1);
          setNextDrawDate(nd.toISOString());
        }
      } catch {
        console.warn("Using sample draws (API unreachable)");
      }
    };
    load();
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!nextDrawDate) return setCountdown("—");
      const target = new Date(nextDrawDate).getTime();
      const diff = target - Date.now();
      if (diff <= 0) return setCountdown("Live");
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      setCountdown(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [nextDrawDate]);

  const filteredDraws = draws.filter((d) => {
    const participatedOk = filterParticipated ? d.participated : true;
    const wonOk = filterWon ? d.won : true;
    return participatedOk && wonOk;
  });

  const emptyCopy =
    filterParticipated || filterWon
      ? "No draws match those filters yet. Keep playing—your next swing could unlock one."
      : "No draws yet. Play a round to enter the next one.";
  const registeredPlayers = draws.filter((d) => d.participated).length || 0;

  return (
    <div className="draws-shell card card--section glass-card">
      <div className="next-draw-card glass-card">
        <div>
          <p className="badge">Next draw</p>
          <h2 className="premium-serif">{new Date(nextDrawDate).toLocaleDateString()}</h2>
          <p className="countdown">
            Countdown: <span className="functional-number">{countdown}</span>
          </p>
        </div>
        <div className="next-draw-meta">
          <div>
            <span className="label">Players registered</span>
            <span className="functional-number">{registeredPlayers}</span>
          </div>
          <div className="payouts">
            <div><span className="label">Jackpot</span><span className="functional-number">₹1,00,000</span></div>
            <div><span className="label">4-pass</span><span className="functional-number">₹25,000</span></div>
            <div><span className="label">3-pass</span><span className="functional-number">₹10,000</span></div>
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
        <div className="empty">{emptyCopy}</div>
      ) : (
        <div className="draws-grid">
          {filteredDraws.map((d) => (
            <div key={d._id} className="draw-card card glass-card">
              <div className="draw-card__row">
                <span className="draw-date functional-number">
                  {new Date(d.year, (d.month || 1) - 1).toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="badge badge-soft">{d.status}</span>
              </div>
              <p className="draw-type">{d.type}</p>
              <div className="draw-numbers">
                {d.drawNumbers?.map((n) => (
                  <span key={n} className="draw-number-pill functional-number">
                    {n}
                  </span>
                ))}
              </div>
              <div className="draw-flags">
                <span className={`chip ${d.participated ? "chip-on" : ""}`}>{d.participated ? "Participated" : "Not in draw"}</span>
                <span className={`chip ${d.won ? "chip-win" : ""}`}>{d.won ? "Winner" : "Not won"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Draws;
