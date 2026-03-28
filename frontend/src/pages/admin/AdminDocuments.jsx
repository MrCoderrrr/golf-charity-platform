import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

const AdminDocuments = () => {
  const { documents = [], verifyWinner, rejectWinner, loadingWinners } =
    useOutletContext();
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const hasProof = documents.filter((d) => Boolean(d.proof));
    return hasProof.filter((d) => (filter === "all" ? true : d.status === filter));
  }, [documents, filter]);

  return (
    <div className="admin-page card glass-card">
      <div className="admin-page-head">
        <div className="title">
          <h3>Documents</h3>
          <span className="badge">Verification</span>
        </div>
        <div className="admin-subline">
          <span className="label">
            Proofs: <span className="functional-number">{filtered.length}</span>
            {loadingWinners ? " (loading)" : ""}
          </span>
        </div>
      </div>

      <div className="winning-status-filters" style={{ marginTop: 10 }}>
        {["all", "pending", "verified"].map((key) => (
          <button
            key={key}
            type="button"
            className={`filter-pill ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty">
          {loadingWinners ? "Loading proofs..." : "No proofs to review."}
        </div>
      ) : (
        <ul className="list" style={{ marginTop: 10 }}>
          {filtered.map((d) => (
            <li key={d._id} className="admin-doc card glass-card">
              <div className="admin-doc-main">
                <div className="admin-doc-row">
                  <div>
                    <div className="admin-doc-title">Draw: {d.draw}</div>
                    <div className="admin-doc-meta">User: {String(d.userId || "-")}</div>
                    <div className="admin-doc-meta">
                      Uploaded: {new Date(d.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`badge ${d.status === "pending" ? "" : "badge-soft"}`}>
                    {d.status}
                  </span>
                </div>
                <div className="admin-doc-links">
                  <a className="proof-link" href={d.proof} target="_blank" rel="noreferrer">
                    View proof
                  </a>
                </div>
              </div>
              <div className="admin-doc-actions">
                <button
                  className="btn secondary"
                  onClick={() => verifyWinner?.(d._id, "paid")}
                  disabled={d.status === "verified"}
                >
                  Verify
                </button>
                <button
                  className="btn secondary"
                  onClick={() => rejectWinner?.(d._id)}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminDocuments;
