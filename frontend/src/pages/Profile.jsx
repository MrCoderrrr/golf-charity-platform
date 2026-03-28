import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const formatINR = (n) =>
  typeof n === "number" ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";

const Profile = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(true);

  // hydrate from session cache for instant paint
  useEffect(() => {
    const cached = sessionStorage.getItem("profileCache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setProfile(parsed);
        setLoading(false);
      } catch (_) {
        /* ignore cache parse errors */
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const { data } = await api.get("/user/me");
        setProfile(data);
        sessionStorage.setItem("profileCache", JSON.stringify(data));
      } catch (err) {
        console.error("Unable to load profile", err);
      } finally {
        setLoading(false);
        setFetching(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const wins = useMemo(() => {
    const w = profile?.wins || {};
    return {
      jackpot: w.jackpot || 0,
      fourPass: w.fourPass || 0,
      threePass: w.threePass || 0,
    };
  }, [profile]);

  const totalWins = wins.jackpot + wins.fourPass + wins.threePass || 0;

  const selectedCharity = profile?.selectedCharity;
  const firstName = profile?.name ? profile.name.split(" ")[0] : "Guest";

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
            {fetching && <span className="badge subtle">Refreshing…</span>}
          </div>
          <h1 className="profile-name gold-leaf-text">
            {firstName || "Guest"}
          </h1>
          <p className="profile-email">{profile?.email || "—"}</p>
        </div>
        <div className="profile-stats">
          <div className="stat-tile glass-card">
            <div className="stat-label">Total earnings</div>
            <div className="stat-value gold-leaf-text">{formatINR(profile?.totalEarnings)}</div>
          </div>
          <div className="stat-tile glass-card">
            <div className="stat-label">Wins</div>
            <div className="wins-bars">
              {[
                { key: "jackpot", label: "Jackpot", color: "#d4af37", value: wins.jackpot },
                { key: "fourPass", label: "4-pass", color: "#10b981", value: wins.fourPass },
                { key: "threePass", label: "3-pass", color: "#6bc0ff", value: wins.threePass },
              ].map((w) => (
                <div key={w.key} className="win-bar-vert">
                  <div
                    className="win-bar-vert-fill"
                    style={{
                      height: `${totalWins ? Math.max(18, (w.value / totalWins) * 100) : 20}%`,
                      background: w.color,
                    }}
                  />
                  <span className="win-bar-label">{w.label}</span>
                  <span className="win-bar-count">{w.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card glass-card profile-card-body">
        <div className="title">
          <h3>Selected charity</h3>
          <span className="badge">{selectedCharity ? "Chosen" : "Choose"}</span>
        </div>
        {selectedCharity ? (
          <div className="charity-row no-image">
            <div className="charity-icon">★</div>
            <div className="charity-copy">
              <h4>{selectedCharity.name}</h4>
              <p>{selectedCharity.description || "Your chosen cause."}</p>
              <p className="metric-small">
                Last month:{" "}
                <span className="functional-number">
                  {selectedCharity.collectedLastMonth
                    ? formatINR(selectedCharity.collectedLastMonth)
                    : "₹0 · data pending"}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="charity-row no-image">
            <div className="charity-icon">☆</div>
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
            <span className="value">{firstName || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="label">Email</span>
            <span className="value">{profile?.email || "—"}</span>
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
