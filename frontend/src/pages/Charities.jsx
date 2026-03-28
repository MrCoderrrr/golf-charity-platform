import { useEffect, useState } from "react";
import api from "../api/client";

const sampleNames = [
  "Fairway Futures",
  "Birdies for Relief",
  "Green Horizons",
  "Youth Caddies Fund",
  "Links for Life",
  "Fore the Planet",
  "Swing Scholars",
  "Caddie Uplift",
  "Course to Career",
  "Play It Forward",
  "Impact Fairways",
  "Par for Purpose",
];

const sampleIcons = ["★", "♠", "♥", "♣", "♦", "✦", "✧", "✿", "❖", "☀", "☂", "♞"];

const sampleCharities = Array.from({ length: 12 }).map((_, idx) => ({
  _id: `demo-${idx + 1}`,
  name: sampleNames[idx] || `Charity ${idx + 1}`,
  description: "Curated impact program for golf-driven giving.",
  icon: sampleIcons[idx % sampleIcons.length],
  collectedLastMonth: 5000 + idx * 250,
}));

const formatINR = (n) =>
  typeof n === "number" ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0 · data pending";

const Charities = () => {
  const [charities, setCharities] = useState(sampleCharities);
  const [selected, setSelected] = useState(sampleCharities[0]?._id || "");
  const [selectedCharity, setSelectedCharity] = useState(sampleCharities[0] || null);
  const [contributionPct, setContributionPct] = useState(10);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [scores, setScores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const iconFor = (c) => c?.icon || (c?.name ? c.name.charAt(0).toUpperCase() : "★");

  const loadData = async () => {
    try {
      const [
        { data: charityData },
        { data: profile },
        { data: subscription },
        { data: scoreData },
      ] = await Promise.all([
        api.get("/charities"),
        api.get("/user/me"),
        api.get("/subscriptions"),
        api.get("/scores"),
      ]);

      setScores(scoreData || []);
      const dataset = Array.isArray(charityData) && charityData.length ? charityData : sampleCharities;
      setCharities(dataset);

      const selectedId = profile?.selectedCharity?._id || dataset[0]?._id || "";
      setSelected(selectedId);
      const selectedObj = dataset.find((c) => c._id === selectedId) || dataset[0] || null;
      setSelectedCharity(selectedObj);

      const pct = profile?.charityPercentage || 10;
      setContributionPct(pct);
      const planValue =
        subscription?.planType === "yearly"
          ? 2999
          : subscription?.planType === "monthly"
          ? 1499
          : 0;
      setContributionAmount(((planValue * pct) / 100).toFixed(0));
    } catch {
      setCharities(sampleCharities);
      setSelected(sampleCharities[0]?._id || "");
      setSelectedCharity(sampleCharities[0] || null);
      setContributionPct(10);
      setContributionAmount(0);
      setScores([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickSelect = async (charityId) => {
    setSelected(charityId);
    try {
      await api.put("/user/select-charity", { charityId });
      await loadData();
    } catch {
      /* ignore failures */
    }
  };

  const selectedObj = charities.find((c) => c._id === selected) || selectedCharity || null;
  const otherCharities = charities.filter((c) => c._id !== (selectedObj?._id || ""));

  const metric = (c) =>
    c && c.collectedLastMonth != null ? formatINR(c.collectedLastMonth) : "₹0 · data pending";

  const filteredCharities = otherCharities.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (c?.name || "").toLowerCase().includes(q) || (c?.description || "").toLowerCase().includes(q);
  });

  return (
    <div className="grid" style={{ gap: "18px" }}>
      {selectedObj && (
        <section className="selected-charity-hero selected-charity-hero--split no-image">
          <div className="selected-charity-content">
            <div className="title">
              <h3>{selectedObj.name}</h3>
              <span className="badge">Selected</span>
            </div>
            <div className="selected-charity-symbol">{iconFor(selectedObj)}</div>
            <p className="selected-charity-lede">{selectedObj.description}</p>
            <div className="selected-charity-metrics">
              <div>
                <span className="hero-counter-value">
                  <span className="functional-number">{metric(selectedObj)}</span>
                </span>
                <span className="hero-counter-label">Last month</span>
              </div>
              <div>
                <span className="hero-counter-value metric-highlight">
                  <span className="functional-number">
                    {contributionAmount > 0
                      ? `₹${Number(contributionAmount).toLocaleString("en-IN")}/mo`
                      : "Data pending"}
                  </span>
                </span>
                <span className="hero-counter-label">Your impact</span>
              </div>
            </div>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {filteredCharities.length === 0 ? (
          <div className="empty">No charities match that search.</div>
        ) : (
          <div className="charity-grid">
            {filteredCharities.map((charity) => (
              <div key={charity._id} className="charity-card glass-card charity-card--split no-image">
                <div className="charity-body charity-body--left">
                  <div className="title">
                    <div className="charity-symbol">{iconFor(charity)}</div>
                    <h4>{charity.name}</h4>
                    <span className="badge subtle">{metric(charity)}</span>
                  </div>
                  <p className="charity-desc">{charity.description}</p>
                  <button className="btn secondary" onClick={() => handleQuickSelect(charity._id)}>
                    Select
                  </button>
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
