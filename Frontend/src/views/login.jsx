import { useEffect, useMemo, useState } from "react";
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
import { AnimatePresence, motion } from "framer-motion";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

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
  const [selectedRole, setSelectedRole] = useState("buyer");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [isSupabaseAuthLoading, setIsSupabaseAuthLoading] = useState(false);
  const [googleAuthMessage, setGoogleAuthMessage] = useState("");
  const [googleAuthMessageType, setGoogleAuthMessageType] = useState("info");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isPersonalAuthLoading, setIsPersonalAuthLoading] = useState(false);
  const [personalAuthMessage, setPersonalAuthMessage] = useState("");
  const [personalAuthType, setPersonalAuthType] = useState("info");
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
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

  const authLoading = isSupabaseAuthLoading;
  const GOOGLE_DEFAULT_ROLE = "buyer";
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: "easeOut" },
  };

  const getRouteForRole = (roleValue) => {
    const role = roleOptions.find((item) => item.value === roleValue);
    return role?.route || roleOptions[0].route;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isLogin) {
      handlePersonalLogin();
      return;
    }

    if (selectedRole === "buyer") {
      handleCreatePersonalAccount();
      return;
    }

    setPersonalMessage(
      "error",
      "Signup for this role is provided by society admin.",
    );
  };

  const setPersonalMessage = (type, message) => {
    setPersonalAuthType(type);
    setPersonalAuthMessage(message);
  };

  const authorizeRoleWithBackend = async ({ email, role }) => {
    const response = await fetch("/express/api/auth/authorize-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, role }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload.message || "You are not authorized for this role.",
      );
    }

    return payload;
  };

  const handlePersonalLogin = async () => {
    setIsPersonalAuthLoading(true);
    setPersonalMessage("info", "");

    try {
      const email = formData.username.trim();
      const password = formData.password;

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const response = await fetch("/express/api/auth/personal-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Login failed");
      }

      localStorage.setItem("socsysUser", JSON.stringify(payload.user));
      setPersonalMessage("success", "Login successful. Redirecting...");
      navigate(getRouteForRole(payload.user.role));
    } catch (error) {
      setPersonalMessage("error", error.message || "Login failed");
    } finally {
      setIsPersonalAuthLoading(false);
    }
  };

  const handleCreatePersonalAccount = async () => {
    setIsPersonalAuthLoading(true);
    setPersonalMessage("info", "");

    try {
      const role = selectedRole;

      if (role !== "buyer") {
        throw new Error("Self signup is available only for Buyer / Renter");
      }

      const linkedEmail = formData.email.trim();
      const phone = formData.phone.trim();
      const fullName = formData.fullName.trim();
      const password = formData.password;
      const confirmPassword = formData.confirmPassword;

      if (!linkedEmail || !password || !confirmPassword) {
        throw new Error("Email, password and confirm password are required");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const response = await fetch(
        "/express/api/auth/personal-account/register-self",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            linkedEmail,
            googleEmail: linkedEmail,
            role,
            fullName,
            phone,
            password,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to create personal account");
      }

      setPersonalMessage(
        "success",
        `Account created. Login with: ${payload.personalEmail}`,
      );

      setFormData((prev) => ({
        ...prev,
        username: payload.personalEmail || "",
        password: "",
        confirmPassword: "",
      }));

      setIsLogin(true);
    } catch (error) {
      setPersonalMessage(
        "error",
        error.message || "Failed to create personal account",
      );
    } finally {
      setIsPersonalAuthLoading(false);
    }
  };

  const requestForgotOtp = async () => {
    setIsPersonalAuthLoading(true);
    setPersonalMessage("info", "");

    try {
      const identifier = forgotIdentifier.trim();
      if (!identifier) {
        throw new Error("Registered email is required");
      }

      const response = await fetch(
        "/express/api/auth/forgot-password/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ identifier }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to request OTP");
      }

      setOtpRequested(true);
      const otpDebug = payload.devOtp ? ` (DEV OTP: ${payload.devOtp})` : "";
      setPersonalMessage(
        "success",
        `OTP generated and sent to registered phone/email.${otpDebug}`,
      );
    } catch (error) {
      setPersonalMessage("error", error.message || "Failed to request OTP");
    } finally {
      setIsPersonalAuthLoading(false);
    }
  };

  const verifyForgotOtp = async () => {
    setIsPersonalAuthLoading(true);
    setPersonalMessage("info", "");

    try {
      if (!forgotIdentifier.trim() || !forgotOtp.trim() || !forgotNewPassword) {
        throw new Error("Email, OTP and new password are required");
      }

      const response = await fetch("/express/api/auth/forgot-password/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to reset password");
      }

      setPersonalMessage("success", "Password reset successful. Login now.");
      setIsLogin(true);
      setShowForgotPassword(false);
      setOtpRequested(false);
      setForgotOtp("");
      setForgotNewPassword("");
    } catch (error) {
      setPersonalMessage("error", error.message || "Failed to reset password");
    } finally {
      setIsPersonalAuthLoading(false);
    }
  };

  const startSupabaseGoogleSignIn = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setGoogleAuthMessageType("warn");
      setGoogleAuthMessage("Supabase authentication is not configured.");
      return;
    }

    setIsSupabaseAuthLoading(true);
    setGoogleAuthMessage("");

    try {
      localStorage.setItem("socsysSelectedRole", GOOGLE_DEFAULT_ROLE);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard/user`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setIsSupabaseAuthLoading(false);
      setGoogleAuthMessageType("error");
      setGoogleAuthMessage(
        error.message || "Unable to start Google sign-in with Supabase.",
      );
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    let active = true;

    const completeSupabaseSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (error) {
        setGoogleAuthMessageType("error");
        setGoogleAuthMessage(
          error.message || "Supabase authentication failed.",
        );
        setIsSupabaseAuthLoading(false);
        return;
      }

      const session = data?.session;

      if (!session?.user) {
        setIsSupabaseAuthLoading(false);
        return;
      }

      const storedRole = localStorage.getItem("socsysSelectedRole");
      const roleValue = roleOptions.some((role) => role.value === storedRole)
        ? storedRole
        : GOOGLE_DEFAULT_ROLE;

      const email = session.user.email || "";

      if (!email) {
        setGoogleAuthMessageType("error");
        setGoogleAuthMessage("Unable to read email from Google account.");
        setIsSupabaseAuthLoading(false);
        return;
      }

      const authorization = await authorizeRoleWithBackend({
        email,
        role: roleValue,
      });

      localStorage.removeItem("socsysSelectedRole");

      localStorage.setItem(
        "socsysUser",
        JSON.stringify({
          id: session.user.id,
          provider: "supabase",
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User",
          email: session.user.email || "",
          picture: session.user.user_metadata?.avatar_url || null,
          role: authorization.role,
          allowedRoles: authorization.allowedRoles || [],
        }),
      );

      setGoogleAuthMessageType("success");
      setGoogleAuthMessage("Google authentication successful. Redirecting...");
      setIsSupabaseAuthLoading(false);
      navigate(getRouteForRole(authorization.role));
    };

    completeSupabaseSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (!active || (event !== "SIGNED_IN" && event !== "INITIAL_SESSION")) {
        return;
      }

      completeSupabaseSession();
    });

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const baseUrl = "/express";

    fetch(`${baseUrl}/api/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend unavailable");
        }
        return response.json();
      })
      .then((data) => {
        if (active) {
          setBackendStatus("connected");

          if (isSupabaseConfigured) {
            setGoogleAuthMessage("");
          } else {
            setGoogleAuthMessageType("warn");
            setGoogleAuthMessage("Supabase authentication is not configured.");
          }
        }
      })
      .catch(() => {
        if (active) {
          setBackendStatus("offline");
          setGoogleAuthMessageType("warn");
          setGoogleAuthMessage(
            "Backend is offline. Google sign-in is unavailable.",
          );
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setShowForgotPassword(false);
  }, [selectedRole, isLogin]);

  return (
    <motion.main
      className="auth-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="auth-orb auth-orb--one" aria-hidden="true" />
      <div className="auth-orb auth-orb--two" aria-hidden="true" />

      <section className="auth-grid">
        <motion.div className="auth-showcase" {...fadeInUp}>
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
        </motion.div>

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
        >
          <header className="auth-card-header">
            <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
            <p>
              {selectedRole === "buyer"
                ? isLogin
                  ? "Buyer and renter can login with Google or email-password."
                  : "Buyer and renter can sign up with email-password or Google."
                : isLogin
                  ? "Sign in with your personal @socsys.com account."
                  : "Use the personal credentials provided by the society admin."}
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
              onClick={() => {
                if (selectedRole === "buyer") {
                  setIsLogin(false);
                }
              }}
              disabled={selectedRole !== "buyer"}
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
                  onClick={() => {
                    setSelectedRole(role.value);
                    if (role.value !== "buyer") {
                      setIsLogin(true);
                    }
                  }}
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
            {selectedRole === "buyer" && !isLogin && (
              <InputRow
                icon={<FaUser />}
                name="fullName"
                value={formData.fullName}
                placeholder="Full name"
                onChange={handleInputChange}
              />
            )}

            {(selectedRole !== "buyer" || isLogin) && (
              <InputRow
                icon={<FaUser />}
                name="username"
                value={formData.username}
                placeholder={
                  isLogin ? "Email" : "Will be auto-filled after setup"
                }
                onChange={handleInputChange}
              />
            )}

            {selectedRole === "buyer" && !isLogin && (
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

            {(selectedRole !== "buyer" || isLogin) && (
              <InputRow
                icon={<FaLock />}
                type="password"
                name="password"
                value={formData.password}
                placeholder="Password"
                onChange={handleInputChange}
              />
            )}

            {selectedRole === "buyer" && !isLogin && (
              <>
                <InputRow
                  icon={<FaLock />}
                  type="password"
                  name="password"
                  value={formData.password}
                  placeholder="Password"
                  onChange={handleInputChange}
                />
                <InputRow
                  icon={<FaLock />}
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  placeholder="Confirm password"
                  onChange={handleInputChange}
                />
              </>
            )}

            {(selectedRole !== "buyer" || isLogin || !isLogin) && (
              <button
                type="submit"
                className="auth-submit"
                disabled={isPersonalAuthLoading}
              >
                <span>
                  {selectedRole === "buyer"
                    ? isLogin
                      ? "Login with email and password"
                      : "Sign up with email and password"
                    : "Login with personal account"}
                </span>
                <FaArrowRight />
              </button>
            )}
          </form>

          {selectedRole === "buyer" && (
            <button
              type="button"
              className="auth-submit"
              onClick={startSupabaseGoogleSignIn}
              disabled={authLoading}
            >
              <span>
                {isLogin ? "Login with Google" : "Sign up with Google"}
              </span>
              <FaArrowRight />
            </button>
          )}

          {selectedRole === "buyer" && googleAuthMessage && (
            <p
              className={`auth-message auth-message--${googleAuthMessageType}`}
            >
              {googleAuthMessage}
            </p>
          )}

          {isLogin && (
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword((prev) => !prev);
                setOtpRequested(false);
                setForgotOtp("");
                setForgotNewPassword("");
                setPersonalMessage("info", "");
              }}
              className="auth-link"
            >
              {showForgotPassword ? "Back to login" : "Forgot password?"}
            </button>
          )}

          <AnimatePresence mode="wait">
            {showForgotPassword && (
              <motion.div
                key="forgot-panel"
                className="google-auth-wrap"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <InputRow
                  icon={<FaEnvelope />}
                  type="email"
                  name="forgotIdentifier"
                  value={forgotIdentifier}
                  placeholder="Registered email"
                  onChange={(event) => setForgotIdentifier(event.target.value)}
                />

                <button
                  type="button"
                  className="auth-submit"
                  onClick={requestForgotOtp}
                  disabled={isPersonalAuthLoading}
                >
                  <span>Request OTP</span>
                  <FaArrowRight />
                </button>

                {otpRequested && (
                  <>
                    <InputRow
                      icon={<FaKey />}
                      name="forgotOtp"
                      value={forgotOtp}
                      placeholder="Enter OTP"
                      onChange={(event) => setForgotOtp(event.target.value)}
                    />
                    <InputRow
                      icon={<FaLock />}
                      type="password"
                      name="forgotNewPassword"
                      value={forgotNewPassword}
                      placeholder="New password"
                      onChange={(event) =>
                        setForgotNewPassword(event.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="auth-submit"
                      onClick={verifyForgotOtp}
                      disabled={isPersonalAuthLoading}
                    >
                      <span>Verify OTP & Reset</span>
                      <FaArrowRight />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {personalAuthMessage && (
              <motion.p
                key="personal-auth-message"
                className={`auth-message auth-message--${personalAuthType}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {personalAuthMessage}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="auth-note">
            Selected role: <strong>{activeRole.label}</strong>
          </p>
          <p className={`backend-status backend-status--${backendStatus}`}>
            Backend: {backendStatus}
          </p>
        </motion.div>
      </section>
    </motion.main>
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
