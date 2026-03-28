import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const Winnings = () => {
  const { user } = useAuth();

  const [winnings, setWinnings] = useState([]);
  const [uploadingId, setUploadingId] = useState("");
  const [filter, setFilter] = useState("all"); // all | grand | prestige | impact
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | paid

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

  const tierFor = (w) => {
    if (!w) return "impact";
    if (w.matchCount >= 5) return "grand";
    if (w.matchCount === 4) return "prestige";
    return "impact";
  };

  const filtered = useMemo(() => {
    return winnings.filter((w) => {
      const tierOk = filter === "all" ? true : tierFor(w) === filter;
      const statusOk =
        statusFilter === "all"
          ? true
          : statusFilter === "paid"
          ? w.status === "paid"
          : w.status === "pending";
      return tierOk && statusOk;
    });
  }, [winnings, filter, statusFilter]);

  const isPaid = (w) => w.status === "paid";

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
          Track your draw victories, upload proof, and verify every win.
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

      {filtered.length === 0 ? (
        <div className="card glass-card empty">No winnings yet.</div>
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
                  {tierFor(w) === "grand"
                    ? "Grand Legacy"
                    : tierFor(w) === "prestige"
                    ? "Prestige Match"
                    : "Impact Match"}
                </span>
              </div>
              <div className="winning-amount gold-leaf-text">
                ${Number(w.prizeAmount || 0).toLocaleString("en-US")}
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
                  {uploadingId === w._id ? "Uploading..." : "Upload proof"}
                  <input
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => handleUpload(w._id, e.target.files?.[0])}
                    disabled={Boolean(uploadingId)}
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

