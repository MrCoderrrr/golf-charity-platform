import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const AdminLogin = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      if (!data || data.role !== "admin") {
        // Not an admin — log them back out so we don't leave stale state
        logout();
        toast.error("This account does not have admin privileges.");
        setLoading(false);
        return;
      }
      toast.success("Welcome back, Administrator.");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Sign in failed. Check your credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-ambient" />
      <div className="auth-card glass-card">
        <div className="auth-glow" />
        <div className="title auth-title">
          <p className="badge badge-soft">Admin access</p>
          <h2 className="premium-serif">Admin Sign In</h2>
          <p className="auth-sub">Use your admin email + password.</p>
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
              required
            />
          </label>

          <button className="btn frost-sapphire" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <Link to="/admin-create" className="btn glass-btn" style={{ marginTop: 10 }}>
            Create/upgrade admin account
          </Link>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
