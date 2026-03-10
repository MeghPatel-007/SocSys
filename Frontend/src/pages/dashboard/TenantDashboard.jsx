import { useState } from "react";
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
import Navbar from "../../components/navbar";

function TenantDashboard() {
  const [activeTab, setActiveTab] = useState("profile");
  const [editProfile, setEditProfile] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  // Sample tenant profile
  const [tenantProfile, setTenantProfile] = useState({
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
  });

  // Sample maintenance payments
  const [maintenancePayments] = useState([
    {
      id: 1,
      month: "March 2024",
      amount: 5000,
      dueDate: "2024-03-10",
      status: "Paid",
      paidDate: "2024-03-09",
      method: "UPI",
    },
    {
      id: 2,
      month: "February 2024",
      amount: 5000,
      dueDate: "2024-02-10",
      status: "Paid",
      paidDate: "2024-02-09",
      method: "Bank Transfer",
    },
    {
      id: 3,
      month: "January 2024",
      amount: 5000,
      dueDate: "2024-01-10",
      status: "Paid",
      paidDate: "2024-01-10",
      method: "Cash",
    },
    {
      id: 4,
      month: "December 2023",
      amount: 5000,
      dueDate: "2023-12-10",
      status: "Paid",
      paidDate: "2023-12-09",
      method: "UPI",
    },
  ]);

  // Complaints state
  const [complaints, setComplaints] = useState([
    {
      id: 1,
      type: "Plumbing",
      description: "Leaky tap in bathroom",
      date: "2024-03-08",
      status: "Resolved",
    },
    {
      id: 2,
      type: "Electrical",
      description: "Flickering lights in bedroom",
      date: "2024-03-05",
      status: "In Progress",
    },
  ]);

  const [complaintForm, setComplaintForm] = useState({
    type: "Maintenance",
    description: "",
  });

  const handleSubmitComplaint = () => {
    if (complaintForm.description.trim()) {
      const newComplaint = {
        id: complaints.length + 1,
        type: complaintForm.type,
        description: complaintForm.description,
        date: new Date().toISOString().split("T")[0],
        status: "Pending",
        tenantName: tenantProfile.name,
        tenantEmail: tenantProfile.email,
        house: tenantProfile.house,
      };

      // Add to local complaints
      setComplaints([newComplaint, ...complaints]);

      // Save to localStorage so house owner can see it
      const existingComplaints = JSON.parse(
        localStorage.getItem("tenantComplaints") || "[]",
      );
      localStorage.setItem(
        "tenantComplaints",
        JSON.stringify([newComplaint, ...existingComplaints]),
      );

      setComplaintForm({ type: "Maintenance", description: "" });
      setShowComplaintForm(false);
      alert("Complaint submitted successfully! House owner will be notified.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
      case "Active":
      case "Resolved":
        return "bg-green-500/20 text-green-400";
      case "Pending":
      case "In Progress":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-page min-h-screen text-white">
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
                onClick={() => setActiveTab("profile")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "profile"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUser /> <span>My Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("maintenance")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "maintenance"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaTools /> <span>Maintenance Payments</span>
              </button>
              <button
                onClick={() => setActiveTab("complaints")}
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
                        onClick={() => setEditProfile(true)}
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
                            defaultValue={tenantProfile.name}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            defaultValue={tenantProfile.email}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            defaultValue={tenantProfile.phone}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Occupation
                          </label>
                          <input
                            type="text"
                            defaultValue={tenantProfile.occupation}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Emergency Contact
                          </label>
                          <input
                            type="tel"
                            defaultValue={tenantProfile.emergencyContact}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex space-x-4 pt-4">
                          <button
                            onClick={() => setEditProfile(false)}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Current Month</p>
                  <p className="text-3xl font-bold text-green-400">₹5,000</p>
                  <p className="text-gray-400 text-sm mt-2">Due: 10th March</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Total Paid</p>
                  <p className="text-3xl font-bold text-blue-400">₹20,000</p>
                  <p className="text-gray-400 text-sm mt-2">4 months</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <p className="text-gray-400 text-sm mb-2">Status</p>
                  <p className="text-3xl font-bold text-yellow-400">Pending</p>
                  <p className="text-gray-400 text-sm mt-2">Pay Now</p>
                </div>
              </div>

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
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition text-lg">
                  Make Payment Now
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
      </div>
    </>
  );
}

export default TenantDashboard;
