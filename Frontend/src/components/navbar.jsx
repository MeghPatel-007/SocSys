import { useState } from "react";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaUsers,
  FaCalendar,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white/10 backdrop-blur-2xl border-b border-white/20 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-400 to-pink-400 p-2 rounded-lg">
              <FaUsers className="text-white text-xl" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-pink-200 bg-clip-text text-transparent">
              SocSys
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-1">
            <NavLink icon={<FaHome />} label="Home" path="/" />
            <NavLink icon={<FaUsers />} label="Members" path="/members" />
            <NavLink icon={<FaCalendar />} label="Events" path="/events" />
            <NavLink icon={<FaCog />} label="Settings" path="/settings" />
          </div>

          {/* User Profile & Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            <button className="hidden md:flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-300 border border-white/20 hover:border-white/40">
              <FaSignOutAlt />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-2xl"
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 space-y-2 pb-4 border-t border-white/20 pt-4">
            <MobileNavLink icon={<FaHome />} label="Home" path="/" />
            <MobileNavLink icon={<FaUsers />} label="Members" path="/members" />
            <MobileNavLink
              icon={<FaCalendar />}
              label="Events"
              path="/events"
            />
            <MobileNavLink icon={<FaCog />} label="Settings" path="/settings" />
            <button className="w-full flex items-center space-x-2 bg-red-500/30 hover:bg-red-500/50 px-4 py-2 rounded-lg transition-all duration-300 border border-red-500/50 text-red-200 mt-4">
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ icon, label, path }) {
  return (
    <Link
      to={path}
      className="flex items-center space-x-1 px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 border border-transparent hover:border-white/30"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function MobileNavLink({ icon, label, path }) {
  return (
    <Link
      to={path}
      className="flex items-center space-x-2 px-4 py-3 rounded-lg hover:bg-white/20 transition-all duration-300 border border-transparent hover:border-white/30"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default Navbar;
