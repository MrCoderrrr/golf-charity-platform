import { NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

const AdminLayout = ({ children, showNav = true }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const pageTitle = useMemo(() => {
    const path = location.pathname || "";
    if (path.startsWith("/admin/dashboard")) return "Analytics";
    if (path.startsWith("/admin/users")) return "Users";
    if (path.startsWith("/admin/charity")) return "Charities";
    if (path.startsWith("/admin/draw")) return "Draws";
    if (path.startsWith("/admin/documents")) return "Documents";
    return "Admin";
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <div className="grain" />
      <div className="hero-glow" />
      <div className="glow-grid" />
      <main className="layout" style={{ paddingTop: 20 }}>
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <div className="admin-badge">Admin Portal</div>
            <div className="admin-topbar-title">{pageTitle}</div>
          </div>
          <div className="admin-topbar-actions">
            <NavLink className="btn glass-btn admin-top-link" to="/">
              Back to site
            </NavLink>
            <button
              className="btn secondary admin-top-link"
              type="button"
              onClick={() => {
                logout?.();
                window.location.href = "/login";
              }}
            >
              Logout
            </button>
          </div>
        </header>
        {showNav && (
          <div className="admin-nav-card card glass-card">
            <nav className="admin-nav">
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                Users
              </NavLink>
              <NavLink
                to="/admin/charity"
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                Charities
              </NavLink>
              <NavLink
                to="/admin/draw"
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                Draws
              </NavLink>
              <NavLink
                to="/admin/documents"
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                Documents
              </NavLink>
            </nav>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
