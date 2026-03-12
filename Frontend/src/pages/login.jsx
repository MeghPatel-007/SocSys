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
  FaExclamationCircle,
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

// Mock user database with credentials
const mockUsers = [
  {
    username: "john_tenant",
    password: "Tenant@123",
    role: "tenant",
    fullName: "John Tenant",
  },
  {
    username: "sarah_owner",
    password: "Owner@456",
    role: "owner",
    fullName: "Sarah Johnson",
  },
  {
    username: "admin_user",
    password: "Admin@789",
    role: "admin",
    fullName: "Admin User",
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
  const [errors, setErrors] = useState({});

  // Validation functions
  const validateUsername = (username) => {
    if (!username.trim()) {
      return "Username is required";
    }
    if (username.trim().length < 3) {
      return "Username must be at least 3 characters long";
    }
    if (username.trim().length > 20) {
      return "Username must not exceed 20 characters";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return "Username can only contain letters, numbers, hyphens and underscores";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (password.length > 50) {
      return "Password must not exceed 50 characters";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailRegex) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) {
      return "Phone number is required";
    }
    if (!/^[0-9+\-\s()]{10,}$/.test(phone)) {
      return "Please enter a valid phone number";
    }
    return "";
  };

  const validateFullName = (fullName) => {
    if (!fullName.trim()) {
      return "Full name is required";
    }
    if (fullName.trim().length < 3) {
      return "Full name must be at least 3 characters long";
    }
    if (!/^[a-zA-Z\s'-]+$/.test(fullName)) {
      return "Full name can only contain letters, spaces, hyphens and apostrophes";
    }
    return "";
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return "";
  };

  const activeRole = useMemo(
    () =>
      roleOptions.find((role) => role.value === selectedRole) || roleOptions[0],
    [selectedRole],
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newErrors = {};

    // Validate username
    const usernameError = validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Validation for signup
    if (!isLogin) {
      const fullNameError = validateFullName(formData.fullName);
      if (fullNameError) newErrors.fullName = fullNameError;

      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;

      const phoneError = validatePhone(formData.phone);
      if (phoneError) newErrors.phone = phoneError;

      const confirmPasswordError = validateConfirmPassword(
        formData.password,
        formData.confirmPassword
      );
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // If login mode, authenticate against mock users
    if (isLogin) {
      const user = mockUsers.find(
        (u) => u.username === formData.username && u.password === formData.password
      );

      if (!user) {
        setErrors({
          username: "Invalid username or password",
          password: "Invalid username or password",
        });
        return;
      }

      // Check if selected role matches user's role
      if (user.role !== selectedRole) {
        setErrors({
          username: `This account is for ${user.role} role, but you selected ${selectedRole}`,
        });
        return;
      }

      // Authentication successful
      setErrors({});
      navigate(activeRole.route);
    } else {
      // Signup - just navigate after validation passes
      setErrors({});
      navigate(activeRole.route);
    }
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
                error={errors.fullName}
              />
            )}

            <InputRow
              icon={<FaUser />}
              name="username"
              value={formData.username}
              placeholder="Username"
              onChange={handleInputChange}
              error={errors.username}
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
                  error={errors.email}
                />
                <InputRow
                  icon={<FaPhone />}
                  name="phone"
                  value={formData.phone}
                  placeholder="Phone number"
                  onChange={handleInputChange}
                  error={errors.phone}
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
              error={errors.password}
            />

            {!isLogin && (
              <InputRow
                icon={<FaLock />}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                placeholder="Confirm password"
                onChange={handleInputChange}
                error={errors.confirmPassword}
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

          {isLogin && (
            <div className="auth-credentials">
              <p className="auth-credentials-title">Demo Credentials:</p>
              <div className="auth-credentials-list">
                {mockUsers.map((user) => (
                  <div key={user.username} className="auth-credential-item">
                    <div className="auth-credential-row">
                      <span className="auth-credential-label">Username:</span>
                      <span className="auth-credential-value">{user.username}</span>
                    </div>
                    <div className="auth-credential-row">
                      <span className="auth-credential-label">Password:</span>
                      <span className="auth-credential-value">{user.password}</span>
                    </div>
                    <div className="auth-credential-row">
                      <span className="auth-credential-label">Role:</span>
                      <span className="auth-credential-value auth-credential-role">
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function InputRow({ icon, type = "text", name, value, placeholder, onChange, error }) {
  return (
    <div className="input-wrapper">
      <label className={`input-row ${error ? "input-row--error" : ""}`}>
        <span>{icon}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </label>
      {error && (
        <div className="input-error" id={`${name}-error`}>
          <FaExclamationCircle />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default Login;
