import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-ambient" />
      <div className="auth-card glass-card">
        <div className="auth-glow" />
        <div className="title auth-title">
          <p className="badge badge-soft">Legacy access</p>
          <h2 className="premium-serif">Welcome back</h2>
          <p className="auth-sub">Sign in to your Legacy Green vault.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Signing in..." : "Login"}
          </button>
          <Link to="/admin" className="btn glass-btn" style={{ marginTop: 10 }}>
            Sign in as admin
          </Link>
        </form>
        <p className="auth-footer">
          New here?{" "}
          <Link to="/signup" className="gold-leaf-text auth-cta-link">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
