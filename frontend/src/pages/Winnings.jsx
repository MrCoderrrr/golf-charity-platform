import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const tierFor = (winner) => {
  if (!winner) return "impact";
  if (winner.matchCount >= 5) return "grand";
  if (winner.matchCount === 4) return "prestige";
  return "impact";
};

const tierLabelFor = (winner) => {
  const tier = tierFor(winner);
  if (tier === "grand") return "Grand Legacy";
  if (tier === "prestige") return "Prestige Match";
  return "Impact Match";
};

const reviewFilterKey = (winner) => {
  const state = String(winner?.reviewStatus || "").toLowerCase();
  if (state === "approved") return "approved";
  if (state === "rejected") return "rejected";
  return "pending";
};

const money = (value) => `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const Winnings = () => {
  const { user } = useAuth();

  const [winnings, setWinnings] = useState([]);
  const [uploadingId, setUploadingId] = useState("");
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!user) {
      setWinnings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/winners");
      setWinnings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load winnings.");
      setWinnings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const handleUpload = async (winnerId, file) => {
    if (!file || !winnerId) return;
    setUploadingId(winnerId);
    setError("");
    const form = new FormData();
    form.append("winnerId", winnerId);
    form.append("file", file);
    try {
      await api.post("/winners/proof", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Proof upload failed.");
    } finally {
      setUploadingId("");
    }
  };

  const filtered = useMemo(() => {
    return winnings.filter((winner) => {
      const tierOk = filter === "all" ? true : tierFor(winner) === filter;
      const statusOk = statusFilter === "all" ? true : reviewFilterKey(winner) === statusFilter;
      return tierOk && statusOk;
    });
  }, [filter, statusFilter, winnings]);

  if (!user) {
    return (
      <div className="winnings-shell">
        <div className="card glass-card empty">Sign in to view your winnings.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="winnings-shell">
        <div className="card glass-card">Loading winnings...</div>
      </div>
    );
  }

  return (
    <div className="winnings-shell">
      {error && (
        <div className="card glass-card" style={{ padding: 14, marginBottom: 12 }}>
          <div className="badge error-badge">{error}</div>
          <div style={{ marginTop: 10 }}>
            <button className="btn secondary" type="button" onClick={load}>
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="card card--section glass-card winnings-hero">
        <div className="winnings-hero-header">
          <h3 className="gold-leaf-heading gold-font">My Winnings</h3>
          <div className="winnings-total">Total wins: {winnings.length}</div>
        </div>
        <p className="winnings-sub">
          Provisional winners must upload proof before payout is finalized.
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

      <div className="winning-status-filters">
        <span className="label">Status</span>
        {["all", "pending", "approved", "rejected"].map((key) => (
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

      {filtered.length === 0 ? (
        <div className="card glass-card empty">No winnings yet.</div>
      ) : (
        <div className="winnings-grid">
          {filtered.map((winner) => {
            const reviewState = reviewFilterKey(winner);
            const needsProof = !winner.proofUrl;
            const shownAmount =
              reviewState === "approved"
                ? Number(winner.finalPrizeAmount || winner.prizeAmount || 0)
                : Number(winner.provisionalPrizeAmount || 0);

            return (
              <div key={winner._id} className="card glass-card winning-card">
                <div className="winning-top">
                  <div>
                    <span className="label">Draw</span>
                    <div className="functional-number">{`${winner.drawId?.month}/${winner.drawId?.year}`}</div>
                  </div>
                  <span className="badge subtle">{tierLabelFor(winner)}</span>
                </div>

                <div className="winning-amount gold-leaf-text">{money(shownAmount)}</div>

                <div className="winning-meta">
                  <span>
                    <span className="label">State</span>{" "}
                    <span className="functional-number">{winner.displayStatus}</span>
                  </span>
                  <span>
                    <span className="label">Matches</span>{" "}
                    <span className="functional-number">{winner.matchCount}/5</span>
                  </span>
                </div>

                <div className="winning-meta">
                  <span>
                    <span className="label">Prize</span>{" "}
                    <span className="functional-number">
                      {reviewState === "approved" ? "Finalized" : "Provisional"}
                    </span>
                  </span>
                  <span>
                    <span className="label">Proof</span>{" "}
                    <span className="functional-number">
                      {needsProof ? "Required" : reviewState === "approved" ? "Approved" : reviewState === "rejected" ? "Rejected" : "Submitted"}
                    </span>
                  </span>
                </div>

                {winner.proofUrl && (
                  <a className="proof-link" href={winner.proofUrl} target="_blank" rel="noreferrer">
                    View proof
                  </a>
                )}

                {winner.canUploadProof ? (
                  <label className="btn secondary" style={{ marginTop: 12, alignSelf: "center" }}>
                    {uploadingId === winner._id ? "Uploading..." : needsProof ? "Upload proof" : "Replace proof"}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) => handleUpload(winner._id, e.target.files?.[0])}
                      disabled={Boolean(uploadingId)}
                    />
                  </label>
                ) : (
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
                    {reviewState === "approved" ? "APPROVED" : "REJECTED"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Winnings;
