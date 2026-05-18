import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { clearRequestCache } from "../../services/requestCache";

function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const publicGuestPaths = ["/", "/about", "/data", "/login", "/privacy-policy", "/terms-and-conditions"];
  const isPublicGuestPath = publicGuestPaths.includes(location.pathname);
  const isLoggedIn = !isPublicGuestPath && !!localStorage.getItem("current_user_id");
  const currentRole = String(localStorage.getItem("current_user_role") || "").toLowerCase();
  const currentName = localStorage.getItem("current_user_name");

  const childNavItems = [
    { to: "/child", label: "Child Dashboard" },
    { to: "/rewards", label: "Rewards" },
    { to: "/data", label: "Data Insights" },
  ];

  const parentNavItems = [
    { to: "/parent", label: "Parent Dashboard" },
    { to: "/parent/rewards", label: "Rewards" },
    { to: "/parent/insights", label: "Insights" },
    { to: "/parent/support", label: "Routine" },
    { to: "/data", label: "Data Insights" },
    { to: "/settings", label: "Settings" },
  ];

  const guestNavItems = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/data", label: "Data Insights" },
  ];

  const navItems = !isLoggedIn
    ? guestNavItems
    : currentRole === "parent"
    ? parentNavItems
    : childNavItems;

  const handleLogout = () => {
    clearRequestCache();
    localStorage.removeItem("current_user_id");
    localStorage.removeItem("current_user_role");
    localStorage.removeItem("current_user_name");
    localStorage.removeItem("current_user_email");
    localStorage.removeItem("current_user_username");
    localStorage.removeItem("current_child_id");
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <header className="top-nav">
      <div className="brand-block">
        <div className="brand-mark">
          <img src="/logo.png" alt="NeuroFlake logo" />
        </div>
        <div>
          <h1 className="brand-title">NeuroFlake</h1>
          <p className="brand-subtitle">Kind support for steady little wins</p>
        </div>
      </div>

      <nav className="nav-shell">
        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/" || item.to === "/parent"}
              className={({ isActive }) => {
                const isParentSectionLink =
                  currentRole === "parent" &&
                  location.pathname === item.to;

                return isActive || isParentSectionLink
                  ? "nav-link active-link"
                  : "nav-link";
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-actions">
          {isLoggedIn && currentName ? (
            <Badge tone={currentRole === "parent" ? "warm" : "mint"}>
              {currentRole === "parent" ? "Parent" : "Explorer"}: {currentName}
            </Badge>
          ) : (
            <Badge tone="default">Gentle task adventures</Badge>
          )}

          {!isLoggedIn && (
            <Button
              onClick={handleLogin}
              variant="secondary"
              size="sm"
            >
              Login
            </Button>
          )}

          {isLoggedIn && (
            <Button
              onClick={handleLogout}
              variant="secondary"
              size="sm"
            >
              Logout
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default TopNav;
