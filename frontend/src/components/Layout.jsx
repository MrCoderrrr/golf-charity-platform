import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import golfBall from "../golfball.png";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navHidden, setNavHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const diff = y - lastScroll;
      if (y > 80 && diff > 2) {
        setNavHidden(true);
      } else if (diff < -2) {
        setNavHidden(false);
      }
      setLastScroll(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScroll]);

  return (
    <div className="app-shell">
      <div className="grain" />
      <div className="hero-glow" />
      <div className="glow-grid" />
      <nav className={`navbar ${navHidden ? "nav-hidden" : ""}`}>
        <Link to="/" className="brand">
          <img src={golfBall} alt="Golf ball" className="brand-icon" />
          <span className="brand-script gold-leaf-text">Legacy&nbsp;Green</span>
        </Link>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          {user && <Link to="/scores">Scores</Link>}
          <Link to="/charities">Charities</Link>
          <Link to="/draws">Draws</Link>
          {user && <Link to="/winnings">Winnings</Link>}
          <Link to="/pricing">Pricing</Link>
          {user && user.role === "admin" && <Link to="/admin">Admin</Link>}
          {user ? (
            <Link to="/profile" className="btn secondary">
              Profile
            </Link>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </nav>
      <main className="layout">
        {children}
      </main>
    </div>
  );
};

export default Layout;
