import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { CharityIcon } from "../components/CharityIcon";

const formatINR = (n) => {
  const value = Number(n) || 0;
  return `Rs ${value.toLocaleString("en-IN")}`;
};

const iconKeyFor = (c) => String(c?.icon || "").trim() || "star";

const pctProgress = (current, goal) => {
  const c = Number(current) || 0;
  const g = Number(goal) || 0;
  if (g <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((c / g) * 100)));
};

const Charities = () => {
  const { user } = useAuth();

  const [charities, setCharities] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const charityReq = api.get("/charities");
      const meReq = user ? api.get("/user/me") : Promise.resolve({ data: null });
      const subReq = user ? api.get("/subscriptions") : Promise.resolve({ data: null });

      const [{ data: charityData }, { data: me }, { data: sub }] =
        await Promise.all([charityReq, meReq, subReq]);

      const list = Array.isArray(charityData) ? charityData : [];
      setCharities(list);
      setProfile(me);
      setSubscription(sub);

      const initialSelected =
        me?.selectedCharity?._id || list[0]?._id || "";
      setSelectedId(initialSelected);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load charities.");
      setCharities([]);
      setProfile(null);
      setSubscription(null);
      setSelectedId("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const selected = useMemo(
    () => charities.find((c) => c._id === selectedId) || null,
    [charities, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return charities;
    return charities.filter((c) => {
      const name = String(c?.name || "").toLowerCase();
      const desc = String(c?.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [charities, search]);

  const donationPct = Math.max(10, Math.min(100, Number(profile?.charityPercentage) || 10));
  const planAmount = Number(subscription?.amount) || 0;
  const myContribution = Math.round((planAmount * donationPct) / 100);
  const contributionLabel =
    subscription?.planType === "yearly" ? "/yr" : subscription?.planType === "monthly" ? "/mo" : "";

  const selectCharity = async (id) => {
    setSelectedId(id);
    if (!user) return;
    try {
      await api.put("/user/select-charity", { charityId: id });
      const { data } = await api.get("/user/me");
      setProfile(data);
    } catch {
      // show selection locally even if request fails, but keep banner visible
      setError("Could not save your selected charity. Retry.");
    }
  };

  if (loading) {
    return <div className="card glass-card">Loading charities...</div>;
  }

  return (
    <div className="grid" style={{ gap: 18 }}>
      {error && (
        <div className="card glass-card" style={{ padding: 14 }}>
          <div className="badge error-badge">{error}</div>
          <div style={{ marginTop: 10 }}>
            <button className="btn secondary" type="button" onClick={load}>
              Retry
            </button>
          </div>
        </div>
      )}

      {selected && (
        <section className="selected-charity-hero selected-charity-hero--split no-image">
          <div className="selected-charity-content">
            <div className="selected-charity-header">
              <div className="selected-charity-icon-name">
                <div className="selected-charity-symbol">
                  <CharityIcon iconKey={iconKeyFor(selected)} size={40} />
                </div>
                <h3 className="gold-leaf-heading">{selected.name}</h3>
              </div>
              <span className="badge">Selected</span>
            </div>

            <div className="selected-charity-metrics inline">
              <div className="metric-pair">
                <span className="hero-counter-label">Total donated</span>
                <span className="hero-counter-value">
                  <span className="functional-number">
                    {formatINR(selected.totalDonations || 0)}
                  </span>
                </span>
              </div>
              <div className="metric-pair">
                <span className="hero-counter-label">Your share</span>
                <span className="hero-counter-value metric-highlight">
                  <span className="functional-number">
                    {planAmount > 0 ? `${formatINR(myContribution)}${contributionLabel}` : "Subscribe to contribute"}
                  </span>
                </span>
              </div>
            </div>

            {selected.description && (
              <p className="selected-charity-lede selected-charity-lede-inline">
                {selected.description}
              </p>
            )}

            <div className="charity-progress">
              <div className="progress-row">
                <span className="label">Goal</span>
                <span className="functional-number">
                  {formatINR(selected.goalAmount || 0)}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${pctProgress(selected.totalDonations || 0, selected.goalAmount || 0)}%`,
                  }}
                />
              </div>
            </div>

            {!user && (
              <div className="charity-action" style={{ marginTop: 14 }}>
                <Link className="btn frost-sapphire" to="/signup">
                  Sign up to select
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="card glass-card charity-list-card">
        <div className="title charity-list-head">
          <h3>Find a charity</h3>
          <div className="charity-search">
            <input
              type="search"
              placeholder="Search by name or cause"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">No charities available.</div>
        ) : (
          <div className="charity-grid">
            {filtered.map((c) => (
              <div key={c._id} className="charity-card glass-card charity-card--split no-image">
                <div className="charity-body charity-body--left">
                    <div className="charity-card-top">
                    <div className="charity-symbol padded">
                      <CharityIcon iconKey={iconKeyFor(c)} size={34} />
                    </div>
                    <div className="charity-card-meta">
                      <h4 className="gold-leaf-heading">{c.name}</h4>
                      <p className="charity-desc tight">{c.description || "No description."}</p>
                      <div className="charity-amount functional-number">
                        {formatINR(c.totalDonations || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="charity-progress">
                    <div className="progress-row">
                      <span className="label">Goal</span>
                      <span className="functional-number">
                        {formatINR(c.goalAmount || 0)}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pctProgress(c.totalDonations || 0, c.goalAmount || 0)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="charity-action">
                    <button className="btn secondary" onClick={() => selectCharity(c._id)}>
                      Select
                    </button>
                    <Link className="btn frost-sapphire" to="/pricing">
                      Subscribe
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Charities;
