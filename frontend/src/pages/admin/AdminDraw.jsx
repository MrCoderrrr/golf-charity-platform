import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";

const yyyyMmDd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const AdminDraw = () => {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return yyyyMmDd(d);
  });
  const [type, setType] = useState("random");

  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/draws");
      setDraws(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load draws");
      setDraws([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upcoming = useMemo(() => {
    return draws
      .filter((d) => ["upcoming", "pending", "scheduled"].includes(String(d.status || "").toLowerCase()))
      .sort((a, b) => {
        const aRaw = a.drawAt || a.drawDate;
        const bRaw = b.drawAt || b.drawDate;
        return new Date(aRaw || 0).getTime() - new Date(bRaw || 0).getTime();
      });
  }, [draws]);

  const completed = useMemo(() => {
    return draws
      .filter((d) => String(d.status || "").toLowerCase() === "completed")
      .slice(0, 8);
  }, [draws]);

  const schedule = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusyId("schedule");
    try {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
      await api.post("/admin/draws/schedule", {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        type,
      });
      setNotice("Draw scheduled (9:00 a.m.).");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Schedule failed");
    } finally {
      setBusyId("");
    }
  };

  const runNow = async (drawId) => {
    setError("");
    setNotice("");
    setBusyId(drawId);
    try {
      await api.post(`/admin/draws/${drawId}/run`);
      setNotice("Draw completed and winners calculated.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Run failed");
    } finally {
      setBusyId("");
    }
  };

  const removeDraw = async (drawId) => {
    setError("");
    setNotice("");
    setBusyId(`del:${drawId}`);
    try {
      await api.delete(`/admin/draws/${drawId}`);
      setNotice("Draw deleted.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="admin-page card glass-card">
      <div className="admin-split">
        <section className="admin-panel">
          <div className="title">
            <h3>Schedule draw</h3>
            <span className="badge">9:00 a.m.</span>
          </div>

          <form className="admin-form" onSubmit={schedule}>
            <div className="admin-field">
              <label className="admin-label">Draw date</label>
              <input
                className="admin-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <div className="admin-help">
                Time is fixed at 9:00 a.m. (server/local timezone).
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Number generation</label>
              <select
                className="admin-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="random">Random</option>
                <option value="algorithm">Algorithm (weighted)</option>
              </select>
            </div>

            {error && <div className="badge error-badge">{error}</div>}
            {notice && <div className="badge">{notice}</div>}

            <div className="admin-actions">
              <button className="btn" type="submit" disabled={busyId === "schedule"}>
                {busyId === "schedule" ? "Scheduling..." : "Schedule draw"}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-panel">
          <div className="title">
            <h3>Upcoming draws</h3>
            <span className="badge subtle">{upcoming.length}</span>
          </div>

          {loading ? (
            <div className="empty">Loading draws...</div>
          ) : upcoming.length === 0 ? (
            <div className="empty">No upcoming draws. Schedule one.</div>
          ) : (
            <div className="admin-draw-list">
              {upcoming.map((d) => {
                const raw = d.drawAt || d.drawDate;
                const at = raw ? new Date(raw) : null;
                return (
                  <div key={d._id} className="admin-draw-item">
                    <div className="admin-draw-top">
                      <div className="admin-draw-title">
                        {at ? at.toLocaleDateString() : `${d.month}/${d.year}`}
                      </div>
                      <span className="badge badge-soft">{d.status}</span>
                    </div>
                    <div className="admin-draw-meta">
                      <span className="badge subtle">{d.type}</span>
                      <span className="label">{at ? at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "9:00 a.m."}</span>
                    </div>
                    <div className="admin-actions" style={{ marginTop: 10 }}>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => runNow(d._id)}
                        disabled={busyId === d._id}
                      >
                        {busyId === d._id ? "Running..." : "Run now"}
                      </button>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => removeDraw(d._id)}
                        disabled={busyId === `del:${d._id}` || busyId === d._id}
                      >
                        {busyId === `del:${d._id}` ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="title" style={{ marginTop: 16 }}>
            <h3>Recent completed</h3>
            <span className="badge subtle">{completed.length}</span>
          </div>
          {completed.length === 0 ? (
            <div className="empty">No completed draws yet.</div>
          ) : (
            <div className="admin-draw-list">
              {completed.map((d) => (
                <div key={d._id} className="admin-draw-item">
                  <div className="admin-draw-top">
                    <div className="admin-draw-title">
                      {String(d.month).padStart(2, "0")}/{d.year}
                    </div>
                    <span className="badge badge-soft">{d.status}</span>
                  </div>
                  <div className="admin-draw-meta">
                    <span className="badge subtle">{d.type}</span>
                    <span className="label">
                      {d.drawDate ? new Date(d.drawDate).toLocaleString() : ""}
                    </span>
                  </div>
                  <div className="admin-draw-numbers">
                    {(d.drawNumbers || []).map((n) => (
                      <span key={n} className="draw-number-pill functional-number">
                        {n}
                      </span>
                    ))}
                  </div>
                  <div className="admin-actions" style={{ marginTop: 10 }}>
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => removeDraw(d._id)}
                      disabled={busyId === `del:${d._id}`}
                    >
                      {busyId === `del:${d._id}` ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDraw;
