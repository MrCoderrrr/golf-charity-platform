import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { CharityIcon } from "../components/CharityIcon";

const formatINR = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const getProgressMeta = (current, goal) => {
  const raised = Number(current) || 0;
  const target = Number(goal) || 0;
  if (raised <= 0 || target <= 0) return { width: 0, label: "0%" };
  const raw = (raised / target) * 100;
  return {
    width: Math.max(2, Math.min(100, raw)),
    label: raw < 1 ? "<1%" : `${clampPercent(raw)}%`,
  };
};

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
      const [{ data }, contributionsRes] = await Promise.all([
        api.get("/user/me"),
        api.get("/user/contributions").catch(() => ({ data: null })),
      ]);

      const charityId =
        data?.selectedCharity && typeof data.selectedCharity === "object"
          ? String(data.selectedCharity._id || "")
          : String(data?.selectedCharity || "");
      const myCharityContribution =
        contributionsRes?.data?.months?.reduce((acc, month) => {
          const matching = month?.byCharity?.find((item) => String(item?.charityId) === charityId);
          return acc + Number(matching?.total || 0);
        }, 0) || 0;
      const nextProfile = { ...data, myCharityContribution };

      setProfile(nextProfile);
      if (typeof data?.charityPercentage === "number") {
        setDonationPct(Math.max(10, Math.min(100, data.charityPercentage)));
      }
      sessionStorage.setItem("profileCache", JSON.stringify(nextProfile));
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
  const earnings = useMemo(() => {
    const e = profile?.earningsBreakdown || {};
    return {
      jackpot: Number(e.jackpot || 0),
      fourPass: Number(e.fourPass || 0),
      threePass: Number(e.threePass || 0),
      total:
        Number(e.total) ||
        Number(profile?.totalEarnings || 0),
    };
  }, [profile]);

  const totalWins = wins.jackpot + wins.fourPass + wins.threePass || 0;
  const tiersUnlocked = [wins.jackpot, wins.fourPass, wins.threePass].filter((count) => count > 0).length;
  const firstName = profile?.name ? profile.name.split(" ")[0] : "Guest";
  const selectedCharityRaw = profile?.selectedCharity || null;
  const selectedCharity =
    selectedCharityRaw && typeof selectedCharityRaw === "object" ? selectedCharityRaw : null;
  const selectedCharityId =
    selectedCharity?._id || (typeof selectedCharityRaw === "string" ? selectedCharityRaw : "");
  const charityProgress = getProgressMeta(
    selectedCharity?.totalDonations || 0,
    selectedCharity?.goalAmount || 0
  );
  const charityContribution = Number(profile?.myCharityContribution || 0);

  useEffect(() => {
    if (!selectedCharityId) return;

    let cancelled = false;

    api
      .get("/charities")
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const matched = list.find((item) => String(item?._id) === String(selectedCharityId));
        if (matched) {
          setProfile((curr) => ({ ...(curr || {}), selectedCharity: matched }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedCharityId]);

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
      const nextProfile = {
        ...data,
        myCharityContribution: Number(profile?.myCharityContribution || 0),
      };
      setProfile(nextProfile);
      sessionStorage.setItem("profileCache", JSON.stringify(nextProfile));
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
          <div className="stat-tile glass-card premium-stat-tile earnings-premium-tile">
            <div className="premium-card-head">
              <div className="stat-label">Total earnings</div>
              <span className="premium-kicker functional-number">{totalWins} payouts</span>
            </div>
            <div className="premium-hero-value gold-leaf-text">
              {formatINR(earnings.total)}
            </div>
            <div className="premium-support-row">
              <span className="premium-support-label">Winning tiers unlocked</span>
              <span className="premium-support-value functional-number">{tiersUnlocked}/3</span>
            </div>
            <div className="premium-tier-grid earnings-tier-grid">
              <div className="premium-tier-tile jackpot-tier">
                <span className="premium-tier-label">Jackpot</span>
                <span className="premium-tier-value functional-number">
                  {formatINR(earnings.jackpot)}
                </span>
              </div>
              <div className="premium-tier-tile fourpass-tier">
                <span className="premium-tier-label">4-pass</span>
                <span className="premium-tier-value functional-number">
                  {formatINR(earnings.fourPass)}
                </span>
              </div>
              <div className="premium-tier-tile threepass-tier">
                <span className="premium-tier-label">3-pass</span>
                <span className="premium-tier-value functional-number">
                  {formatINR(earnings.threePass)}
                </span>
              </div>
            </div>
          </div>

          <div className="stat-tile glass-card premium-stat-tile wins-premium-tile">
            <div className="premium-card-head">
              <div className="stat-label">Wins</div>
              <span className="premium-kicker functional-number">{totalWins} total</span>
            </div>
            <div className="premium-hero-value gold-leaf-text functional-number">
              {totalWins}
            </div>
            <div className="premium-support-row">
              <span className="premium-support-label">Distribution across prize tiers</span>
              <span className="premium-support-value functional-number">{tiersUnlocked}/3</span>
            </div>
            <div className="premium-tier-stack">
              <div className="premium-tier-lane jackpot-tier">
                <span className="premium-tier-label">Jackpot</span>
                <span className="premium-tier-bar">
                  <span
                    className="premium-tier-fill"
                    style={{ width: `${totalWins > 0 ? Math.max(14, (wins.jackpot / totalWins) * 100) : 14}%` }}
                  />
                </span>
                <span className="premium-tier-value functional-number">{wins.jackpot}</span>
              </div>
              <div className="premium-tier-lane fourpass-tier">
                <span className="premium-tier-label">4-pass</span>
                <span className="premium-tier-bar">
                  <span
                    className="premium-tier-fill"
                    style={{ width: `${totalWins > 0 ? Math.max(14, (wins.fourPass / totalWins) * 100) : 14}%` }}
                  />
                </span>
                <span className="premium-tier-value functional-number">{wins.fourPass}</span>
              </div>
              <div className="premium-tier-lane threepass-tier">
                <span className="premium-tier-label">3-pass</span>
                <span className="premium-tier-bar">
                  <span
                    className="premium-tier-fill"
                    style={{ width: `${totalWins > 0 ? Math.max(14, (wins.threePass / totalWins) * 100) : 14}%` }}
                  />
                </span>
                <span className="premium-tier-value functional-number">{wins.threePass}</span>
              </div>
            </div>
          </div>

          <div className="stat-tile glass-card charity-share-tile">
            <div className="charity-share-head">
              <div className="stat-label">Charity percentage</div>
              <span className="charity-share-pill functional-number gold-leaf-text">{donationPct}%</span>
            </div>

            <div className="charity-share-hero functional-number gold-leaf-text">{donationPct}%</div>
            <p className="charity-share-copy">
              Your donation share from each subscription. Future contributions will follow this percentage after you save.
            </p>

            <div className="charity-share-meta">
              <span className="charity-share-rule">Minimum 10%</span>
              <span className="charity-share-live">Live adjustment</span>
            </div>

            <div className="donation-slider premium-slider">
              <div className="donation-slider-topline">
                <span className="label">Adjust share</span>
                <span className="functional-number donation-slider-value gold-leaf-text">{donationPct}%</span>
              </div>
              <div
                className="donation-slider-control"
                style={{
                  "--slider-fill": `${((donationPct - 10) / 90) * 100}%`,
                }}
              >
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
              </div>
            </div>

            <div className="charity-share-actions">
              <button className="btn secondary charity-share-save" type="button" onClick={savePct} disabled={savingPct}>
                {savingPct ? "Saving..." : "Save"}
              </button>
              {pctNotice && <span className="label charity-share-notice">{pctNotice}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="card glass-card profile-card-body">
        <div className="title">
          <h3>Selected charity</h3>
        </div>
        {selectedCharity ? (
          <div className="profile-charity-panel">
            <div className="profile-charity-head">
              <div className="profile-charity-icon">
                <CharityIcon iconKey={selectedCharity.icon} size={34} />
              </div>
              <div className="profile-charity-title">
                <span className="profile-charity-kicker">Chosen cause</span>
                <h4 className="gold-leaf-text">{selectedCharity.name}</h4>
                <p>{selectedCharity.description || "Your chosen cause."}</p>
              </div>
              <div className="profile-charity-badge">
                <span className="label">Donation share</span>
                <span className="functional-number gold-leaf-text">{donationPct}%</span>
              </div>
            </div>

            <div className="profile-charity-metrics">
              <div className="profile-charity-metric profile-charity-metric--gold">
                <span className="label">Total raised</span>
                <span className="functional-number">
                  {formatINR(selectedCharity.totalDonations)}
                </span>
              </div>
              <div className="profile-charity-metric profile-charity-metric--emerald">
                <span className="label">Your impact</span>
                <span className="functional-number">
                  {formatINR(charityContribution)}
                </span>
              </div>
              <div className="profile-charity-metric profile-charity-metric--ice">
                <span className="label">Goal</span>
                <span className="functional-number">
                  {selectedCharity.goalAmount ? formatINR(selectedCharity.goalAmount) : "Not set"}
                </span>
              </div>
            </div>

            <div className="profile-charity-progress">
              <div className="profile-charity-progress-row">
                <span className="label">Funding progress</span>
                <span className="functional-number">{charityProgress.label}</span>
              </div>
              <div className="profile-charity-progress-track">
                <span
                  className="profile-charity-progress-fill"
                  style={{ width: `${charityProgress.width}%` }}
                />
              </div>
            </div>

            <div className="profile-charity-actions">
              <Link className="btn frost-sapphire" to="/charities">
                Change charity
              </Link>
            </div>
          </div>
        ) : (
          <div className="profile-charity-panel profile-charity-panel--empty">
            <div className="profile-charity-head">
              <div className="profile-charity-icon">+</div>
              <div className="profile-charity-title">
                <span className="profile-charity-kicker">Chosen cause</span>
                <h4>Choose your impact partner</h4>
                <p>Select a charity to turn every subscription into visible contribution data.</p>
              </div>
            </div>
            <div className="profile-charity-actions">
              <Link className="btn frost-sapphire" to="/charities">
                Choose charity
              </Link>
            </div>
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
            <span className="value gold-leaf-text">{formatINR(profile?.totalEarnings)}</span>
          </div>
          <div className="profile-field">
            <span className="label">Total wins</span>
            <span className="value gold-leaf-text">{totalWins}</span>
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
