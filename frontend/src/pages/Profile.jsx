import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const formatINR = (n) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(true);

  const [donationPct, setDonationPct] = useState(10);
  const [savingPct, setSavingPct] = useState(false);
  const [pctNotice, setPctNotice] = useState("");

  const load = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setFetching(false);
      return;
    }

    setFetching(true);
    try {
      const { data } = await api.get("/user/me");
      setProfile(data);
      if (typeof data?.charityPercentage === "number") {
        setDonationPct(Math.max(10, Math.min(100, data.charityPercentage)));
      }
      sessionStorage.setItem("profileCache", JSON.stringify(data));
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    const cached = sessionStorage.getItem("profileCache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setProfile(parsed);
        setLoading(false);
        if (typeof parsed?.charityPercentage === "number") {
          setDonationPct(Math.max(10, Math.min(100, parsed.charityPercentage)));
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const wins = useMemo(() => {
    const w = profile?.wins || {};
    return {
      jackpot: w.jackpot || 0,
      fourPass: w.fourPass || 0,
      threePass: w.threePass || 0,
    };
  }, [profile]);

  const totalWins = wins.jackpot + wins.fourPass + wins.threePass || 0;
  const firstName = profile?.name ? profile.name.split(" ")[0] : "Guest";
  const selectedCharity = profile?.selectedCharity || null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const savePct = async () => {
    setSavingPct(true);
    setPctNotice("");
    try {
      const { data } = await api.put("/user/charity-percentage", {
        charityPercentage: donationPct,
      });
      setProfile(data);
      sessionStorage.setItem("profileCache", JSON.stringify(data));
      setPctNotice("Saved.");
    } catch (err) {
      setPctNotice(err?.response?.data?.message || "Save failed.");
    } finally {
      setSavingPct(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-shell">
        <div className="card glass-card empty">Sign in to view your profile.</div>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="profile-shell">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="profile-shell">
      <section className="profile-hero glass-card">
        <div className="hero-top">
          <div className="badge-row">
            {fetching && <span className="badge subtle">Refreshing...</span>}
          </div>
          <h1 className="profile-name gold-leaf-text">{firstName || "Guest"}</h1>
          <p className="profile-email">{profile?.email || "-"}</p>
        </div>

        <div className="profile-stats">
          <div className="stat-tile glass-card">
            <div className="stat-label">Total earnings</div>
            <div className="stat-value gold-leaf-text">
              {formatINR(profile?.totalEarnings)}
            </div>
            <div className="wins-rows earnings-breakdown">
              <div className="wins-row">
                <span className="label">Won in Jackpot</span>
                <span className="functional-number win-value">
                  {formatINR(profile?.totalEarnings)}
                </span>
              </div>
              <div className="wins-row">
                <span className="label">Won in 4-pass</span>
                <span className="functional-number win-value">
                  {formatINR(profile?.totalEarnings)}
                </span>
              </div>
              <div className="wins-row">
                <span className="label">Won in 3-pass</span>
                <span className="functional-number win-value">
                  {formatINR(profile?.totalEarnings)}
                </span>
              </div>
            </div>
          </div>

          <div className="stat-tile glass-card">
            <div className="stat-label">Wins</div>
            <div className="wins-rows wins-list">
              <div className="wins-row">
                <span className="label">Jackpot</span>
                <span className="gold-leaf-heading win-value jackpot-value functional-number">
                  {wins.jackpot}
                </span>
              </div>
              <div className="wins-row">
                <span className="label">4-pass</span>
                <span className="functional-number win-value">{wins.fourPass}</span>
              </div>
              <div className="wins-row">
                <span className="label">3-pass</span>
                <span className="functional-number win-value">{wins.threePass}</span>
              </div>
            </div>
          </div>

          <div className="stat-tile glass-card">
            <div className="stat-label">Charity percentage</div>
            <div className="stat-value">{donationPct}%</div>
            <div className="donation-slider inline">
              <span className="label">Adjust share</span>
              <div className="donation-slider-control">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={donationPct}
                  onChange={(e) => {
                    setDonationPct(Math.max(10, Math.min(100, Number(e.target.value) || 10)));
                    setPctNotice("");
                  }}
                />
                <span className="functional-number">{donationPct}%</span>
              </div>
            </div>
            <div className="profile-actions" style={{ marginTop: 10 }}>
              <button className="btn secondary" type="button" onClick={savePct} disabled={savingPct}>
                {savingPct ? "Saving..." : "Save"}
              </button>
              {pctNotice && <span className="label">{pctNotice}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="card glass-card profile-card-body">
        <div className="title">
          <h3>Selected charity</h3>
        </div>
        {selectedCharity ? (
          <div className="charity-row no-image">
            <div className="charity-icon">*</div>
            <div className="charity-copy">
              <h4>{selectedCharity.name}</h4>
              <p>{selectedCharity.description || "Your chosen cause."}</p>
              <p className="metric-small">
                Total donated:{" "}
                <span className="functional-number">
                  {formatINR(selectedCharity.totalDonations)}
                </span>
              </p>
              {selectedCharity.goalAmount ? (
                <p className="metric-small">
                  Goal:{" "}
                  <span className="functional-number">
                    {formatINR(selectedCharity.goalAmount)}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="charity-row no-image">
            <div className="charity-icon">+</div>
            <div className="charity-copy">
              <p>No charity selected yet.</p>
            </div>
            <Link className="btn frost-sapphire" to="/charities">
              Choose charity
            </Link>
          </div>
        )}
      </section>

      <section className="card glass-card profile-card-body">
        <div className="title">
          <h3>Account</h3>
          <span className="badge">Secure</span>
        </div>
        <div className="profile-grid">
          <div className="profile-field">
            <span className="label">Name</span>
            <span className="value">{firstName || "-"}</span>
          </div>
          <div className="profile-field">
            <span className="label">Email</span>
            <span className="value">{profile?.email || "-"}</span>
          </div>
          <div className="profile-field">
            <span className="label">Subscription</span>
            <span className="value">{profile?.isSubscribed ? "Active" : "Not subscribed"}</span>
          </div>
          <div className="profile-field">
            <span className="label">Role</span>
            <span className="value">{profile?.role || "user"}</span>
          </div>
          <div className="profile-field">
            <span className="label">Total earnings</span>
            <span className="value">{formatINR(profile?.totalEarnings)}</span>
          </div>
          <div className="profile-field">
            <span className="label">Total wins</span>
            <span className="value">{totalWins}</span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>
    </div>
  );
};

const ProfileSkeleton = () => (
  <div className="profile-shell">
    <div className="profile-hero glass-card skeleton-card">
      <div className="skeleton-bar wide" />
      <div className="skeleton-bar mid" />
      <div className="skeleton-grid">
        <div className="skeleton-bar short" />
        <div className="skeleton-bar short" />
      </div>
    </div>
    <div className="card glass-card skeleton-card" style={{ marginTop: 16 }}>
      <div className="skeleton-bar mid" />
      <div className="skeleton-grid">
        <div className="skeleton-bar short" />
        <div className="skeleton-bar short" />
        <div className="skeleton-bar short" />
      </div>
    </div>
  </div>
);

export default Profile;

