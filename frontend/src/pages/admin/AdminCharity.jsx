import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../api/client";
import { CHARITY_ICON_CHOICES, CharityIcon, normalizeCharityIconKey } from "../../components/CharityIcon";

const IconDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = normalizeCharityIconKey(value);

  return (
    <div className="admin-icon-select" ref={wrapRef}>
      <button
        type="button"
        className="admin-icon-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="admin-icon-trigger-box" aria-hidden="true">
          <CharityIcon iconKey={selected} size={18} />
        </span>
        <span className="admin-icon-trigger-label">Choose icon</span>
        <span className="admin-icon-trigger-caret">v</span>
      </button>

      {open && (
        <div className="admin-icon-menu" role="listbox" aria-label="Charity icons">
          {CHARITY_ICON_CHOICES.map((key) => {
            const active = key === selected;
            return (
              <button
                key={key}
                type="button"
                className={`admin-icon-option ${active ? "active" : ""}`}
                aria-selected={active}
                onClick={() => {
                  onChange?.(key);
                  setOpen(false);
                }}
              >
                <CharityIcon iconKey={key} size={26} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AdminCharity = () => {
  const { charity, setCharity } = useOutletContext();
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/charities");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load charities");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const preview = useMemo(() => {
    const src = String(charity?.image || "").trim();
    return src ? src : null;
  }, [charity?.image]);

  const pctProgress = (current, goal) => {
    const c = Number(current) || 0;
    const g = Number(goal) || 0;
    if (g <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((c / g) * 100)));
  };

  const resetForm = () => {
    setEditingId("");
    setCharity({ name: "", description: "", image: "", icon: "star", goalAmount: 0 });
  };

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        name: charity?.name || "",
        description: charity?.description || "",
        image: charity?.image || "",
        icon: normalizeCharityIconKey(charity?.icon),
        goalAmount: Number(charity?.goalAmount) || 0,
      };

      if (editingId) {
        await api.patch(`/charities/${editingId}`, payload);
        setNotice("Charity updated.");
      } else {
        await api.post("/charities", payload);
        setNotice("Charity created.");
      }

      await load();
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editingId) return;
    const ok = window.confirm("Delete this charity? This cannot be undone.");
    if (!ok) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.delete(`/charities/${editingId}`);
      setNotice("Charity deleted.");
      await load();
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page card glass-card">
      <div className="admin-split">
        <section className="admin-panel">
          <div className="title">
            <h3>{editingId ? "Edit charity" : "Create charity"}</h3>
            <span className="badge">Catalog</span>
          </div>

          <form className="admin-form" onSubmit={save}>
            <div className="admin-field">
              <label className="admin-label">Name</label>
              <input
                className="admin-input"
                value={charity?.name || ""}
                onChange={(e) => setCharity({ ...charity, name: e.target.value })}
                required
              />
            </div>

            <div className="admin-grid-2">
              <div className="admin-field">
                <label className="admin-label">Icon</label>
                <IconDropdown
                  value={charity?.icon || "star"}
                  onChange={(ic) => setCharity({ ...charity, icon: ic })}
                />
                <div className="admin-help">50 preset icons (cards, chess, stars, etc.).</div>
              </div>
              <div className="admin-field">
                <label className="admin-label">Goal amount</label>
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  value={charity?.goalAmount ?? 0}
                  onChange={(e) => setCharity({ ...charity, goalAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Description</label>
              <textarea
                className="admin-textarea"
                value={charity?.description || ""}
                onChange={(e) => setCharity({ ...charity, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Image URL</label>
              <input
                className="admin-input"
                value={charity?.image || ""}
                onChange={(e) => setCharity({ ...charity, image: e.target.value })}
              />
            </div>

            {preview && (
              <div className="admin-preview">
                <div className="admin-preview-label">Preview</div>
                <img className="admin-preview-img" src={preview} alt="Charity preview" />
              </div>
            )}

            {error && <div className="badge error-badge">{error}</div>}
            {notice && <div className="badge">{notice}</div>}

            <div className="admin-actions">
              {editingId && (
                <button className="btn secondary" type="button" onClick={resetForm} disabled={saving}>
                  Cancel
                </button>
              )}
              {editingId && (
                <button className="btn secondary" type="button" onClick={remove} disabled={saving}>
                  Delete
                </button>
              )}
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save changes" : "Create charity"}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-panel">
          <div className="title">
            <h3>Existing charities</h3>
            <span className="badge subtle">{items.length}</span>
          </div>

          {loading ? (
            <div className="empty">Loading charities...</div>
          ) : items.length === 0 ? (
            <div className="empty">No charities yet.</div>
          ) : (
            <div className="charity-grid charity-grid--dashboard admin-charity-grid">
              {items.map((c) => {
                const progress = pctProgress(c.totalDonations || 0, c.goalAmount || 0);
                return (
                  <button
                    key={c._id}
                    type="button"
                    className="charity-card glass-card charity-card--split no-image admin-charity-card"
                    onClick={() => {
                      setEditingId(c._id);
                      setNotice("");
                      setError("");
                      setCharity({
                        name: c.name || "",
                        description: c.description || "",
                        image: c.image || "",
                        icon: normalizeCharityIconKey(c.icon),
                        goalAmount: c.goalAmount || 0,
                      });
                    }}
                  >
                    <div className="charity-body charity-body--left">
                      <div className="charity-card-top">
                        <div className="charity-symbol padded" aria-hidden="true">
                          <CharityIcon iconKey={normalizeCharityIconKey(c.icon)} size={34} />
                        </div>
                        <div className="charity-card-meta">
                          <h4 className="gold-leaf-heading">{c.name}</h4>
                          <p className="charity-desc tight">{c.description || "No description."}</p>
                          <div className="charity-amount functional-number">
                            Rs {(Number(c.totalDonations || 0) || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      <div className="charity-progress">
                        <div className="progress-row">
                          <span className="label">Progress</span>
                          <span className="functional-number">{progress}%</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminCharity;
