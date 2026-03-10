import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/login.jsx";
import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";
import HouseOwnerDashboard from "./pages/dashboard/HouseOwnerDashboard.jsx";
import TenantDashboard from "./pages/dashboard/TenantDashboard.jsx";
import UserDashboard from "./pages/dashboard/UserDashboard.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/owner" element={<HouseOwnerDashboard />} />
        <Route path="/dashboard/tenant" element={<TenantDashboard />} />
        <Route path="/dashboard/user" element={<UserDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
