import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: me }, { data: scoreData }] = await Promise.all([
          api.get("/user/me"),
          api.get("/scores"),
        ]);
        setProfile(me);
        setScores(scoreData || []);
      } catch (err) {
        console.warn("Dashboard data unavailable", err?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Safety: prevent perpetual loading if API stalls
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <div className="card card--section glass-card">Loading...</div>;

  const eligibilityVisible = scores && scores.length > 0;
  const progress = Math.min(100, Math.round((scores.length / 5) * 100));
  const streak = scores.length >= 5 ? "Eligible" : `${5 - scores.length} to go`;
  const scoresNeeded = Math.max(0, 5 - scores.length);
  const lastScores = (scores || []).slice(0, 5);
  const selectedCharity = profile?.selectedCharity || null;
  const isGuest = !user;

  const parent = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const child = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="dashboard-royal"
      id="dashboard-content"
      variants={parent}
      initial="hidden"
      animate="show"
    >
      <div className="dashboard-row-trio">
        <motion.div className="card card--section glass-card dashboard-block slim-card" variants={child}>
          <div className="title">
            <h3 className="headline-earnings">Total earnings</h3>
          </div>
          {isGuest ? (
            <div className="earnings-stack">
              <p className="metric-cta">
                Your scorecard holds untapped value. Join the inner circle to transform your Stableford performance
                into verified winnings and meaningful charity contributions.
              </p>
            </div>
          ) : (
            <div className="earnings-stack">
              <div className="big-earnings gold-leaf-text">
                {profile?.totalEarnings != null
                  ? `₹${Number(profile.totalEarnings).toLocaleString("en-IN")}`
                  : "₹0"}
              </div>
              <p className="metric-small">Cumulative rewards accrued</p>
            </div>
          )}
        </motion.div>

        <motion.div className="card card--section glass-card dashboard-block slim-card" variants={child}>
          <div className="title">
            <h3 className="headline-earnings">
              Last <span className="headline-accent">5</span> scores
            </h3>
            <span className="badge">
              {scores.length >= 5 ? "Ready" : "Needs scores"}
            </span>
          </div>
          {scores.length < 5 && !isGuest && (
            <div className="mini-eligibility">
              <div className="mini-eligibility-fill" style={{ width: `${progress}%` }} />
              <span className="mini-eligibility-label">{scoresNeeded} to go</span>
            </div>
          )}
          {isGuest ? (
            <p className="metric-small metric-cta">
              A legacy is built five rounds at a time. Secure your spot in the next monthly draw by registering your
              rolling performance history today.
            </p>
          ) : lastScores.length === 0 ? (
            <div className="empty">No scores yet.</div>
          ) : (
            <ul className="score-list compact">
              {lastScores.map((s) => (
                <li key={s._id || s.date} className="score-row">
                  <div className="score-row-main">
                    <span className="functional-number">{s.score}</span>
                    <span className="label">score</span>
                  </div>
                  <div className="score-row-meta">
                    <span className="label">Date</span>
                    <span>{s.date ? new Date(s.date).toLocaleDateString() : "—"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div className="card card--section glass-card dashboard-block slim-card" variants={child}>
          <div className="title">
            <h3 className="headline-earnings">Selected charity</h3>
            <span className="badge">
              {selectedCharity ? "Locked in" : "Pick one"}
            </span>
          </div>
          {selectedCharity ? (
            <>
              <div className="selected-charity-name gold-leaf-text">
                {selectedCharity.name || "Your charity"}
              </div>
              {selectedCharity.description && (
                <p className="metric-small">{selectedCharity.description}</p>
              )}
              {selectedCharity.image && (
                <div className="charity-img-wrapper mini">
                  <img src={selectedCharity.image} alt={selectedCharity.name} className="charity-img" />
                </div>
              )}
            </>
          ) : isGuest ? (
            <p className="metric-small metric-cta">
              Every swing can be a force for good. Select your cause and start routing 10% of your subscription toward
              a legacy that outlives the final hole.
            </p>
          ) : (
            <Link className="btn frost-sapphire" to="/charities">
              Choose charity
            </Link>
          )}
        </motion.div>
      </div>

      {isGuest && (
        <div className="guest-cta card glass-card">
          <p className="metric-small">
            Ready to see your scores, winnings, and chosen charity in one place?
          </p>
          <Link className="btn frost-sapphire" to="/signup">
            Create new account
          </Link>
        </div>
      )}

      {eligibilityVisible && (
        <motion.div
          className="card card--section glass-card dashboard-block"
          style={{ width: "100%" }}
          variants={child}
        >
          <div className="title">
            <h3>Eligibility meter</h3>
            <span className="badge">{streak}</span>
          </div>
          <div className="eligibility-thread">
            <motion.div
              className="eligibility-thread-fill"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
            />
          </div>
          <p className="eligibility-meta eligibility-meta-large" style={{ marginTop: 10 }}>
            <span className="functional-number">{`${scores.length} / 5`}</span> recent scores submitted
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;
