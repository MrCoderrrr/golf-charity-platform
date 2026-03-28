import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TimedRedirectNotice from "../components/TimedRedirectNotice";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectNonAdmin, setRedirectNonAdmin] = useState(false);

  useEffect(() => {
    const stateFrom = location.state?.from;
    if (typeof stateFrom === "string" && stateFrom.startsWith("/admin/")) {
      // Optional: could show a small hint on the page later.
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      if (!data || data.role !== "admin") {
        setRedirectNonAdmin(true);
        return;
      }
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  if (redirectNonAdmin) {
    return (
      <TimedRedirectNotice
        message="This account isn't an admin. Redirecting you to the normal sign in page."
        to="/login"
        seconds={5}
      />
    );
  }

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

          {error && <div className="badge error-badge">{error}</div>}

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
