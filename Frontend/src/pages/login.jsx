import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBuilding,
  FaEnvelope,
  FaHome,
  FaKey,
  FaLock,
  FaPhone,
  FaShieldAlt,
  FaUser,
  FaUsers,
  FaUsersCog,
} from "react-icons/fa";

const roleOptions = [
  {
    value: "tenant",
    label: "Tenant",
    description: "Track rent, maintenance and complaints",
    route: "/dashboard/tenant",
    icon: FaKey,
  },
  {
    value: "owner",
    label: "House Owner",
    description: "Manage properties, tenants and notifications",
    route: "/dashboard/owner",
    icon: FaHome,
  },
  {
    value: "admin",
    label: "Admin",
    description: "Run operations across the full society",
    route: "/dashboard/admin",
    icon: FaUsersCog,
  },
  {
    value: "buyer",
    label: "Buyer / Renter",
    description: "Browse listings and submit offers",
    route: "/dashboard/user",
    icon: FaBuilding,
  },
];

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState("tenant");
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const activeRole = useMemo(
    () =>
      roleOptions.find((role) => role.value === selectedRole) || roleOptions[0],
    [selectedRole],
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate(activeRole.route);
  };

  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb--one" aria-hidden="true" />
      <div className="auth-orb auth-orb--two" aria-hidden="true" />

      <section className="auth-grid">
        <div className="auth-showcase">
          <p className="auth-kicker">SocSys Platform</p>
          <h1 className="auth-title">Society management, finally organized.</h1>
          <p className="auth-description">
            Coordinate residents, owners, finance and service requests from one
            clean command center.
          </p>

          <div className="auth-stats">
            <article>
              <p className="auth-stat-number">120+</p>
              <p className="auth-stat-label">Properties under management</p>
            </article>
            <article>
              <p className="auth-stat-number">98%</p>
              <p className="auth-stat-label">On-time payment visibility</p>
            </article>
            <article>
              <p className="auth-stat-number">24/7</p>
              <p className="auth-stat-label">Complaint workflow tracking</p>
            </article>
          </div>

          <div className="auth-points">
            <p>
              <FaShieldAlt /> Secure role-based dashboards
            </p>
            <p>
              <FaUsers /> Resident and owner lifecycle records
            </p>
            <p>
              <FaBuilding /> Listings, rent offers and buy offers in one flow
            </p>
          </div>
        </div>

        <div className="auth-card">
          <header className="auth-card-header">
            <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
            <p>
              {isLogin
                ? "Sign in and jump to your dashboard."
                : "Sign up once, then pick a role to continue."}
            </p>
          </header>

          <div
            className="auth-toggle"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              className={isLogin ? "active" : ""}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              type="button"
              className={!isLogin ? "active" : ""}
              onClick={() => setIsLogin(false)}
            >
              Signup
            </button>
          </div>

          <div className="role-selector">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              const isActive = role.value === selectedRole;

              return (
                <button
                  key={role.value}
                  type="button"
                  className={isActive ? "active" : ""}
                  onClick={() => setSelectedRole(role.value)}
                >
                  <span className="role-icon">
                    <Icon />
                  </span>
                  <span>
                    <strong>{role.label}</strong>
                    <small>{role.description}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <InputRow
                icon={<FaUser />}
                name="fullName"
                value={formData.fullName}
                placeholder="Full name"
                onChange={handleInputChange}
              />
            )}

            <InputRow
              icon={<FaUser />}
              name="username"
              value={formData.username}
              placeholder="Username"
              onChange={handleInputChange}
            />

            {!isLogin && (
              <>
                <InputRow
                  icon={<FaEnvelope />}
                  type="email"
                  name="email"
                  value={formData.email}
                  placeholder="Email address"
                  onChange={handleInputChange}
                />
                <InputRow
                  icon={<FaPhone />}
                  name="phone"
                  value={formData.phone}
                  placeholder="Phone number"
                  onChange={handleInputChange}
                />
              </>
            )}

            <InputRow
              icon={<FaLock />}
              type="password"
              name="password"
              value={formData.password}
              placeholder="Password"
              onChange={handleInputChange}
            />

            {!isLogin && (
              <InputRow
                icon={<FaLock />}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                placeholder="Confirm password"
                onChange={handleInputChange}
              />
            )}

            <button type="submit" className="auth-submit">
              <span>
                {isLogin
                  ? "Continue to dashboard"
                  : "Create account and continue"}
              </span>
              <FaArrowRight />
            </button>
          </form>

          <p className="auth-note">
            Selected role: <strong>{activeRole.label}</strong>
          </p>
        </div>
      </section>
    </main>
  );
}

function InputRow({ icon, type = "text", name, value, placeholder, onChange }) {
  return (
    <label className="input-row">
      <span>{icon}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
      />
    </label>
  );
}

export default Login;
