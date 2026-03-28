import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const { signup, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup(form);
      navigate("/admin-login");
    } catch (err) {
      setError(err?.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-ambient" />
      <div className="auth-card glass-card">
        <div className="auth-glow" />
        <div className="title auth-title">
          <p className="badge badge-soft">Join Legacy</p>
          <h2 className="premium-serif">Create account</h2>
          <p className="auth-sub">Unlock the cinematic vault experience.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Name
            <input
              className="auth-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>
          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
          {error && <div className="badge error-badge">{error}</div>}
          <button className="btn frost-sapphire" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
          <Link to="/admin-login" className="btn glass-btn" style={{ marginTop: 10 }}>
            Sign up as admin
          </Link>
        </form>
        <p className="auth-footer">
          Already registered?{" "}
          <Link to="/login" className="gold-leaf-text auth-cta-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
