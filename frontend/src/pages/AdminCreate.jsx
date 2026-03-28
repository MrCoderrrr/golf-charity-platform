import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminCreate = () => {
  const navigate = useNavigate();
  const { bootstrapAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await bootstrapAdmin({ email, password, adminKey });
      if (!data || data.role !== "admin") {
        setError("Unable to create admin. Try again.");
        return;
      }
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Admin creation failed");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-ambient" />
      <div className="auth-card glass-card">
        <div className="auth-glow" />
        <div className="title auth-title">
          <p className="badge badge-soft">Admin access</p>
          <h2 className="premium-serif">Create Admin</h2>
          <p className="auth-sub">Temporary key: 12345 (for submission)</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </label>
          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="12345"
              required
            />
          </label>
          <label className="auth-label">
            Admin Key (test: 12345)
            <input
              className="auth-input"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
          </label>

          {error && <div className="badge error-badge">{error}</div>}

          <button className="btn frost-sapphire" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create admin"}
          </button>

          <Link to="/admin-login" className="btn glass-btn" style={{ marginTop: 10 }}>
            Back to admin sign in
          </Link>
        </form>
      </div>
    </div>
  );
};

export default AdminCreate;

