import { useEffect, useState } from "react";
import {
  FaUser,
  FaTools,
  FaClipboard,
  FaEdit,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaHome,
  FaCheckCircle,
  FaClock,
  FaPlus,
} from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Navbar from "../../components/navbar";

function TenantDashboard() {
  const [activeTab, setActiveTab] = useState("profile");
  const [editProfile, setEditProfile] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [tenantId, setTenantId] = useState(null);
  const tabIds = ["profile", "maintenance", "complaints"];

  const TENANT_PROFILE_KEY = "tenantProfileData";
  const [tenantProfile, setTenantProfile] = useState(() => {
    try {
      const saved =
        typeof window !== "undefined" &&
        localStorage.getItem(TENANT_PROFILE_KEY);
      return saved
        ? JSON.parse(saved)
        : {
            name: "Alice Brown",
            email: "alice.brown@example.com",
            phone: "555-0201",
            house: "123 Main St",
            moveInDate: "2023-01-15",
            rentAmount: 25000,
            rentDueDate: "15th of every month",
            status: "Active",
            emergencyContact: "555-0299",
            occupation: "Software Engineer",
          };
    } catch {
      return {
        name: "Alice Brown",
        email: "alice.brown@example.com",
        phone: "555-0201",
        house: "123 Main St",
        moveInDate: "2023-01-15",
        rentAmount: 25000,
        rentDueDate: "15th of every month",
        status: "Active",
        emergencyContact: "555-0299",
        occupation: "Software Engineer",
      };
    }
  });
  const [profileForm, setProfileForm] = useState({});

  // Maintenance bills loaded from API
  const [maintenancePayments, setMaintenancePayments] = useState([]);
  const [isPaying, setIsPaying] = useState(false);

  // Complaints loaded from API
  const [complaints, setComplaints] = useState([]);
  const [toast, setToast] = useState({ text: "", type: "" });

  const [complaintForm, setComplaintForm] = useState({
    type: "Maintenance",
    description: "",
  });

  const getCurrentUserAuthHeaders = () => {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("socsysUser") || "{}",
      );
      const email = String(currentUser.linkedEmail || currentUser.email || "")
        .trim()
        .toLowerCase();
      const role = String(currentUser.role || "")
        .trim()
        .toLowerCase();
      return {
        ...(email ? { "x-user-email": email } : {}),
        ...(role ? { "x-user-role": role } : {}),
      };
    } catch {
      return {};
    }
  };

  useEffect(() => {
    if (!toast.text) {
      return;
    }

    const timer = setTimeout(() => {
      setToast({ text: "", type: "" });
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleSubmitComplaint = async () => {
    if (!complaintForm.description.trim()) return;
    try {
      const res = await fetch("/express/api/tenant/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complainant: tenantProfile.name,
          type: complaintForm.type,
          description: complaintForm.description,
          house: tenantProfile.house,
        }),
      });
      const data = await res.json();
      if (res.ok && data.complaint) {
        setComplaints((prev) => [data.complaint, ...prev]);
      }
    } catch {
      setComplaints((prev) => [
        {
          id: Date.now(),
          type: complaintForm.type,
          description: complaintForm.description,
          date: new Date().toISOString().split("T")[0],
          status: "Pending",
        },
        ...prev,
      ]);
    }
    setComplaintForm({ type: "Maintenance", description: "" });
    setShowComplaintForm(false);
    setToast({
      text: "Complaint submitted successfully. House owner has been notified.",
      type: "success",
    });
  };

  const handleReviewComplaint = async (complaint) => {
    if (!complaint?.id) {
      return;
    }

    if (String(complaint.status || "").toLowerCase() === "resolved") {
      setToast({
        text: `Complaint ${complaint.type}: ${complaint.description}`,
        type: "info",
      });
      return;
    }

    try {
      const response = await fetch(
        `/express/api/tenant/complaints/${complaint.id}/review`,
        {
          method: "PATCH",
          headers: {
            ...getCurrentUserAuthHeaders(),
          },
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Failed to review complaint");
      }

      if (payload.complaint) {
        setComplaints((prev) =>
          prev.map((item) =>
            item.id === complaint.id ? payload.complaint : item,
          ),
        );
      }

      setToast({ text: "Complaint marked as reviewed.", type: "success" });
    } catch (error) {
      setToast({
        text: error.message || "Failed to review complaint",
        type: "error",
      });
    }
  };

  const getStatusColor = (status) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    switch (normalized) {
      case "paid":
      case "active":
      case "resolved":
        return "bg-green-500/20 text-green-400";
      case "pending":
      case "in progress":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const isPaidStatus = (status) =>
    String(status || "")
      .trim()
      .toLowerCase() === "paid";

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const handleSaveProfile = async () => {
    if (!tenantId) {
      setToast({
        text: "Tenant profile is not linked to database yet. Reload and try again.",
        type: "error",
      });
      return;
    }

    const updated = {
      ...tenantProfile,
      ...profileForm,
    };

    try {
      const response = await fetch(`/express/api/tenant/profile/${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Failed to update profile");
      }

      setTenantProfile((prev) => ({
        ...prev,
        ...updated,
        name: payload.tenant?.name || updated.name,
        email: payload.tenant?.email || updated.email,
        phone: payload.tenant?.phone || updated.phone,
      }));
      setEditProfile(false);
    } catch (error) {
      setToast({
        text: error.message || "Failed to update profile",
        type: "error",
      });
    }
  };

  const handlePayNow = async () => {
    setIsPaying(true);

    try {
      // Fetch the latest bill state before selecting a pending bill.
      const latestRes = await fetch("/express/api/tenant/maintenance-bills");
      const latestPayload = await latestRes.json().catch(() => ({}));
      const latestBills =
        latestRes.ok && latestPayload.maintenanceBills
          ? latestPayload.maintenanceBills
          : maintenancePayments;

      setMaintenancePayments(latestBills);

      const pendingBill = latestBills.find(
        (payment) => !isPaidStatus(payment.status),
      );

      if (!pendingBill) {
        setToast({ text: "No pending maintenance bill found.", type: "info" });
        return;
      }

      const payRes = await fetch("/express/api/tenant/maintenance-bills/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: pendingBill.id,
          method: "Online",
        }),
      });
      const payPayload = await payRes.json().catch(() => ({}));
      if (!payRes.ok) {
        throw new Error(
          payPayload.error || payPayload.message || "Payment failed",
        );
      }

      // Keep UI consistent even if the refresh request fails.
      setMaintenancePayments((prev) =>
        prev.map((payment) =>
          payment.id === pendingBill.id
            ? {
                ...payment,
                status: "Paid",
                method: "Online",
                paidDate: new Date().toISOString().slice(0, 10),
              }
            : payment,
        ),
      );

      const billsRes = await fetch("/express/api/tenant/maintenance-bills");
      const billsPayload = await billsRes.json().catch(() => ({}));
      if (billsRes.ok && billsPayload.maintenanceBills) {
        setMaintenancePayments(billsPayload.maintenanceBills);
      }

      setToast({
        text: `Payment successful for bill #${pendingBill.id}.`,
        type: "success",
      });
    } catch (error) {
      if (/already paid/i.test(String(error.message || ""))) {
        try {
          const billsRes = await fetch("/express/api/tenant/maintenance-bills");
          const billsPayload = await billsRes.json().catch(() => ({}));
          if (billsRes.ok && billsPayload.maintenanceBills) {
            setMaintenancePayments(billsPayload.maintenanceBills);
          }
        } catch {
          // no-op: keep original alert if refresh also fails
        }
      }
      setToast({ text: error.message || "Payment failed", type: "error" });
    } finally {
      setIsPaying(false);
    }
  };

  const navbarLinks = [
    { label: "Profile", path: "/dashboard/tenant#profile" },
    { label: "Payments", path: "/dashboard/tenant#maintenance" },
    { label: "Complaints", path: "/dashboard/tenant#complaints" },
  ];

  useEffect(() => {
    const API = "/express";
    let active = true;

    const currentUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("socsysUser") || "{}");
      } catch {
        return {};
      }
    })();

    const tenantEmail = String(
      currentUser.linkedEmail || currentUser.email || "",
    ).trim();

    Promise.all([
      tenantEmail
        ? fetch(
            `${API}/api/tenant/profile?email=${encodeURIComponent(tenantEmail)}`,
          ).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        : Promise.resolve(null),
      fetch(`${API}/api/tenant/maintenance-bills`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status),
      ),
      fetch(`${API}/api/tenant/complaints`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status),
      ),
    ])
      .then(([profileData, billsData, complaintsData]) => {
        if (!active) {
          return;
        }

        if (profileData?.profile) {
          const nextProfile = {
            ...tenantProfile,
            ...profileData.profile,
            rentAmount: Number(profileData.profile.rentAmount || 0),
          };

          setTenantProfile(nextProfile);
          setTenantId(profileData.profile.id || null);

          try {
            localStorage.setItem(
              TENANT_PROFILE_KEY,
              JSON.stringify(nextProfile),
            );
          } catch {
            /* ignore */
          }
        }

        if (billsData.maintenanceBills)
          setMaintenancePayments(billsData.maintenanceBills);
        if (complaintsData.complaints) setComplaints(complaintsData.complaints);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const syncTabFromHash = () => {
      const hashTab = window.location.hash.replace("#", "");
      if (tabIds.includes(hashTab)) {
        setActiveTab(hashTab);
      }
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  return (
    <>
      <Navbar links={navbarLinks} sectionLabel="Tenant" />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="dashboard-page min-h-screen text-white"
      >
        {toast.text && (
          <div
            className={`fixed top-20 right-4 z-[70] max-w-sm px-4 py-3 rounded-lg border shadow-lg text-sm font-semibold ${
              toast.type === "success"
                ? "bg-green-500/20 text-green-300 border-green-500/40"
                : toast.type === "error"
                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                  : "bg-blue-500/20 text-blue-200 border-blue-500/40"
            }`}
          >
            {toast.text}
          </div>
        )}
        {/* Header */}
        <div className="dashboard-hero p-8 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <p className="dashboard-eyebrow">Resident Workspace</p>
            <div className="dashboard-hero-row">
              <div>
                <h1 className="text-4xl font-bold">Tenant Dashboard</h1>
                <p className="text-blue-100 mt-2">
                  Manage your tenancy and payments
                </p>
              </div>
              <div className="dashboard-kpis">
                <article className="dashboard-kpi">
                  <span>Monthly Rent</span>
                  <strong>₹{tenantProfile.rentAmount.toLocaleString()}</strong>
                </article>
                <article className="dashboard-kpi">
                  <span>Paid Records</span>
                  <strong>{maintenancePayments.length}</strong>
                </article>
                <article className="dashboard-kpi">
                  <span>Open Complaints</span>
                  <strong>
                    {
                      complaints.filter(
                        (complaint) => complaint.status !== "Resolved",
                      ).length
                    }
                  </strong>
                </article>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="dashboard-topnav sticky top-0 shadow-lg z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => handleTabChange("profile")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "profile"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUser /> <span>My Profile</span>
              </button>
              <button
                onClick={() => handleTabChange("maintenance")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "maintenance"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaTools /> <span>Maintenance Payments</span>
              </button>
              <button
                onClick={() => handleTabChange("complaints")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "complaints"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaClipboard /> <span>Complaints</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="dashboard-content max-w-7xl mx-auto px-6 py-8">
          {/* My Profile Tab */}
          {activeTab === "profile" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">My Profile</h2>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
                {!editProfile ? (
                  <>
                    {/* Profile Display */}
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-3xl font-bold mb-2">
                          {tenantProfile.name}
                        </h3>
                        <p className="text-gray-400">
                          Tenant • Resident since {tenantProfile.moveInDate}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setProfileForm({
                            name: tenantProfile.name,
                            email: tenantProfile.email,
                            phone: tenantProfile.phone,
                            occupation: tenantProfile.occupation,
                            emergencyContact: tenantProfile.emergencyContact,
                          });
                          setEditProfile(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center space-x-2"
                      >
                        <FaEdit /> <span>Edit Profile</span>
                      </button>
                    </div>

                    {/* Profile Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-gray-700">
                      {/* Personal Information */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-blue-400">
                          Personal Information
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">
                              Full Name
                            </p>
                            <p className="text-lg font-medium">
                              {tenantProfile.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">
                              Occupation
                            </p>
                            <p className="text-lg">
                              {tenantProfile.occupation}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Status</p>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(tenantProfile.status)}`}
                            >
                              {tenantProfile.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-blue-400">
                          Contact Information
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">
                              Email Address
                            </p>
                            <div className="flex items-center space-x-2">
                              <FaEnvelope className="text-blue-400" />
                              <p className="text-lg break-all">
                                {tenantProfile.email}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">
                              Phone Number
                            </p>
                            <div className="flex items-center space-x-2">
                              <FaPhone className="text-blue-400" />
                              <p className="text-lg">{tenantProfile.phone}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">
                              Emergency Contact
                            </p>
                            <p className="text-lg">
                              {tenantProfile.emergencyContact}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tenancy Details */}
                    <div className="pt-8">
                      <h4 className="text-lg font-semibold mb-4 text-blue-400">
                        Tenancy Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-2">
                            Property Address
                          </p>
                          <div className="flex items-center space-x-2">
                            <FaHome className="text-blue-400" />
                            <p className="text-lg font-medium">
                              {tenantProfile.house}
                            </p>
                          </div>
                        </div>
                        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-2">
                            Move-in Date
                          </p>
                          <p className="text-lg font-medium">
                            {tenantProfile.moveInDate}
                          </p>
                        </div>
                        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-2">
                            Monthly Rent
                          </p>
                          <p className="text-lg font-medium text-green-400">
                            ₹{tenantProfile.rentAmount.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-2">
                            Rent Due Date
                          </p>
                          <p className="text-lg font-medium">
                            {tenantProfile.rentDueDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Edit Profile Form */}
                    <div className="max-w-2xl">
                      <h3 className="text-2xl font-bold mb-6">Edit Profile</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.name ?? ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                name: e.target.value,
                              })
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={profileForm.email ?? ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                email: e.target.value,
                              })
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={profileForm.phone ?? ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                phone: e.target.value,
                              })
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Occupation
                          </label>
                          <input
                            type="text"
                            value={profileForm.occupation ?? ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                occupation: e.target.value,
                              })
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Emergency Contact
                          </label>
                          <input
                            type="tel"
                            value={profileForm.emergencyContact ?? ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                emergencyContact: e.target.value,
                              })
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex space-x-4 pt-4">
                          <button
                            onClick={handleSaveProfile}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditProfile(false)}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Maintenance Payments Tab */}
          {activeTab === "maintenance" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Maintenance Payments</h2>

              {/* Payment Summary */}
              {(() => {
                const totalAmt = maintenancePayments.reduce(
                  (s, p) => s + (Number(p.amount) || 0),
                  0,
                );
                const paidCount = maintenancePayments.filter((p) =>
                  isPaidStatus(p.status),
                ).length;
                const pendingCount = maintenancePayments.length - paidCount;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                      <p className="text-gray-400 text-sm mb-2">Total Bills</p>
                      <p className="text-3xl font-bold text-green-400">
                        ₹{totalAmt.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {maintenancePayments.length} record(s)
                      </p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                      <p className="text-gray-400 text-sm mb-2">Paid</p>
                      <p className="text-3xl font-bold text-blue-400">
                        {paidCount}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">bills paid</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                      <p className="text-gray-400 text-sm mb-2">Pending</p>
                      <p
                        className={`text-3xl font-bold ${
                          pendingCount > 0
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {pendingCount}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {pendingCount > 0 ? "bills pending" : "All clear!"}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Payment History Table */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h3 className="text-xl font-semibold">Payment History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-900">
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Month
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Due Date
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Paid Date
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Payment Method
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenancePayments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-gray-700 hover:bg-gray-900/50 transition"
                        >
                          <td className="px-6 py-4 font-medium">
                            {payment.month}
                          </td>
                          <td className="px-6 py-4 text-green-400 font-semibold">
                            ₹{payment.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {payment.dueDate}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center w-fit ${getStatusColor(payment.status)}`}
                            >
                              {isPaidStatus(payment.status) ? (
                                <>
                                  <FaCheckCircle className="mr-2" />{" "}
                                  {payment.status}
                                </>
                              ) : (
                                <>
                                  <FaClock className="mr-2" /> {payment.status}
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {payment.paidDate}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                              {payment.method}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pay Now Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handlePayNow}
                  disabled={isPaying}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition text-lg"
                >
                  {isPaying ? "Processing payment..." : "Pay Now"}
                </button>
              </div>
            </div>
          )}

          {/* Complaints Tab */}
          {activeTab === "complaints" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Complaints</h2>
                <button
                  onClick={() => setShowComplaintForm(!showComplaintForm)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center space-x-2"
                >
                  <FaPlus /> <span>File Complaint</span>
                </button>
              </div>

              {/* Complaint Form */}
              {showComplaintForm && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-semibold mb-6">
                    Submit New Complaint
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Complaint Type
                      </label>
                      <select
                        value={complaintForm.type}
                        onChange={(e) =>
                          setComplaintForm({
                            ...complaintForm,
                            type: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option>Maintenance</option>
                        <option>Plumbing</option>
                        <option>Electrical</option>
                        <option>Noise</option>
                        <option>Utilities</option>
                        <option>Parking</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Description
                      </label>
                      <textarea
                        value={complaintForm.description}
                        onChange={(e) =>
                          setComplaintForm({
                            ...complaintForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Please describe your complaint in detail..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-32 resize-none"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleSubmitComplaint}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
                      >
                        Submit Complaint
                      </button>
                      <button
                        onClick={() => setShowComplaintForm(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Complaints List */}
              <div className="space-y-4">
                {complaints.length > 0 ? (
                  complaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              {complaint.type}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}
                            >
                              {complaint.status}
                            </span>
                          </div>
                          <p className="text-lg font-semibold mb-2">
                            {complaint.description}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Submitted: {complaint.date}
                          </p>
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => handleReviewComplaint(complaint)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                            >
                              {String(complaint.status || "").toLowerCase() ===
                              "resolved"
                                ? "View"
                                : "Review"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FaClipboard className="text-6xl text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No complaints filed yet</p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-2 text-blue-400">
                  How Complaints Work
                </h4>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>
                    ✓ Submit complaints about maintenance, utilities, or any
                    facility issues
                  </li>
                  <li>
                    ✓ Your house owner will be notified immediately in their
                    dashboard
                  </li>
                  <li>✓ Track the status of your complaints in real-time</li>
                  <li>✓ Complaints are prioritized based on urgency</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

export default TenantDashboard;
