import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./views/login.jsx";
import AdminDashboard from "./views/dashboard/AdminDashboard.jsx";
import HouseOwnerDashboard from "./views/dashboard/HouseOwnerDashboard.jsx";
import TenantDashboard from "./views/dashboard/TenantDashboard.jsx";
import UserDashboard from "./views/dashboard/UserDashboard.jsx";
import InfoPage from "./views/site/InfoPage.jsx";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("socsysUser");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ProtectedRoute({ allowedRoles, element }) {
  const user = getStoredUser();

  if (!user?.email || !user?.role) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return element;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              element={<AdminDashboard />}
            />
          }
        />
        <Route
          path="/dashboard/owner"
          element={
            <ProtectedRoute
              allowedRoles={["owner"]}
              element={<HouseOwnerDashboard />}
            />
          }
        />
        <Route
          path="/dashboard/tenant"
          element={
            <ProtectedRoute
              allowedRoles={["tenant"]}
              element={<TenantDashboard />}
            />
          }
        />
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute
              allowedRoles={["buyer"]}
              element={<UserDashboard />}
            />
          }
        />
        <Route path="/about" element={<InfoPage pageKey="about" />} />
        <Route path="/features" element={<InfoPage pageKey="features" />} />
        <Route path="/pricing" element={<InfoPage pageKey="pricing" />} />
        <Route path="/blog" element={<InfoPage pageKey="blog" />} />
        <Route
          path="/help-center"
          element={<InfoPage pageKey="help-center" />}
        />
        <Route
          path="/documentation"
          element={<InfoPage pageKey="documentation" />}
        />
        <Route
          path="/contact-support"
          element={<InfoPage pageKey="contact-support" />}
        />
        <Route path="/faqs" element={<InfoPage pageKey="faqs" />} />
        <Route path="/status" element={<InfoPage pageKey="status" />} />
        <Route
          path="/privacy-policy"
          element={<InfoPage pageKey="privacy-policy" />}
        />
        <Route
          path="/terms-of-service"
          element={<InfoPage pageKey="terms-of-service" />}
        />
        <Route
          path="/cookie-policy"
          element={<InfoPage pageKey="cookie-policy" />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
