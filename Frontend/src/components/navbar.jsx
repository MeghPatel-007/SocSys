import { useState } from "react";
import { FaBars, FaSignOutAlt, FaTimes, FaUsers } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { useNavigate } from "react-router-dom";

function Navbar({ links = [], sectionLabel = "Portal" }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActiveLink = (path) => {
    const [targetPath, targetHash = ""] = path.split("#");

    if (location.pathname !== targetPath) {
      return false;
    }

    if (targetHash) {
      return location.hash === `#${targetHash}`;
    }

    return !location.hash;
  };

  const activeSection = (() => {
    const matched = links.find((item) => isActiveLink(item.path));
    return matched ? matched.label : sectionLabel;
  })();

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore sign-out failures and still clear local session.
    }

    localStorage.removeItem("socsysUser");
    localStorage.removeItem("socsysSelectedRole");
    setIsOpen(false);
    navigate("/");
  };

  return (
    <nav className="soc-navbar">
      <div className="soc-navbar-inner">
        <Link to="/" className="soc-brand" onClick={() => setIsOpen(false)}>
          <div className="soc-brand-badge">
            <FaUsers className="text-white text-xl" />
          </div>
          <span className="soc-brand-text">SocSys</span>
        </Link>

        <div className="soc-navbar-links">
          {links.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`soc-nav-link ${isActiveLink(item.path) ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="soc-navbar-meta">
          <span className="soc-navbar-pill">{activeSection}</span>

          <button type="button" className="soc-logout" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="soc-mobile-toggle"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="soc-mobile-menu">
          {links.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`soc-mobile-link ${isActiveLink(item.path) ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            className="soc-mobile-logout"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
