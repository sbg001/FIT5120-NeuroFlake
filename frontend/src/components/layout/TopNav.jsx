import { NavLink } from "react-router-dom";

// Accept the onOpenAssistant prop passed down from AppLayout
function TopNav({ onOpenAssistant }) {
  const navItems = [
    { to: "/", label: "Home" },
    { to: "/child", label: "Child" },
    { to: "/tasks/1", label: "Tasks" },
    { to: "/focus", label: "Focus" },
    { to: "/rewards", label: "Rewards" },
    { to: "/parent", label: "Parent" },
  ];

  return (
    <header className="top-nav">
      <div className="brand-block">
        <div className="brand-mark">N</div>
        <div>
          <h1 className="brand-title">NeuroFlake</h1>
          <p className="brand-subtitle">Building Connections that Last</p>
        </div>
      </div>

      <nav className="nav-links" style={{ display: "flex", alignItems: "center" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "nav-link active-link" : "nav-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
        
        {/*The AI Assistant Button */}
        <button 
          onClick={onOpenAssistant}
          className="primary-button"
          style={{ 
            marginLeft: "1rem", 
            padding: "0.5rem 1rem", 
            borderRadius: "20px", 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem",
            fontSize: "0.9rem"
          }}
        >
          Task Help
        </button>
      </nav>
    </header>
  );
}

export default TopNav;