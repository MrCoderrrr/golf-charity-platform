import { useEffect, useState } from "react";
import api from "../api/client";

const sampleWinnings = [
  {
    _id: "w1",
    drawId: { month: 3, year: 2026 },
    prizeAmount: 50000,
    matchCount: 5,
    status: "pending",
    verified: false,
  },
  {
    _id: "w2",
    drawId: { month: 2, year: 2026 },
    prizeAmount: 18000,
    matchCount: 4,
    status: "paid",
    verified: true,
  },
  {
    _id: "w3",
    drawId: { month: 1, year: 2026 },
    prizeAmount: 6500,
    matchCount: 3,
    status: "pending",
    verified: false,
  },
  {
    _id: "w4",
    drawId: { month: 12, year: 2025 },
    prizeAmount: 12000,
    matchCount: 4,
    status: "paid",
    verified: true,
  },
  {
    _id: "w5",
    drawId: { month: 11, year: 2025 },
    prizeAmount: 8200,
    matchCount: 3,
    status: "pending",
    verified: false,
  },
  {
    _id: "w6",
    drawId: { month: 10, year: 2025 },
    prizeAmount: 30000,
    matchCount: 5,
    status: "paid",
    verified: true,
  },
];

const Winnings = () => {
  const [winnings, setWinnings] = useState(sampleWinnings);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all"); // all | grand | prestige | impact
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | paid

  const load = async () => {
    try {
      const { data } = await api.get("/winners");
      setWinnings(data);
    } catch {
      console.warn("Using sample winnings (API unreachable)");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (winnerId, file) => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("winnerId", winnerId);
    form.append("file", file);
    try {
      await api.post("/winners/proof", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
    } catch {
      // demo feedback
      setWinnings((prev) =>
        prev.map((w) =>
          w._id === winnerId ? { ...w, proofImage: URL.createObjectURL(file) } : w
        )
      );
    } finally {
      setUploading(false);
    }
  };

  const tierFor = (w) => {
    if (!w) return "impact";
    if (w.matchCount >= 5) return "grand";
    if (w.matchCount === 4) return "prestige";
    return "impact";
  };

  const filtered = winnings.filter((w) => {
    const tierOk = filter === "all" ? true : tierFor(w) === filter;
    const statusOk =
      statusFilter === "all"
        ? true
        : statusFilter === "paid"
        ? w.status === "paid"
        : w.status === "pending";
    return tierOk && statusOk;
  });

  const isPaid = (w) => w.status === "paid";

  return (
    <div className="winnings-shell">
      <div className="card card--section glass-card winnings-hero">
        <div className="winnings-hero-header">
          <h3 className="gold-leaf-heading gold-font">My Winnings</h3>
          <div className="winnings-total">Total wins: {winnings.length}</div>
        </div>
        <p className="winnings-sub">
          Track your draw victories, upload proof, and celebrate every verified win.
        </p>

        <div className="winning-filters">
          {[
            { key: "all", label: "All wins" },
            { key: "grand", label: "Grand Legacy" },
            { key: "prestige", label: "Prestige Match" },
            { key: "impact", label: "Impact Match" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`filter-pill ${filter === key ? "active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="terms-block">
        <h3 className="terms-heading">Winning Types</h3>
        <ul className="terms-list">
          <li><strong>Grand Legacy (5-number):</strong> 40% of prize pool; only jackpot tier; rolls over if nobody matches all 5.</li>
          <li><strong>Prestige Match (4-number):</strong> 35% of prize pool split evenly among 4-number winners; no rollover.</li>
          <li><strong>Impact Match (3-number):</strong> 25% of prize pool for frequent micro-wins; proof upload required before payout.</li>
        </ul>
      </div>

      <div className="winning-status-filters">
        <span className="label">Status</span>
        {["all", "paid", "pending"].map((key) => (
          <button
            key={key}
            type="button"
            className={`filter-pill ${statusFilter === key ? "active" : ""}`}
            onClick={() => setStatusFilter(key)}
          >
            {key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {(filtered.length === 0) ? (
        <div className="card glass-card empty">No winnings yet—keep swinging!</div>
      ) : (
        <div className="winnings-grid">
          {filtered.map((w) => (
            <div key={w._id} className="card glass-card winning-card">
              <div className="winning-top">
                <div>
                  <span className="label">Draw</span>
                  <div className="functional-number">{`${w.drawId?.month}/${w.drawId?.year}`}</div>
                </div>
                <span className="badge subtle">
                  {tierFor(w) === "grand" ? "Grand Legacy" : tierFor(w) === "prestige" ? "Prestige Match" : "Impact Match"}
                </span>
              </div>
              <div className="winning-amount gold-leaf-text">
                Rs {Number(w.prizeAmount || 0).toLocaleString("en-IN")}
              </div>
              <div className="winning-meta">
                <span>
                  <span className="label">Status</span>{" "}
                  <span className="functional-number">{w.status}</span>
                </span>
                <span>
                  <span className="label">Proof</span>{" "}
                  <span className="functional-number">{w.verified ? "Verified" : "Pending"}</span>
                </span>
              </div>
              {w.proofImage && (
                <a className="proof-link" href={w.proofImage} target="_blank" rel="noreferrer">
                  View proof
                </a>
              )}
              {isPaid(w) ? (
                <div
                  className="gold-leaf-text"
                  style={{
                    marginTop: 14,
                    textAlign: "center",
                    fontSize: 18,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  PAID
                </div>
              ) : (
                <label className="btn secondary" style={{ marginTop: 12, alignSelf: "center" }}>
                  Upload proof
                  <input
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => handleUpload(w._id, e.target.files[0])}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Winnings;
