import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="page-section">
      <div className="content-card">
        <p className="eyebrow">Page not found</p>
        <h2 className="page-title">We could not find that page</h2>
        <p className="page-text">
          The page you are looking for does not exist yet.
        </p>
        <Link to="/" className="primary-button small-button">
          Go Home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;