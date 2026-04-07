import { useEffect, useState } from "react";
import {
  FaBell,
  FaCheckCircle,
  FaClipboard,
  FaHome,
  FaPlus,
  FaTimesCircle,
  FaTools,
  FaUsers,
} from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Footer from "../../components/footer";
import Navbar from "../../components/navbar";

const TAB_IDS = ["houses", "owners", "tenants", "complaints", "maintenance"];

const INITIAL_HOUSE_FORM = {
  status: "Empty",
  type: "2 BHK",
  block: "",
  address: "",
  ownerId: "",
  imageUrl: "",
};

const INITIAL_OWNER_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  street: "",
  city: "",
  idProof: "",
  idProofImage: "",
  accountPassword: "",
};

const INITIAL_TENANT_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  street: "",
  city: "",
  idProof: "",
  idProofImage: "",
  accountPassword: "",
  houseId: "",
  rentAmount: "",
  startDate: "",
  endDate: "",
};

const INITIAL_COMPLAINT_FORM = {
  complainant: "",
  type: "Maintenance",
  house: "",
  description: "",
  status: "Pending",
};

const INITIAL_MAINTENANCE_FORM = {
  houseId: "",
  amount: "",
  billDate: "",
  dueDate: "",
  status: "Pending",
};

const readImageFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("houses");
  const [houses, setHouses] = useState([]);
  const [owners, setOwners] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [maintenanceBills, setMaintenanceBills] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionMessage, setActionMessage] = useState({
    type: "",
    text: "",
  });

  const [showHouseForm, setShowHouseForm] = useState(false);
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

  const [houseForm, setHouseForm] = useState(INITIAL_HOUSE_FORM);
  const [ownerForm, setOwnerForm] = useState(INITIAL_OWNER_FORM);
  const [tenantForm, setTenantForm] = useState(INITIAL_TENANT_FORM);
  const [complaintForm, setComplaintForm] = useState(INITIAL_COMPLAINT_FORM);
  const [maintenanceForm, setMaintenanceForm] = useState(
    INITIAL_MAINTENANCE_FORM,
  );
  const fadeInUp = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: "easeOut" },
  };

  const showMessage = (type, text) => {
    setActionMessage({ type, text });
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

  const requestJson = async (path, options = {}) => {
    const { headers: customHeaders = {}, ...restOptions } = options;

    const response = await fetch(`/express${path}`, {
      ...restOptions,
      headers: {
        "Content-Type": "application/json",
        ...getCurrentUserAuthHeaders(),
        ...customHeaders,
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || "Request failed");
    }

    return payload;
  };

  const loadDashboardData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    setLoadError("");

    try {
      const [
        housesResponse,
        ownersResponse,
        tenantsResponse,
        complaintsResponse,
        maintenanceResponse,
      ] = await Promise.all([
        requestJson("/api/admin/houses"),
        requestJson("/api/admin/owners"),
        requestJson("/api/admin/tenants"),
        requestJson("/api/admin/complaints"),
        requestJson("/api/admin/maintenance-bills"),
      ]);

      setHouses(
        Array.isArray(housesResponse.houses) ? housesResponse.houses : [],
      );
      setOwners(
        Array.isArray(ownersResponse.owners) ? ownersResponse.owners : [],
      );
      setTenants(
        Array.isArray(tenantsResponse.tenants) ? tenantsResponse.tenants : [],
      );
      setComplaints(
        Array.isArray(complaintsResponse.complaints)
          ? complaintsResponse.complaints
          : [],
      );
      setMaintenanceBills(
        Array.isArray(maintenanceResponse.maintenanceBills)
          ? maintenanceResponse.maintenanceBills
          : [],
      );
    } catch (error) {
      setLoadError(error.message || "Unable to load dashboard data");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    const normalized = String(status || "").toLowerCase();

    switch (normalized) {
      case "paid":
      case "active":
      case "resolved":
      case "occupied":
      case "rented":
        return "bg-green-500/20 text-green-300";
      case "pending":
      case "in progress":
        return "bg-yellow-500/20 text-yellow-300";
      case "vacant":
      case "empty":
      case "inactive":
        return "bg-blue-500/20 text-blue-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const handleAddHouse = async (event) => {
    event.preventDefault();

    if (
      !houseForm.status ||
      !houseForm.block.trim() ||
      !houseForm.address.trim()
    ) {
      showMessage(
        "error",
        "Status, block and address are required for houses.",
      );
      return;
    }

    const payload = {
      status: houseForm.status,
      type: houseForm.type.trim(),
      block: houseForm.block.trim(),
      address: houseForm.address.trim(),
      ownerId: houseForm.ownerId.trim()
        ? Number(houseForm.ownerId.trim())
        : null,
      imageUrl: houseForm.imageUrl,
    };

    if (payload.ownerId !== null && Number.isNaN(payload.ownerId)) {
      showMessage("error", "Owner ID must be a valid number.");
      return;
    }

    try {
      await requestJson("/api/admin/houses", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setHouseForm(INITIAL_HOUSE_FORM);
      setShowHouseForm(false);
      showMessage("success", "House added successfully.");
      await loadDashboardData(true);
    } catch (error) {
      showMessage("error", error.message || "Failed to add house.");
    }
  };

  const handleAddOwner = async (event) => {
    event.preventDefault();

    if (
      !ownerForm.name.trim() ||
      !ownerForm.email.trim() ||
      !ownerForm.idProof.trim() ||
      !ownerForm.accountPassword
    ) {
      showMessage(
        "error",
        "Name, email, ID proof and account password are required for owners.",
      );
      return;
    }

    try {
      const payload = await requestJson("/api/admin/owners", {
        method: "POST",
        body: JSON.stringify({
          name: ownerForm.name.trim(),
          email: ownerForm.email.trim(),
          idProof: ownerForm.idProof.trim(),
          idProofImage: ownerForm.idProofImage,
          accountPassword: ownerForm.accountPassword,
          contact: ownerForm.phone.trim(),
          address: ownerForm.address.trim(),
          street: ownerForm.street.trim(),
          city: ownerForm.city.trim(),
        }),
      });

      setOwnerForm(INITIAL_OWNER_FORM);
      setShowOwnerForm(false);
      showMessage(
        "success",
        `Owner added. Personal email: ${payload.personalEmail}`,
      );
      await loadDashboardData(true);
    } catch (error) {
      showMessage("error", error.message || "Failed to add owner.");
    }
  };

  const handleAddTenant = async (event) => {
    event.preventDefault();

    if (
      !tenantForm.name.trim() ||
      !tenantForm.email.trim() ||
      !tenantForm.idProof.trim() ||
      !tenantForm.accountPassword
    ) {
      showMessage(
        "error",
        "Name, email, ID proof and account password are required for tenants.",
      );
      return;
    }

    const hasAnyRentalField =
      tenantForm.houseId.trim() ||
      tenantForm.rentAmount.trim() ||
      tenantForm.startDate;

    if (
      hasAnyRentalField &&
      (!tenantForm.houseId.trim() ||
        !tenantForm.rentAmount.trim() ||
        !tenantForm.startDate)
    ) {
      showMessage(
        "error",
        "To assign rental, provide house ID, rent amount and start date together.",
      );
      return;
    }

    try {
      const payload = await requestJson("/api/admin/tenants", {
        method: "POST",
        body: JSON.stringify({
          name: tenantForm.name.trim(),
          email: tenantForm.email.trim(),
          idProof: tenantForm.idProof.trim(),
          idProofImage: tenantForm.idProofImage,
          accountPassword: tenantForm.accountPassword,
          contact: tenantForm.phone.trim(),
          address: tenantForm.address.trim(),
          street: tenantForm.street.trim(),
          city: tenantForm.city.trim(),
          houseId: tenantForm.houseId.trim(),
          rentAmount: tenantForm.rentAmount.trim(),
          startDate: tenantForm.startDate || null,
          endDate: tenantForm.endDate || null,
        }),
      });

      setTenantForm(INITIAL_TENANT_FORM);
      setShowTenantForm(false);
      showMessage(
        "success",
        `Tenant added. Personal email: ${payload.personalEmail}`,
      );
      await loadDashboardData(true);
    } catch (error) {
      showMessage("error", error.message || "Failed to add tenant.");
    }
  };

  const handleAddComplaint = async (event) => {
    event.preventDefault();

    if (
      !complaintForm.complainant.trim() ||
      !complaintForm.type.trim() ||
      !complaintForm.description.trim()
    ) {
      showMessage("error", "Complainant, type and description are required.");
      return;
    }

    try {
      await requestJson("/api/admin/complaints", {
        method: "POST",
        body: JSON.stringify({
          complainant: complaintForm.complainant.trim(),
          type: complaintForm.type.trim(),
          house: complaintForm.house.trim(),
          description: complaintForm.description.trim(),
          status: complaintForm.status,
        }),
      });

      setComplaintForm(INITIAL_COMPLAINT_FORM);
      setShowComplaintForm(false);
      showMessage("success", "Complaint added successfully.");
      await loadDashboardData(true);
    } catch (error) {
      showMessage("error", error.message || "Failed to add complaint.");
    }
  };

  const handleAddMaintenanceBill = async (event) => {
    event.preventDefault();

    if (
      !maintenanceForm.houseId.trim() ||
      !maintenanceForm.amount.trim() ||
      !maintenanceForm.dueDate
    ) {
      showMessage(
        "error",
        "House ID, amount and due date are required for maintenance bills.",
      );
      return;
    }

    try {
      await requestJson("/api/admin/maintenance-bills", {
        method: "POST",
        body: JSON.stringify({
          houseId: maintenanceForm.houseId.trim(),
          amount: maintenanceForm.amount.trim(),
          billDate: maintenanceForm.billDate || null,
          dueDate: maintenanceForm.dueDate,
          status: maintenanceForm.status,
        }),
      });

      setMaintenanceForm(INITIAL_MAINTENANCE_FORM);
      setShowMaintenanceForm(false);
      showMessage("success", "Maintenance bill added successfully.");
      await loadDashboardData(true);
    } catch (error) {
      showMessage("error", error.message || "Failed to add maintenance bill.");
    }
  };

  const handleReviewComplaint = async (complaint) => {
    const complaintId = complaint?.id;
    if (!complaintId) {
      return;
    }

    if (String(complaint.status || "").toLowerCase() === "resolved") {
      setSelectedComplaint(complaint);
      return;
    }

    try {
      const payload = await requestJson(
        `/api/admin/complaints/${complaintId}/review`,
        {
          method: "PATCH",
        },
      );

      if (payload.complaint) {
        setComplaints((prev) =>
          prev.map((item) =>
            item.id === complaintId ? payload.complaint : item,
          ),
        );

        setSelectedComplaint(payload.complaint);
      } else {
        setSelectedComplaint(complaint);
      }

      showMessage("success", "Complaint reviewed successfully.");
    } catch (error) {
      showMessage("error", error.message || "Failed to review complaint.");
    }
  };

  const navbarLinks = [
    { label: "Houses", path: "/dashboard/admin#houses" },
    { label: "Owners", path: "/dashboard/admin#owners" },
    { label: "Tenants", path: "/dashboard/admin#tenants" },
    { label: "Complaints", path: "/dashboard/admin#complaints" },
    { label: "Maintenance", path: "/dashboard/admin#maintenance" },
  ];

  useEffect(() => {
    const syncTabFromHash = () => {
      const hashTab = window.location.hash.replace("#", "");
      if (TAB_IDS.includes(hashTab)) {
        setActiveTab(hashTab);
      }
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <>
      <Navbar links={navbarLinks} sectionLabel="Admin" />
      <motion.div
        className="dashboard-page min-h-screen text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div className="dashboard-hero p-8 shadow-lg" {...fadeInUp}>
          <div className="max-w-7xl mx-auto">
            <p className="dashboard-eyebrow">Society Operations</p>
            <div className="dashboard-hero-row">
              <div>
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <p className="text-blue-100 mt-2">
                  Live records from PostgreSQL with add actions per tab
                </p>
              </div>
              <div className="dashboard-kpis">
                <article className="dashboard-kpi">
                  <span>Total Houses</span>
                  <strong>{houses.length}</strong>
                </article>
                <article className="dashboard-kpi">
                  <span>Active Tenants</span>
                  <strong>
                    {
                      tenants.filter(
                        (tenant) =>
                          String(tenant.status).toLowerCase() === "active",
                      ).length
                    }
                  </strong>
                </article>
                <article className="dashboard-kpi">
                  <span>Open Complaints</span>
                  <strong>
                    {
                      complaints.filter(
                        (complaint) =>
                          String(complaint.status).toLowerCase() !== "resolved",
                      ).length
                    }
                  </strong>
                </article>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="dashboard-topnav sticky top-0 shadow-lg z-10"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => handleTabChange("houses")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "houses"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaHome /> <span>Houses</span>
              </button>
              <button
                onClick={() => handleTabChange("owners")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "owners"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUsers /> <span>House Owners</span>
              </button>
              <button
                onClick={() => handleTabChange("tenants")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "tenants"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUsers /> <span>Tenants</span>
              </button>
              <button
                onClick={() => handleTabChange("complaints")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "complaints"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaBell /> <span>Complaints</span>
              </button>
              <button
                onClick={() => handleTabChange("maintenance")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "maintenance"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaTools /> <span>Maintenance Bills</span>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="dashboard-content max-w-7xl mx-auto px-6 py-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.08 }}
        >
          {loadError && (
            <div className="mb-6 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-red-200">
              {loadError}
            </div>
          )}

          {actionMessage.text && (
            <div
              className={`mb-6 rounded-xl px-4 py-3 ${
                actionMessage.type === "error"
                  ? "border border-red-400/40 bg-red-500/20 text-red-200"
                  : "border border-green-400/40 bg-green-500/20 text-green-200"
              }`}
            >
              {actionMessage.text}
            </div>
          )}

          {isLoading ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
              <p className="text-lg text-gray-300">
                Loading live dashboard data...
              </p>
            </div>
          ) : (
            <>
              {activeTab === "houses" && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-2xl font-bold">All Houses</h2>
                    <button
                      type="button"
                      onClick={() => setShowHouseForm((prev) => !prev)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                    >
                      <FaPlus />
                      <span>{showHouseForm ? "Close" : "Add House"}</span>
                    </button>
                  </div>

                  {showHouseForm && (
                    <form
                      onSubmit={handleAddHouse}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Status *
                          </label>
                          <select
                            value={houseForm.status}
                            onChange={(event) =>
                              setHouseForm((prev) => ({
                                ...prev,
                                status: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="Empty">Vacant</option>
                            <option value="Occupied">Occupied</option>
                            <option value="Rented">Rented</option>
                            <option value="Empty">Empty</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Type / Size
                          </label>
                          <input
                            type="text"
                            value={houseForm.type}
                            onChange={(event) =>
                              setHouseForm((prev) => ({
                                ...prev,
                                type: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                            placeholder="3 BHK"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Block *
                          </label>
                          <input
                            type="text"
                            value={houseForm.block}
                            onChange={(event) =>
                              setHouseForm((prev) => ({
                                ...prev,
                                block: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                            placeholder="A"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-gray-400 text-sm mb-2">
                            Address *
                          </label>
                          <input
                            type="text"
                            value={houseForm.address}
                            onChange={(event) =>
                              setHouseForm((prev) => ({
                                ...prev,
                                address: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                            placeholder="A-101, Sunrise Apartments"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Owner ID
                          </label>
                          <select
                            value={houseForm.ownerId}
                            onChange={(event) =>
                              setHouseForm((prev) => ({
                                ...prev,
                                ownerId: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="">No owner</option>
                            {owners.map((owner) => (
                              <option key={owner.id} value={String(owner.id)}>
                                #{owner.id} - {owner.name} ({owner.email})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-gray-400 text-sm mb-2">
                            House Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                setHouseForm((prev) => ({
                                  ...prev,
                                  imageUrl: "",
                                }));
                                return;
                              }

                              try {
                                const imageData =
                                  await readImageFileAsDataUrl(file);
                                setHouseForm((prev) => ({
                                  ...prev,
                                  imageUrl: imageData,
                                }));
                              } catch (error) {
                                showMessage(
                                  "error",
                                  error.message ||
                                    "Failed to load house image.",
                                );
                              }
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                          <p className="text-xs text-gray-400 mt-2">
                            Upload JPG, PNG or WEBP for this house.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-5">
                        <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Save House
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHouseForm(INITIAL_HOUSE_FORM);
                            setShowHouseForm(false);
                          }}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {houses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {houses.map((house) => (
                        <div
                          key={house.id}
                          className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition"
                        >
                          <div className="flex items-start justify-between mb-4">
                            {house.imageUrl ? (
                              <img
                                src={house.imageUrl}
                                alt={house.address}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                              />
                            ) : (
                              <FaHome className="text-blue-400 text-2xl" />
                            )}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(house.status)}`}
                            >
                              {house.status}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">
                            {house.address}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-400">
                            <p>
                              <strong>House ID:</strong> {house.id}
                            </p>
                            <p>
                              <strong>Type:</strong> {house.type || "-"}
                            </p>
                            <p>
                              <strong>Block:</strong> {house.block || "-"}
                            </p>
                            <p>
                              <strong>Owner ID:</strong> {house.ownerId || "-"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
                      <p className="text-gray-300">No houses found.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "owners" && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-2xl font-bold">House Owners</h2>
                    <button
                      type="button"
                      onClick={() => setShowOwnerForm((prev) => !prev)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                    >
                      <FaPlus />
                      <span>{showOwnerForm ? "Close" : "Add Owner"}</span>
                    </button>
                  </div>

                  {showOwnerForm && (
                    <form
                      onSubmit={handleAddOwner}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={ownerForm.name}
                            onChange={(event) =>
                              setOwnerForm((prev) => ({
                                ...prev,
                                name: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={ownerForm.email}
                            onChange={(event) =>
                              setOwnerForm((prev) => ({
                                ...prev,
                                email: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Phone
                          </label>
                          <input
                            type="text"
                            value={ownerForm.phone}
                            onChange={(event) =>
                              setOwnerForm((prev) => ({
                                ...prev,
                                phone: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            ID Proof *
                          </label>
                          <input
                            type="text"
                            value={ownerForm.idProof}
                            onChange={(event) =>
                              setOwnerForm((prev) => ({
                                ...prev,
                                idProof: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            ID Proof Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                setOwnerForm((prev) => ({
                                  ...prev,
                                  idProofImage: "",
                                }));
                                return;
                              }

                              try {
                                const imageData =
                                  await readImageFileAsDataUrl(file);
                                setOwnerForm((prev) => ({
                                  ...prev,
                                  idProofImage: imageData,
                                }));
                              } catch (error) {
                                showMessage(
                                  "error",
                                  error.message ||
                                    "Failed to load owner ID proof image.",
                                );
                              }
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Account Password *
                          </label>
                          <input
                            type="password"
                            value={ownerForm.accountPassword}
                            onChange={(event) =>
                              setOwnerForm((prev) => ({
                                ...prev,
                                accountPassword: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={ownerForm.city}
                            onChange={(event) =>
                              setOwnerForm((prev) => ({
                                ...prev,
                                city: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Street
                          </label>
                          <input
                            type="text"
                            value={ownerForm.street}
                            onChange={(event) =>
                              setOwnerForm((prev) => ({
                                ...prev,
                                street: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-gray-400 text-sm mb-2">
                            Address
                          </label>
                          <input
                            type="text"
                            value={ownerForm.address}
                            onChange={(event) =>
                              setOwnerForm((prev) => ({
                                ...prev,
                                address: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-5">
                        <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Save Owner
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOwnerForm(INITIAL_OWNER_FORM);
                            setShowOwnerForm(false);
                          }}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {owners.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-6 py-4 text-left font-semibold text-gray-300">
                              ID
                            </th>
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
                              Properties
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {owners.map((owner) => (
                            <tr
                              key={owner.id}
                              className="border-b border-gray-700 hover:bg-gray-800/50 transition"
                            >
                              <td className="px-6 py-4 text-gray-300">
                                #{owner.id}
                              </td>
                              <td className="px-6 py-4">{owner.name}</td>
                              <td className="px-6 py-4 text-gray-400">
                                {owner.email}
                              </td>
                              <td className="px-6 py-4 text-gray-400">
                                {owner.phone}
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  {(Array.isArray(owner.properties)
                                    ? owner.properties
                                    : []
                                  ).length > 0 ? (
                                    (Array.isArray(owner.properties)
                                      ? owner.properties
                                      : []
                                    ).map((property, index) => (
                                      <div
                                        key={`${owner.id}-${index}`}
                                        className="text-sm text-blue-400"
                                      >
                                        {property}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-sm text-gray-500">
                                      No properties
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
                      <p className="text-gray-300">No owners found.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "tenants" && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-2xl font-bold">Tenants</h2>
                    <button
                      type="button"
                      onClick={() => setShowTenantForm((prev) => !prev)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                    >
                      <FaPlus />
                      <span>{showTenantForm ? "Close" : "Add Tenant"}</span>
                    </button>
                  </div>

                  {showTenantForm && (
                    <form
                      onSubmit={handleAddTenant}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6"
                    >
                      <p className="text-sm text-gray-400 mb-4">
                        Fill basic tenant data. Rental fields are optional but
                        must be complete together.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={tenantForm.name}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                name: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={tenantForm.email}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                email: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Phone
                          </label>
                          <input
                            type="text"
                            value={tenantForm.phone}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                phone: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            ID Proof *
                          </label>
                          <input
                            type="text"
                            value={tenantForm.idProof}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                idProof: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            ID Proof Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                setTenantForm((prev) => ({
                                  ...prev,
                                  idProofImage: "",
                                }));
                                return;
                              }

                              try {
                                const imageData =
                                  await readImageFileAsDataUrl(file);
                                setTenantForm((prev) => ({
                                  ...prev,
                                  idProofImage: imageData,
                                }));
                              } catch (error) {
                                showMessage(
                                  "error",
                                  error.message ||
                                    "Failed to load tenant ID proof image.",
                                );
                              }
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Account Password *
                          </label>
                          <input
                            type="password"
                            value={tenantForm.accountPassword}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                accountPassword: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={tenantForm.city}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                city: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Street
                          </label>
                          <input
                            type="text"
                            value={tenantForm.street}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                street: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-gray-400 text-sm mb-2">
                            Address
                          </label>
                          <input
                            type="text"
                            value={tenantForm.address}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                address: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            House ID
                          </label>
                          <select
                            value={tenantForm.houseId}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                houseId: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="">No house assigned</option>
                            {houses.map((house) => (
                              <option key={house.id} value={String(house.id)}>
                                #{house.id} - {house.address}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Rent Amount
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={tenantForm.rentAmount}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                rentAmount: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={tenantForm.startDate}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                startDate: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={tenantForm.endDate}
                            onChange={(event) =>
                              setTenantForm((prev) => ({
                                ...prev,
                                endDate: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-5">
                        <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Save Tenant
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTenantForm(INITIAL_TENANT_FORM);
                            setShowTenantForm(false);
                          }}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {tenants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-6 py-4 text-left font-semibold text-gray-300">
                              ID
                            </th>
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
                          {tenants.map((tenant) => (
                            <tr
                              key={tenant.id}
                              className="border-b border-gray-700 hover:bg-gray-800/50 transition"
                            >
                              <td className="px-6 py-4 text-gray-300">
                                #{tenant.id}
                              </td>
                              <td className="px-6 py-4">{tenant.name}</td>
                              <td className="px-6 py-4 text-gray-400">
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
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
                      <p className="text-gray-300">No tenants found.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "complaints" && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-2xl font-bold">Complaints</h2>
                    <button
                      type="button"
                      onClick={() => setShowComplaintForm((prev) => !prev)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                    >
                      <FaPlus />
                      <span>
                        {showComplaintForm ? "Close" : "Add Complaint"}
                      </span>
                    </button>
                  </div>

                  {showComplaintForm && (
                    <form
                      onSubmit={handleAddComplaint}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Complainant *
                          </label>
                          <input
                            type="text"
                            value={complaintForm.complainant}
                            onChange={(event) =>
                              setComplaintForm((prev) => ({
                                ...prev,
                                complainant: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Type *
                          </label>
                          <select
                            value={complaintForm.type}
                            onChange={(event) =>
                              setComplaintForm((prev) => ({
                                ...prev,
                                type: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="Maintenance">Maintenance</option>
                            <option value="Noise">Noise</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Security">Security</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Status
                          </label>
                          <select
                            value={complaintForm.status}
                            onChange={(event) =>
                              setComplaintForm((prev) => ({
                                ...prev,
                                status: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-gray-400 text-sm mb-2">
                            House
                          </label>
                          <input
                            type="text"
                            value={complaintForm.house}
                            onChange={(event) =>
                              setComplaintForm((prev) => ({
                                ...prev,
                                house: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                            placeholder="A-101, Sunrise Apartments"
                          />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-gray-400 text-sm mb-2">
                            Description *
                          </label>
                          <textarea
                            value={complaintForm.description}
                            onChange={(event) =>
                              setComplaintForm((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-24 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-5">
                        <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Save Complaint
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setComplaintForm(INITIAL_COMPLAINT_FORM);
                            setShowComplaintForm(false);
                          }}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {complaints.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {complaints.map((complaint) => (
                        <div
                          key={complaint.id}
                          className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {complaint.complainant}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {complaint.house}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}
                            >
                              {complaint.status}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Type:</strong>{" "}
                              <span className="text-blue-400">
                                {complaint.type}
                              </span>
                            </p>
                            <p>
                              <strong>Description:</strong>{" "}
                              <span className="text-gray-300">
                                {complaint.description}
                              </span>
                            </p>
                            <p>
                              <strong>Date:</strong>{" "}
                              <span className="text-gray-400">
                                {complaint.date}
                              </span>
                            </p>
                          </div>
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => handleReviewComplaint(complaint)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                            >
                              {String(complaint.status).toLowerCase() ===
                              "resolved"
                                ? "View"
                                : "Review"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
                      <p className="text-gray-300">No complaints found.</p>
                    </div>
                  )}
                </div>
              )}

              {selectedComplaint && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl">
                    <div className="flex items-center justify-between p-5 border-b border-gray-700">
                      <h3 className="text-xl font-bold">Complaint Details</h3>
                      <button
                        type="button"
                        onClick={() => setSelectedComplaint(null)}
                        className="text-gray-400 hover:text-white text-2xl leading-none"
                      >
                        ×
                      </button>
                    </div>

                    <div className="p-6 space-y-4 text-sm">
                      <p>
                        <strong>ID:</strong> #{selectedComplaint.id}
                      </p>
                      <p>
                        <strong>Complainant:</strong>{" "}
                        {selectedComplaint.complainant}
                      </p>
                      <p>
                        <strong>House:</strong> {selectedComplaint.house}
                      </p>
                      <p>
                        <strong>Type:</strong>{" "}
                        <span className="text-blue-400">
                          {selectedComplaint.type}
                        </span>
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedComplaint.status)}`}
                        >
                          {selectedComplaint.status}
                        </span>
                      </p>
                      <p>
                        <strong>Date:</strong> {selectedComplaint.date}
                      </p>

                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <p className="text-gray-300 leading-relaxed">
                          {selectedComplaint.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-6">
                      <button
                        type="button"
                        onClick={() => setSelectedComplaint(null)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "maintenance" && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-2xl font-bold">Maintenance Bills</h2>
                    <button
                      type="button"
                      onClick={() => setShowMaintenanceForm((prev) => !prev)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                    >
                      <FaPlus />
                      <span>{showMaintenanceForm ? "Close" : "Add Bill"}</span>
                    </button>
                  </div>

                  {showMaintenanceForm && (
                    <form
                      onSubmit={handleAddMaintenanceBill}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            House ID *
                          </label>
                          <select
                            value={maintenanceForm.houseId}
                            onChange={(event) =>
                              setMaintenanceForm((prev) => ({
                                ...prev,
                                houseId: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="">Select house</option>
                            {houses.map((house) => (
                              <option key={house.id} value={String(house.id)}>
                                #{house.id} - {house.address}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Amount (₹) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={maintenanceForm.amount}
                            onChange={(event) =>
                              setMaintenanceForm((prev) => ({
                                ...prev,
                                amount: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Status
                          </label>
                          <select
                            value={maintenanceForm.status}
                            onChange={(event) =>
                              setMaintenanceForm((prev) => ({
                                ...prev,
                                status: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Bill Date
                          </label>
                          <input
                            type="date"
                            value={maintenanceForm.billDate}
                            onChange={(event) =>
                              setMaintenanceForm((prev) => ({
                                ...prev,
                                billDate: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Due Date *
                          </label>
                          <input
                            type="date"
                            value={maintenanceForm.dueDate}
                            onChange={(event) =>
                              setMaintenanceForm((prev) => ({
                                ...prev,
                                dueDate: event.target.value,
                              }))
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-5">
                        <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Save Bill
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMaintenanceForm(INITIAL_MAINTENANCE_FORM);
                            setShowMaintenanceForm(false);
                          }}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {maintenanceBills.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-6 py-4 text-left font-semibold text-gray-300">
                              House
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
                          {maintenanceBills.map((bill) => (
                            <tr
                              key={bill.id}
                              className="border-b border-gray-700 hover:bg-gray-800/50 transition"
                            >
                              <td className="px-6 py-4 text-blue-400">
                                {bill.house}
                              </td>
                              <td className="px-6 py-4 font-semibold">
                                ₹{Number(bill.amount || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-gray-400">
                                {bill.dueDate}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center w-fit ${getStatusColor(bill.status)}`}
                                >
                                  {String(bill.status).toLowerCase() ===
                                  "paid" ? (
                                    <>
                                      <FaCheckCircle className="mr-2" />{" "}
                                      {bill.status}
                                    </>
                                  ) : (
                                    <>
                                      <FaTimesCircle className="mr-2" />{" "}
                                      {bill.status}
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-400">
                                {bill.paidDate || "-"}
                              </td>
                              <td className="px-6 py-4">
                                {bill.paymentMethod ? (
                                  <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
                                    {bill.paymentMethod}
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
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
                      <p className="text-gray-300">
                        No maintenance bills found.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
      <Footer />
    </>
  );
}

export default AdminDashboard;
