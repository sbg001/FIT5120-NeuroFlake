import { Link } from "react-router-dom";

function AppFooter() {
  return (
    <footer className="app-footer" aria-label="NeuroFlake footer">
      <div className="app-footer__brand">
        <strong>NeuroFlake</strong>
        <p>Made with care for every small step.</p>
      </div>

      <nav className="app-footer__links" aria-label="Legal links">
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms-and-conditions">Terms & Conditions</Link>
      </nav>

      <p className="app-footer__copyright">&copy; 2026 NeuroFlake.</p>
    </footer>
  );
}

export default AppFooter;
