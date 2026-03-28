import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { CharityIcon } from "../components/CharityIcon";
import React from "react";


const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState([]);
  const [payoutData, setPayoutData] = useState(null);
  const [nextDraw, setNextDraw] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // 1. Core Profile & Scores (Essential)
      try {
        const [{ data: me }, { data: scoreData }] = await Promise.all([
          api.get("/user/me"),
          api.get("/scores")
        ]);
        setProfile(me);
        setScores(scoreData || []);
        
        // 2. Contributions (Dependent on Profile)
        api.get("/user/contributions").then(({ data: cData }) => {
          const myTotal = cData?.months?.reduce((acc, m) => {
            const matching = m.byCharity?.find(bc => bc.charityId === me.selectedCharity?._id);
            return acc + (matching ? matching.total : 0);
          }, 0) || 0;
          setProfile(curr => ({ ...curr, myCharityTotal: myTotal }));
        }).catch(() => {});

      } catch (err) {
        console.error("Dashboard core fetch failed", err);
      } finally {
        setLoading(false);
      }

      // 3. Secondary Stats (Draws, Payouts)
      api.get("/draw/next").then(({ data }) => setNextDraw(data)).catch(() => {});
      api.get("/stats/hero").then(({ data }) => setPayoutData(data)).catch(() => {});
    };

    loadData();
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

      {/* SECTION 3: THE ACTIVITY TICKER (Circular Loop) */}
      <motion.div className="activity-ticker-chamber glass-card" variants={child} style={{ marginBottom: 30 }}>
        <div className="ticker-label">Clubhouse Hall of Fame</div>
        <div className="ticker-track">
          {[1, 2].map((i) => (
            <React.Fragment key={i}>
              <div className="ticker-item">
                <span className="gold-badge">WINNER</span> Arjun S. secured $75,000 in the Kolkata Open
              </div>
              <div className="ticker-item">
                <span className="gold-badge">WINNER</span> Rohan M. claimed $120,000 in the Season Grand Slam
              </div>
              <div className="ticker-item">
                <span className="gold-badge">SCORE</span> Simran K. registered a stunning 46 at The Els Club
              </div>
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* SECTION 1: THE CROWN JEWEL (Prize Pool Bar) */}

      <motion.div className="crown-jewel-bar glass-card" variants={child} style={{ marginTop: 20 }}>
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
      </motion.div>

      <div className="dashboard-grid-elite">

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
              <div className="vault-main-metric">
                <span className="gold-label">Verified Balance</span>
                <div className="big-earnings gold-leaf-text">
                  {profile?.totalEarnings != null
                    ? `$${Number(profile.totalEarnings).toLocaleString("en-US")}`
                    : "$0"}
                </div>
              </div>
              <div className="vault-sub-metrics">
                <div className="sub-metric">
                  <span className="label">Monthly Projection</span>
                  <span className="value gold-leaf-text">${(profile?.totalEarnings || 0) * 1.2 > 50000 ? "45,000" : "12,500"}</span>
                </div>
                <div className="sub-metric">
                  <span className="label">Next Payout</span>
                  <span className="value">$3,500</span>
                </div>
              </div>
            </div>
          )}

        </motion.div>

        <motion.div className="card card--section glass-card dashboard-block slim-card" variants={child}>
          <div className="title">
            <h3 className="headline-earnings">
              Last <span className="headline-accent">5</span> scores
            </h3>
            <div className="score-header-row">
              <span className="label">Stableford Score (0-45)</span>
              <span className="label">Date</span>
            </div>
          </div>


          {isGuest ? (
            <p className="metric-small metric-cta">
              A legacy is built five rounds at a time. Secure your spot in the next monthly draw by registering your
              rolling performance history today.
            </p>
          ) : lastScores.length === 0 ? (
            <div className="empty">No scores yet.</div>
          ) : (
            <>
              <ul className="score-list compact">
                {lastScores.map((s) => (
                  <li key={s._id || s.date} className="score-row">
                    <div className="score-row-main">
                      <span className="functional-number">{s.score}</span>
                    </div>
                    <div className="score-row-meta">
                      <span className="date-value">{s.date ? new Date(s.date).toLocaleDateString() : "—"}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="score-performance-indicator">
                <span className="label">Performance Tier ({scores.length}/5)</span>
                <span className="value functional-number gold-leaf-text">
                  {scores.length > 0 ? (Math.max(...scores.map(s => s.score)) <= 45 ? "S-TIER" : "LEGACY") : "PENDING"}
                </span>
              </div>
            </>
          )}


        </motion.div>

        <motion.div className="card card--section glass-card dashboard-block slim-card charity-detail-block" variants={child}>
          <div className="title">
            <h3 className="headline-earnings">Selected charity</h3>
          </div>

          {selectedCharity ? (
            <div className="charity-card-content">
              <div className="charity-card-header">
                <div className="charity-card-icon-box">
                  <CharityIcon iconKey={selectedCharity.icon} size={32} />
                </div>
                <div className="charity-name-stack">
                  <h4 className="charity-name gold-leaf-text">{selectedCharity.name}</h4>
                  <p className="charity-tagline">{selectedCharity.category || "Community Cause"}</p>
                </div>
              </div>
              <p className="charity-desc-limited">{selectedCharity.description}</p>
              <div className="charity-progress-zone">
                <div className="progress-label-row">
                  <span className="label">Funding Progress</span>
                  <span className="value">{selectedCharity.progress || 65}%</span>
                </div>
                <div className="premium-progress-track">
                  <motion.div 
                    className="premium-progress-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedCharity.progress || 65}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>
              </div>
              <Link className="btn glass-btn full-width" to="/charities" style={{ marginTop: 12 }}>
                Change selection
              </Link>
            </div>
          ) : isGuest ? (
            <div className="charity-empty-state">
              <p className="metric-small metric-cta">
                Every swing can be a force for good. Select your cause and start routing 10% of your subscription toward
                a legacy that outlives the final hole.
              </p>
              <Link className="btn frost-sapphire full-width" to="/signup">
                Sign up to choose
              </Link>
            </div>
          ) : (
            <div className="charity-empty-state">
              <p className="metric-small">You haven't selected a charity partner yet.</p>
              <Link className="btn frost-sapphire full-width" to="/charities">
                Choose charity
              </Link>
            </div>
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

    </motion.div>
  );
};

export default Dashboard;
