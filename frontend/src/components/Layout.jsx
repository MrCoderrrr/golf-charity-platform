import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import golfBall from "../golfball.png";
import Footer from "./Footer";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navHidden, setNavHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((v) => !v);

  useEffect(() => {
    const onScroll = () => {
      if (menuOpen) {
        // Keep the navbar visible while the drawer is open.
        setNavHidden(false);
        // Prevent a big diff jump after closing the drawer.
        lastScrollY.current = window.scrollY || 0;
        return;
      }
      const y = window.scrollY || 0;
      const diff = y - lastScrollY.current;
      
      if (y < 50) {
        setNavHidden(false);
      } else if (diff > 10) {
        setNavHidden(true);
      } else if (diff < -15) {
        setNavHidden(false);
      }
      
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  // Close drawer on route change.
  useEffect(() => {
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Escape to close.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Lock body scroll when drawer is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [menuOpen]);


  return (
    <div className="app-shell">
      <div className="grain" />
      <div className="hero-glow" />
      <div className="glow-grid" />
      <nav className={`navbar ${navHidden ? "nav-hidden" : ""}`}>
        <Link to="/" className="brand">
          <img src={golfBall} alt="Golf ball" className="brand-icon" />
          <span className="brand-script gold-leaf-text" data-text="Legacy Green">Legacy&nbsp;Green</span>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-drawer"
          onClick={toggleMenu}
        >
          <span className={`nav-toggle-lines ${menuOpen ? "open" : ""}`} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          {user && <Link to="/scores">Scores</Link>}
          <Link to="/charities">Charities</Link>
          <Link to="/draws">Draws</Link>
          {user && <Link to="/winnings">Winnings</Link>}
          <Link to="/pricing">Pricing</Link>
          {user ? (
            <Link to="/profile" className="btn secondary">
              Profile
            </Link>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </nav>

      <div
        className={`nav-backdrop ${menuOpen ? "open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <aside
        id="mobile-nav-drawer"
        className={`nav-drawer ${menuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="nav-drawer-head">
          <div className="nav-drawer-brand">
            <img src={golfBall} alt="" className="nav-drawer-icon" aria-hidden="true" />
            <div className="nav-drawer-title gold-leaf-text">Legacy Green</div>
          </div>
          <button className="nav-drawer-close" type="button" onClick={closeMenu} aria-label="Close menu">
            X
          </button>
        </div>

        <div className="nav-drawer-links">
          <Link to="/" onClick={closeMenu}>Dashboard</Link>
          {user && <Link to="/scores" onClick={closeMenu}>Scores</Link>}
          <Link to="/charities" onClick={closeMenu}>Charities</Link>
          <Link to="/draws" onClick={closeMenu}>Draws</Link>
          {user && <Link to="/winnings" onClick={closeMenu}>Winnings</Link>}
          <Link to="/pricing" onClick={closeMenu}>Pricing</Link>
        </div>

        <div className="nav-drawer-actions">
          {user ? (
            <>
              <Link to="/profile" className="btn secondary" onClick={closeMenu}>
                Profile
              </Link>
              <button className="btn" type="button" onClick={() => { closeMenu(); handleLogout(); }}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn" onClick={closeMenu}>
              Login
            </Link>
          )}
        </div>
      </aside>
      <main className="layout">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
