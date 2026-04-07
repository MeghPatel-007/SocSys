import { useState, useEffect, useRef } from "react";
import {
  FaHome,
  FaUsers,
  FaBell,
  FaUser,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEdit,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCamera,
  FaImage,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Footer from "../../components/footer";
import Navbar from "../../components/navbar";

function HouseOwnerDashboard() {
  const [activeTab, setActiveTab] = useState("houses");
  const [editProfile, setEditProfile] = useState(false);
  const [ownerId, setOwnerId] = useState(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const tabIds = [
    "houses",
    "tenants",
    "notifications",
    "rent",
    "sell",
    "profile",
  ];

  const [salePhotos, setSalePhotos] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [saleForm, setSaleForm] = useState({
    title: "",
    address: "",
    bhk: "2BHK",
    area: "",
    price: "",
    description: "",
  });

  // Refresh notifications from API when notifications tab is opened
  useEffect(() => {
    if (activeTab !== "notifications") return;

    fetch("/express/api/owner/notifications")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      })
      .catch(() => {});
  }, [activeTab]);

  const OWNER_PROFILE_KEY = "ownerProfileData";
  const [ownerProfile, setOwnerProfile] = useState(() => {
    try {
      const saved =
        typeof window !== "undefined" &&
        localStorage.getItem(OWNER_PROFILE_KEY);
      return saved
        ? JSON.parse(saved)
        : {
            name: "John Doe",
            email: "john.doe@example.com",
            phone: "555-0101",
            address: "123 Main St, City",
            totalProperties: 3,
            joinDate: "2020-05-15",
            bankAccount: "XXXX XXXX XXXX 1234",
          };
    } catch {
      return {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "555-0101",
        address: "123 Main St, City",
        totalProperties: 3,
        joinDate: "2020-05-15",
        bankAccount: "XXXX XXXX XXXX 1234",
      };
    }
  });
  const [profileForm, setProfileForm] = useState({});

  // Houses loaded from API
  const [myHouses, setMyHouses] = useState([]);

  // Tenants loaded from API
  const [myTenants, setMyTenants] = useState([]);

  const [notifications, setNotifications] = useState([]);

  // Rent payments loaded from API
  const [rentPayments, setRentPayments] = useState([]);

  const [ownerActionMsg, setOwnerActionMsg] = useState("");
  const [toast, setToast] = useState({ text: "", type: "" });

  const INITIAL_HOUSE_FORM = {
    address: "",
    block: "",
    type: "",
    status: "Vacant",
  };
  const INITIAL_TENANT_FORM = {
    name: "",
    email: "",
    contact: "",
    idProof: "",
    houseId: "",
    rentAmount: "",
    startDate: "",
  };
  const [showAddHouseForm, setShowAddHouseForm] = useState(false);
  const [addHouseForm, setAddHouseForm] = useState(INITIAL_HOUSE_FORM);
  const [showAddTenantForm, setShowAddTenantForm] = useState(false);
  const [addTenantForm, setAddTenantForm] = useState(INITIAL_TENANT_FORM);

  const getStatusColor = (status) => {
    switch (status) {
      case "Rented":
      case "Paid":
      case "Active":
      case "Viewed":
        return "bg-green-500/20 text-green-400";
      case "Pending":
      case "New":
        return "bg-yellow-500/20 text-yellow-400";
      case "Vacant":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const filesToDataUrls = (files) =>
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Failed to read image"));
            reader.readAsDataURL(file);
          }),
      ),
    );

  const appendFilesAsPhotos = async (fileList) => {
    const files = Array.from(fileList || []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (!files.length) {
      return;
    }

    try {
      const urls = await filesToDataUrls(files);
      setSalePhotos((prev) => [...prev, ...urls].slice(0, 6));
    } catch {
      setToast({ text: "Unable to load selected image.", type: "error" });
    }
  };

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

  const handleGallerySelection = async (event) => {
    await appendFilesAsPhotos(event.target.files);
    event.target.value = "";
  };

  const handleCameraSelection = async (event) => {
    await appendFilesAsPhotos(event.target.files);
    event.target.value = "";
  };

  const removePhotoAt = (index) => {
    setSalePhotos((prev) =>
      prev.filter((_, photoIndex) => photoIndex !== index),
    );
  };

  const handleSaleFormChange = (field, value) => {
    setSaleForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetSaleForm = () => {
    setSaleForm({
      title: "",
      address: "",
      bhk: "2BHK",
      area: "",
      price: "",
      description: "",
    });
    setSalePhotos([]);
  };

  const handleCreateSaleListing = async () => {
    if (
      !saleForm.title ||
      !saleForm.address ||
      !saleForm.area ||
      !saleForm.price
    ) {
      setToast({
        text: "Please fill all required fields for your property listing.",
        type: "error",
      });
      return;
    }

    if (!salePhotos.length) {
      setToast({
        text: "Add at least one real property photo before publishing.",
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch("/express/api/owner/sale-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: saleForm.title.trim(),
          address: saleForm.address.trim(),
          bhk: saleForm.bhk,
          area: Number(saleForm.area),
          price: Number(saleForm.price),
          owner: ownerProfile.name,
          phone: ownerProfile.phone,
          email: ownerProfile.email,
          description: saleForm.description.trim(),
          image: salePhotos[0],
          images: salePhotos,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Failed to publish property");
      }

      if (payload.listing) {
        setSaleListings((prev) => [payload.listing, ...prev]);
      }

      resetSaleForm();
      setToast({
        text: "Property published for sale successfully.",
        type: "success",
      });
    } catch (error) {
      setToast({
        text: error.message || "Failed to publish property",
        type: "error",
      });
    }
  };

  const handleDeleteSaleListing = async (listingId) => {
    try {
      const response = await fetch(
        `/express/api/owner/sale-listings/${listingId}`,
        {
          method: "DELETE",
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Failed to delete property");
      }

      setSaleListings((prev) =>
        prev.filter((listing) => listing.id !== listingId),
      );
    } catch (error) {
      setToast({
        text: error.message || "Failed to delete property",
        type: "error",
      });
    }
  };

  const flash = (msg) => {
    setOwnerActionMsg(msg);
    setTimeout(() => setOwnerActionMsg(""), 4000);
  };

  const handleAddHouse = async () => {
    if (!addHouseForm.address || !addHouseForm.block) {
      flash("❌ Address and Block are required");
      return;
    }
    try {
      const res = await fetch("/express/api/admin/houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: addHouseForm.address,
          block: addHouseForm.block,
          type: addHouseForm.type,
          status: addHouseForm.status,
        }),
      });
      const data = await res.json();
      if (res.ok && data.house) {
        setMyHouses((prev) => [data.house, ...prev]);
        setAddHouseForm(INITIAL_HOUSE_FORM);
        setShowAddHouseForm(false);
        flash("✅ House added successfully");
      } else {
        flash(`❌ ${data.message || "Failed to add house"}`);
      }
    } catch {
      flash("❌ Network error — could not reach server");
    }
  };

  const handleAddTenant = async () => {
    const { name, email, idProof } = addTenantForm;
    if (!name || !email || !idProof) {
      flash("❌ Name, Email and ID Proof are required");
      return;
    }
    try {
      const res = await fetch("/express/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addTenantForm),
      });
      const data = await res.json();
      if (res.ok && data.tenant) {
        setMyTenants((prev) => [data.tenant, ...prev]);
        setAddTenantForm(INITIAL_TENANT_FORM);
        setShowAddTenantForm(false);
        flash("✅ Tenant added successfully");
      } else {
        flash(`❌ ${data.message || "Failed to add tenant"}`);
      }
    } catch {
      flash("❌ Network error — could not reach server");
    }
  };

  const handleSaveProfile = async () => {
    const updated = { ...ownerProfile, ...profileForm };
    try {
      if (!ownerId) {
        throw new Error(
          "Owner profile is not linked to database yet. Reload and try again.",
        );
      }

      const response = await fetch(`/express/api/owner/profile/${ownerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          address: updated.address,
          bankAccount: updated.bankAccount,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Failed to update owner profile");
      }

      if (payload.owner) {
        setOwnerProfile((prev) => ({
          ...prev,
          ...payload.owner,
          bankAccount: updated.bankAccount,
          joinDate: prev.joinDate,
        }));
      }
    } catch (error) {
      setToast({
        text: error.message || "Failed to update owner profile",
        type: "error",
      });
      return;
    }

    setEditProfile(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const handleReviewNotification = async (notification) => {
    if (!notification?.id) {
      return;
    }

    if (notification.status !== "New") {
      setToast({
        text: `From ${notification.from}: ${notification.message}`,
        type: "info",
      });
      return;
    }

    try {
      const response = await fetch("/express/api/owner/notifications/review", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getCurrentUserAuthHeaders(),
        },
        body: JSON.stringify({ id: notification.id }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Failed to review notification");
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                status: "Viewed",
              }
            : item,
        ),
      );
      flash("✅ Notification reviewed");
    } catch (error) {
      flash(`❌ ${error.message || "Failed to review notification"}`);
    }
  };

  const navbarLinks = [
    { label: "Houses", path: "/dashboard/owner#houses" },
    { label: "Tenants", path: "/dashboard/owner#tenants" },
    { label: "Alerts", path: "/dashboard/owner#notifications" },
    { label: "Rent", path: "/dashboard/owner#rent" },
    { label: "Sell", path: "/dashboard/owner#sell" },
    { label: "Profile", path: "/dashboard/owner#profile" },
  ];

  useEffect(() => {
    const API = "/express";
    Promise.all([
      fetch(`${API}/api/owner/houses`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status),
      ),
      fetch(`${API}/api/owner/tenants`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status),
      ),
      fetch(`${API}/api/owner/rent-payments`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status),
      ),
      fetch(`${API}/api/owner/sale-listings`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status),
      ),
      fetch(`${API}/api/owner/notifications`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status),
      ),
    ])
      .then(
        ([
          housesData,
          tenantsData,
          paymentsData,
          saleListingsData,
          notificationsData,
        ]) => {
          if (housesData.houses) setMyHouses(housesData.houses);
          if (tenantsData.tenants) setMyTenants(tenantsData.tenants);
          if (paymentsData.rentPayments)
            setRentPayments(paymentsData.rentPayments);
          if (saleListingsData.listings)
            setSaleListings(saleListingsData.listings);
          if (notificationsData.notifications)
            setNotifications(notificationsData.notifications);
        },
      )
      .catch(() => {});

    const currentUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("socsysUser") || "{}");
      } catch {
        return {};
      }
    })();

    const ownerEmail = String(
      currentUser.linkedEmail || currentUser.email || "",
    ).trim();
    if (ownerEmail) {
      fetch(`${API}/api/owner/profile?email=${encodeURIComponent(ownerEmail)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((data) => {
          if (data?.profile) {
            setOwnerId(data.profile.id || null);
            setOwnerProfile((prev) => ({
              ...prev,
              ...data.profile,
              joinDate: prev.joinDate,
              bankAccount: prev.bankAccount,
            }));
          }
        })
        .catch(() => {});
    }
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

  // Count new notifications
  const newNotificationCount = notifications.filter(
    (n) => n.status === "New",
  ).length;
  return (
    <>
      <Navbar links={navbarLinks} sectionLabel="Owner" />
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
            <p className="dashboard-eyebrow">Owner Control Center</p>
            <div className="dashboard-hero-row">
              <div>
                <h1 className="text-4xl font-bold">House Owner Dashboard</h1>
                <p className="text-blue-100 mt-2">
                  Manage your properties and tenants
                </p>
              </div>
              <div className="dashboard-kpis">
                <article className="dashboard-kpi">
                  <span>My Properties</span>
                  <strong>{myHouses.length}</strong>
                </article>
                <article className="dashboard-kpi">
                  <span>Occupied Units</span>
                  <strong>
                    {
                      myHouses.filter((house) => house.status === "Rented")
                        .length
                    }
                  </strong>
                </article>
                <article className="dashboard-kpi">
                  <span>New Alerts</span>
                  <strong>{newNotificationCount}</strong>
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
                onClick={() => handleTabChange("houses")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "houses"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaHome /> <span>My Houses</span>
              </button>
              <button
                onClick={() => handleTabChange("tenants")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "tenants"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUsers /> <span>Tenants</span>
              </button>
              <button
                onClick={() => handleTabChange("notifications")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap relative ${
                  activeTab === "notifications"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <div className="relative">
                  <FaBell />
                  {newNotificationCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {newNotificationCount > 9 ? "9+" : newNotificationCount}
                    </span>
                  )}
                </div>
                <span>Notifications</span>
              </button>
              <button
                onClick={() => handleTabChange("rent")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "rent"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaMoneyBillWave /> <span>Rent Payments</span>
              </button>
              <button
                onClick={() => handleTabChange("sell")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "sell"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaCamera /> <span>Sell Property</span>
              </button>
              <button
                onClick={() => handleTabChange("profile")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "profile"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUser /> <span>Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="dashboard-content max-w-7xl mx-auto px-6 py-8">
          {/* My Houses Tab */}
          {activeTab === "houses" && (
            <div>
              {ownerActionMsg && (
                <div
                  className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${
                    ownerActionMsg.startsWith("✅")
                      ? "bg-green-500/20 text-green-400 border border-green-500/40"
                      : "bg-red-500/20 text-red-400 border border-red-500/40"
                  }`}
                >
                  {ownerActionMsg}
                </div>
              )}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">My Houses</h2>
                <button
                  onClick={() => {
                    setShowAddHouseForm((v) => !v);
                    setAddHouseForm(INITIAL_HOUSE_FORM);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center space-x-2"
                >
                  <FaPlus />{" "}
                  <span>{showAddHouseForm ? "Cancel" : "Add House"}</span>
                </button>
              </div>

              {showAddHouseForm && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Add New House</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        value={addHouseForm.address}
                        onChange={(e) =>
                          setAddHouseForm({
                            ...addHouseForm,
                            address: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Full property address"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Block *
                      </label>
                      <input
                        type="text"
                        value={addHouseForm.block}
                        onChange={(e) =>
                          setAddHouseForm({
                            ...addHouseForm,
                            block: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g. A"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Type / Size
                      </label>
                      <input
                        type="text"
                        value={addHouseForm.type}
                        onChange={(e) =>
                          setAddHouseForm({
                            ...addHouseForm,
                            type: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g. 2 BHK"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Status
                      </label>
                      <select
                        value={addHouseForm.status}
                        onChange={(e) =>
                          setAddHouseForm({
                            ...addHouseForm,
                            status: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option>Vacant</option>
                        <option>Occupied</option>
                        <option>Rented</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={handleAddHouse}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                      Save House
                    </button>
                    <button
                      onClick={() => {
                        setShowAddHouseForm(false);
                        setAddHouseForm(INITIAL_HOUSE_FORM);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                      Clear & Close
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myHouses.map((house) => (
                  <div
                    key={house.id}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <FaHome className="text-blue-400 text-2xl" />
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(house.status)}`}
                      >
                        {house.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-3">
                      {house.address}
                    </h3>
                    <div className="space-y-3 text-sm text-gray-400 mb-4 pb-4 border-b border-gray-700">
                      <p>
                        <strong>Type:</strong> {house.type}
                      </p>
                      <p>
                        <strong>Area:</strong> {house.area} sq.ft
                      </p>
                      {house.status === "Rented" && (
                        <>
                          <p>
                            <strong>Tenant:</strong>{" "}
                            <span className="text-blue-400">
                              {house.tenant}
                            </span>
                          </p>
                          <p>
                            <strong>Rent Amount:</strong>{" "}
                            <span className="text-green-400">
                              ₹{house.rentAmount.toLocaleString()}
                            </span>
                          </p>
                          <p>
                            <strong>Next Due:</strong> {house.rentDueDate}
                          </p>
                        </>
                      )}
                    </div>
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition">
                      Edit Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === "tenants" && (
            <div>
              {ownerActionMsg && (
                <div
                  className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${
                    ownerActionMsg.startsWith("✅")
                      ? "bg-green-500/20 text-green-400 border border-green-500/40"
                      : "bg-red-500/20 text-red-400 border border-red-500/40"
                  }`}
                >
                  {ownerActionMsg}
                </div>
              )}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">My Tenants</h2>
                <button
                  onClick={() => {
                    setShowAddTenantForm((v) => !v);
                    setAddTenantForm(INITIAL_TENANT_FORM);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center space-x-2"
                >
                  <FaPlus />{" "}
                  <span>{showAddTenantForm ? "Cancel" : "Add Tenant"}</span>
                </button>
              </div>

              {showAddTenantForm && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Add New Tenant</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={addTenantForm.name}
                        onChange={(e) =>
                          setAddTenantForm({
                            ...addTenantForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Tenant full name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={addTenantForm.email}
                        onChange={(e) =>
                          setAddTenantForm({
                            ...addTenantForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="tenant@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={addTenantForm.contact}
                        onChange={(e) =>
                          setAddTenantForm({
                            ...addTenantForm,
                            contact: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        ID Proof *
                      </label>
                      <input
                        type="text"
                        value={addTenantForm.idProof}
                        onChange={(e) =>
                          setAddTenantForm({
                            ...addTenantForm,
                            idProof: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Aadhaar / Passport / DL"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        House ID (optional)
                      </label>
                      <input
                        type="number"
                        value={addTenantForm.houseId}
                        onChange={(e) =>
                          setAddTenantForm({
                            ...addTenantForm,
                            houseId: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="House DB ID"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Rent Amount
                      </label>
                      <input
                        type="number"
                        value={addTenantForm.rentAmount}
                        onChange={(e) =>
                          setAddTenantForm({
                            ...addTenantForm,
                            rentAmount: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Monthly rent (₹)"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Move-in Date
                      </label>
                      <input
                        type="date"
                        value={addTenantForm.startDate}
                        onChange={(e) =>
                          setAddTenantForm({
                            ...addTenantForm,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={handleAddTenant}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                      Save Tenant
                    </button>
                    <button
                      onClick={() => {
                        setShowAddTenantForm(false);
                        setAddTenantForm(INITIAL_TENANT_FORM);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                      Clear & Close
                    </button>
                  </div>
                </div>
              )}

              {myTenants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Phone
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          House
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Move-in Date
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTenants.map((tenant) => (
                        <tr
                          key={tenant.id}
                          className="border-b border-gray-700 hover:bg-gray-800/50 transition"
                        >
                          <td className="px-6 py-4">{tenant.name}</td>
                          <td className="px-6 py-4 text-gray-400 break-all text-sm">
                            {tenant.email}
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {tenant.phone}
                          </td>
                          <td className="px-6 py-4 text-blue-400">
                            {tenant.house}
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {tenant.moveInDate}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tenant.status)}`}
                            >
                              {tenant.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaUsers className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No tenants currently</p>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Notifications</h2>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-6 hover:border-opacity-100 transition ${
                      notification.type === "Complaint"
                        ? `border-red-500/50 ${notification.status === "New" ? "bg-red-500/10" : "bg-gray-800"}`
                        : notification.type.includes("Offer")
                          ? `border-green-500/50 ${notification.status === "New" ? "bg-green-500/10" : "bg-gray-800"}`
                          : `border-gray-700 ${notification.status === "New" ? "bg-blue-500/10" : "bg-gray-800"}`
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span
                            className={`text-white px-3 py-1 rounded-full text-xs font-semibold ${
                              notification.type === "Complaint"
                                ? "bg-red-500"
                                : notification.type.includes("Offer")
                                  ? "bg-green-500"
                                  : "bg-blue-500"
                            }`}
                          >
                            {notification.type}
                          </span>
                          {notification.status === "New" && (
                            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              NEW
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-1">
                          From: {notification.from}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3">
                          Property:{" "}
                          <span className="text-blue-400">
                            {notification.house}
                          </span>
                        </p>
                        <p className="text-gray-300">{notification.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm mb-4">
                          {notification.date}
                        </p>
                        <button
                          onClick={() => handleReviewNotification(notification)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                        >
                          {notification.status === "New" ? "Review" : "View"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rent Payments Tab */}
          {activeTab === "rent" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Rent Payments</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">
                        House
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">
                        Tenant
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
                    {rentPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-700 hover:bg-gray-800/50 transition"
                      >
                        <td className="px-6 py-4 text-blue-400">
                          {payment.house}
                        </td>
                        <td className="px-6 py-4">{payment.tenant}</td>
                        <td className="px-6 py-4 font-semibold text-green-400">
                          ₹{payment.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {payment.dueDate}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center w-fit ${getStatusColor(payment.status)}`}
                          >
                            {payment.status === "Paid" ? (
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
                          {payment.paidDate || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {payment.method ? (
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                              {payment.method}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sell Property Tab */}
          {activeTab === "sell" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
                <h2 className="text-2xl font-bold">Add Property for Sale</h2>
                <p className="text-sm text-gray-400">
                  Published Listings:{" "}
                  <span className="text-blue-400">{saleListings.length}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Create Listing</h3>
                  <p className="text-sm text-gray-400">
                    Add real photos from your gallery or open camera to capture
                    the property instantly.
                  </p>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      value={saleForm.title}
                      onChange={(event) =>
                        handleSaleFormChange("title", event.target.value)
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Example: Skyline Luxury Flat"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={saleForm.address}
                      onChange={(event) =>
                        handleSaleFormChange("address", event.target.value)
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Full property address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Type
                      </label>
                      <select
                        value={saleForm.bhk}
                        onChange={(event) =>
                          handleSaleFormChange("bhk", event.target.value)
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="1BHK">1BHK</option>
                        <option value="2BHK">2BHK</option>
                        <option value="3BHK">3BHK</option>
                        <option value="4BHK">4BHK</option>
                        <option value="5BHK">5BHK</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Area (sq.ft) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={saleForm.area}
                        onChange={(event) =>
                          handleSaleFormChange("area", event.target.value)
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="1200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={saleForm.price}
                      onChange={(event) =>
                        handleSaleFormChange("price", event.target.value)
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="5000000"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Description
                    </label>
                    <textarea
                      value={saleForm.description}
                      onChange={(event) =>
                        handleSaleFormChange("description", event.target.value)
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                      placeholder="Brief highlights like furnishing, nearby spots, parking, etc."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-gray-400 text-sm">
                      Property Photos (max 6)
                    </label>

                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGallerySelection}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleCameraSelection}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <FaImage />
                        <span>Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <FaCamera />
                        <span>Camera</span>
                      </button>
                    </div>

                    {salePhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {salePhotos.map((photo, index) => (
                          <div
                            key={`${photo.slice(0, 30)}-${index}`}
                            className="relative"
                          >
                            <img
                              src={photo}
                              alt={`Property ${index + 1}`}
                              className="w-full h-20 rounded-lg object-cover border border-gray-600"
                            />
                            <button
                              type="button"
                              onClick={() => removePhotoAt(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                              aria-label="Remove photo"
                            >
                              <FaTimesCircle size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateSaleListing}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <FaPlus />
                    <span>Publish Property</span>
                  </button>
                </div>

                <div className="xl:col-span-3 space-y-4">
                  {saleListings.length > 0 ? (
                    saleListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-1">
                            {typeof listing.image === "string" &&
                            listing.image.startsWith("data:image") ? (
                              <img
                                src={listing.image}
                                alt={listing.title}
                                className="w-full h-44 object-cover rounded-lg border border-gray-600"
                              />
                            ) : (
                              <div className="w-full h-44 rounded-lg border border-gray-600 bg-blue-500 flex items-center justify-center text-5xl">
                                {listing.image || "🏠"}
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-xl font-bold">
                                  {listing.title}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {listing.address}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteSaleListing(listing.id)
                                }
                                className="bg-red-500/20 text-red-300 hover:bg-red-500/30 px-3 py-1 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                              >
                                <FaTrash size={12} />
                                <span>Delete</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm pt-2">
                              <p>
                                <span className="text-gray-400">Type:</span>{" "}
                                <span className="text-blue-300">
                                  {listing.bhk}
                                </span>
                              </p>
                              <p>
                                <span className="text-gray-400">Area:</span>{" "}
                                <span>{listing.area} sq.ft</span>
                              </p>
                              <p>
                                <span className="text-gray-400">Price:</span>{" "}
                                <span className="text-green-300 font-semibold">
                                  ₹{Number(listing.price).toLocaleString()}
                                </span>
                              </p>
                            </div>

                            {listing.description && (
                              <p className="text-sm text-gray-300 pt-1">
                                {listing.description}
                              </p>
                            )}

                            <p className="text-xs text-gray-500 pt-1">
                              Photos attached: {listing.images?.length || 1}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
                      <FaCamera className="text-5xl text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-300 text-lg mb-1">
                        No sale listings yet
                      </p>
                      <p className="text-gray-500 text-sm">
                        Create your first listing with real photos so buyers can
                        place offers.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
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
                          {ownerProfile.name}
                        </h3>
                        <p className="text-gray-400">
                          House Owner • Member since {ownerProfile.joinDate}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setProfileForm({
                            name: ownerProfile.name,
                            email: ownerProfile.email,
                            phone: ownerProfile.phone,
                            address: ownerProfile.address,
                            bankAccount: ownerProfile.bankAccount,
                          });
                          setEditProfile(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center space-x-2"
                      >
                        <FaEdit /> <span>Edit Profile</span>
                      </button>
                    </div>

                    {/* Profile Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-gray-700">
                      {/* Contact Information */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">
                            Email Address
                          </p>
                          <div className="flex items-center space-x-2">
                            <FaEnvelope className="text-blue-400" />
                            <p className="text-lg">{ownerProfile.email}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">
                            Phone Number
                          </p>
                          <div className="flex items-center space-x-2">
                            <FaPhone className="text-blue-400" />
                            <p className="text-lg">{ownerProfile.phone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Address and Properties */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Address</p>
                          <div className="flex items-center space-x-2">
                            <FaMapMarkerAlt className="text-blue-400" />
                            <p className="text-lg">{ownerProfile.address}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">
                            Total Properties
                          </p>
                          <p className="text-lg font-semibold text-blue-400">
                            {ownerProfile.totalProperties} Properties
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Banking Information */}
                    <div className="pt-8">
                      <h4 className="text-lg font-semibold mb-4">
                        Banking Information
                      </h4>
                      <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1">
                          Bank Account
                        </p>
                        <p className="text-lg font-mono">
                          {ownerProfile.bankAccount}
                        </p>
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
                            Address
                          </label>
                          <input
                            type="text"
                            value={profileForm.address ?? ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                address: e.target.value,
                              })
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Bank Account
                          </label>
                          <input
                            type="text"
                            value={profileForm.bankAccount ?? ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                bankAccount: e.target.value,
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
        </div>
      </motion.div>
      <Footer />
    </>
  );
}

export default HouseOwnerDashboard;
