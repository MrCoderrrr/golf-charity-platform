import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Footer = () => {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="footer-lux">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-mark gold-leaf-text">Legacy Green</div>
          <p className="footer-tagline">
            Digital country club giving. Play, win, and route rewards into real
            impact.
          </p>
        </div>

        <div className="footer-section">
          <div className="footer-h gold-leaf-text">Quick Links</div>
          <div className="footer-flags">
            <Link className="footer-flag" to="/">Dashboard</Link>
            {user && <Link className="footer-flag" to="/scores">Scores</Link>}
            <Link className="footer-flag footer-flag--important" to="/charities">
              Charities
            </Link>
            <Link className="footer-flag" to="/draws">Draws</Link>
            {user && <Link className="footer-flag" to="/winnings">Winnings</Link>}
            <Link className="footer-flag footer-flag--important" to="/pricing">
              Pricing
            </Link>
            {user ? (
              <Link className="footer-flag" to="/profile">Profile</Link>
            ) : (
              <Link className="footer-flag" to="/login">Login</Link>
            )}
          </div>
        </div>

        <div className="footer-section">
          <div className="footer-h gold-leaf-text">Social Media Networks</div>
          <div className="footer-flags">
            <a className="footer-flag" href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a className="footer-flag" href="https://x.com" target="_blank" rel="noreferrer">
              X
            </a>
            <a className="footer-flag" href="https://youtube.com" target="_blank" rel="noreferrer">
              YouTube
            </a>
            <a className="footer-flag" href="https://linkedin.com" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a className="footer-flag" href="https://facebook.com" target="_blank" rel="noreferrer">
              Facebook
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-copy">
          © {year} Legacy Green. All rights reserved.
        </div>
        <div className="footer-legal">
          <a href="#" onClick={(e) => e.preventDefault()}>
            Privacy
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            Terms
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
