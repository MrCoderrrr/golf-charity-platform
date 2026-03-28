import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const AdminCreate = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { bootstrapAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 5) {
      toast.error("Password must be at least 5 characters.");
      return;
    }
    try {
      const data = await bootstrapAdmin({ email, password, adminKey });
      if (!data || data.role !== "admin") {
        toast.error("Unable to create admin. Please check the admin key.");
        return;
      }
      toast.success("Admin account created successfully!");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Admin creation failed. Check your admin key.");
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
              placeholder="min 5 characters"
              required
              minLength={5}
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
