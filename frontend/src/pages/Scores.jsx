import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

const Scores = () => {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [score, setScore] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const loadScores = async () => {
    if (!user) {
      setScores([]);
      return;
    }
    try {
      const { data } = await api.get("/scores");
      setScores(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load scores from server.");
    }
  };

  useEffect(() => {
    loadScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 150);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!user) {
      setError("Please sign in to save scores.");
      triggerShake();
      return;
    }
    const numericScore = Number(score);
    if (Number.isNaN(numericScore) || numericScore < 1 || numericScore > 45) {
      setError("Score must be between 1 and 45.");
      triggerShake();
      return;
    }
    if (!date) {
      setError("Date is required.");
      triggerShake();
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/scores", { score: numericScore, date });
      setScore("");
      setDate("");
      setScores(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save score.");
    } finally {
      setLoading(false);
    }
  };

  const eligibilityProgress = Math.min(100, Math.round((scores.length / 5) * 100));
  const eligibilityStatus = scores.length >= 5 ? "Eligible" : "";
  const eligibilityMeta = `${scores.length} / 5 recent scores submitted`;
  const isGuest = !user;

  const isOutOfRange =
    score !== "" &&
    Number.isFinite(Number(score)) &&
    (Number(score) < 1 || Number(score) > 45);

  return (
    <div className="scores-shell">
      <div className="scores-heading-wrap">
        <h1 className="gold-leaf-heading scores-heading">SCORES</h1>
      </div>

      <div className="terms-block">
        <h3 className="terms-heading">Eligibility Terms</h3>
        <ul className="terms-list">
          <li>Submit 5 recent scores (within the last 30 days) to stay draw-ready.</li>
          <li>Scores must be between 1 and 45 and tied to a valid date.</li>
          <li>Jackpot eligibility refreshes after each draw; keep your streak alive.</li>
          <li>Fraudulent or duplicate submissions may void eligibility.</li>
        </ul>
      </div>

      <div className="grid two scores-grid">
        <div className="eligibility-meter-card card glass-card" style={{ gridColumn: "1 / -1" }}>
          <div className="title">
            <h3>Eligibility meter</h3>
            {eligibilityStatus && <span className="badge">{eligibilityStatus}</span>}
          </div>
          <div className="eligibility-thread">
            <div
              className="eligibility-thread-fill"
              style={{ width: `${eligibilityProgress}%` }}
            />
          </div>
          <p className="eligibility-meta">
            <span className="functional-number">{eligibilityMeta}</span>
          </p>
        </div>

        <div className="scores-row">
          <div className="card add-score-card">
            <div className="title">
              <h3>Add score</h3>
            </div>
            <form className="score-form" onSubmit={handleSubmit}>
              <div className="score-inline">
                <label className="score-label">
                  Score (0-45)
                  <input
                    className={`score-input ${isOutOfRange ? "input-bleed" : ""} ${shake ? "input-shiver" : ""}`}
                    type="number"
                    min="1"
                    max="45"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    required
                    disabled={isGuest}
                  />
                </label>
                <label className="score-label">
                  Date
                  <input
                    className="score-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    disabled={isGuest}
                  />
                </label>
              </div>
              {error && <div className="badge error-badge">{error}</div>}
              <button className="btn" type="submit" disabled={loading || isGuest}>
                {isGuest ? "Sign in to save" : loading ? "Saving..." : "Save score"}
              </button>
            </form>
          </div>

          <div className="card recent-score-card">
            <div className="title">
              <h3>Recent scores</h3>
              <span className="badge">
                Submitted: <span className="functional-number">{`${scores.length} / 5`}</span>
              </span>
            </div>
            {scores.length === 0 ? (
              <div className="empty">{isGuest ? "Sign in to see your saved scores." : "No scores yet."}</div>
            ) : (
              <ul className="list">
                {scores.map((s) => (
                  <li key={s._id} className="card" style={{ margin: 0 }}>
                    <strong>
                      <span className="functional-number">{s.score}</span>
                    </strong>{" "}
                    on{" "}
                    {s.date ? new Date(s.date).toLocaleDateString() : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scores;
