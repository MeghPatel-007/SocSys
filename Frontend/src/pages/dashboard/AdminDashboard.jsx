import { useState } from "react";
import { FaHome, FaUsers, FaClipboard, FaTools, FaBell, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import Footer from "../../components/footer";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("houses");

  // Sample data for houses
  const [houses] = useState([
    { id: 1, address: "123 Main St", type: "Apartment", units: 4, status: "Occupied" },
    { id: 2, address: "456 Oak Ave", type: "Villa", units: 1, status: "Occupied" },
    { id: 3, address: "789 Pine Rd", type: "Apartment", units: 3, status: "Vacant" },
    { id: 4, address: "321 Elm St", type: "Townhouse", units: 2, status: "Occupied" },
  ]);

  // Sample data for house owners
  const [owners] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", phone: "555-0101", properties: ["123 Main St"] },
    { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "555-0102", properties: ["456 Oak Ave", "789 Pine Rd"] },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", phone: "555-0103", properties: ["321 Elm St"] },
  ]);

  // Sample data for tenants
  const [tenants] = useState([
    { id: 1, name: "Alice Brown", email: "alice@example.com", phone: "555-0201", house: "123 Main St", moveInDate: "2023-01-15", status: "Active" },
    { id: 2, name: "Charlie Davis", email: "charlie@example.com", phone: "555-0202", house: "456 Oak Ave", moveInDate: "2023-06-20", status: "Active" },
    { id: 3, name: "Eva Wilson", email: "eva@example.com", phone: "555-0203", house: "321 Elm St", moveInDate: "2024-02-10", status: "Active" },
    { id: 4, name: "Frank Miller", email: "frank@example.com", phone: "555-0204", house: "123 Main St", moveInDate: "2024-01-05", status: "Active" },
  ]);

  // Sample data for complaints
  const [complaints] = useState([
    { id: 1, complainant: "Alice Brown", type: "Maintenance", house: "123 Main St", description: "Leaky faucet in kitchen", status: "Pending", date: "2024-03-08" },
    { id: 2, complainant: "John Doe", type: "Noise", house: "456 Oak Ave", description: "Noise from neighbors", status: "Resolved", date: "2024-03-05" },
    { id: 3, complainant: "Charlie Davis", type: "Utilities", house: "456 Oak Ave", description: "High water bill", status: "In Progress", date: "2024-03-09" },
    { id: 4, complainant: "Eva Wilson", type: "Maintenance", house: "321 Elm St", description: "AC not working", status: "Pending", date: "2024-03-10" },
  ]);

  // Sample data for maintenance bills
  const [maintenanceBills] = useState([
    { id: 1, house: "123 Main St", amount: 5000, dueDate: "2024-03-15", status: "Paid", paidDate: "2024-03-10", paymentMethod: "UPI" },
    { id: 2, house: "456 Oak Ave", amount: 7500, dueDate: "2024-03-20", status: "Paid", paidDate: "2024-03-18", paymentMethod: "Card" },
    { id: 3, house: "789 Pine Rd", amount: 4500, dueDate: "2024-03-25", status: "Pending", paidDate: null, paymentMethod: null },
    { id: 4, house: "321 Elm St", amount: 6000, dueDate: "2024-03-30", status: "Paid", paidDate: "2024-03-12", paymentMethod: "Cash" },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
      case "Active":
      case "Resolved":
        return "bg-green-500/20 text-green-300";
      case "Pending":
      case "In Progress":
        return "bg-yellow-500/20 text-yellow-300";
      case "Vacant":
        return "bg-blue-500/20 text-blue-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-blue-600 p-8 shadow-lg">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-blue-200 mt-2">Manage your society properties and residents</p>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 shadow-lg z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("houses")}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "houses"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaHome /> <span>Houses</span>
              </button>
              <button
                onClick={() => setActiveTab("owners")}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "owners"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUsers /> <span>House Owners</span>
              </button>
              <button
                onClick={() => setActiveTab("tenants")}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "tenants"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUsers /> <span>Tenants</span>
              </button>
              <button
                onClick={() => setActiveTab("complaints")}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "complaints"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaBell /> <span>Complaints</span>
              </button>
              <button
                onClick={() => setActiveTab("maintenance")}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "maintenance"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaTools /> <span>Maintenance Bills</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Houses Tab */}
          {activeTab === "houses" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">All Houses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {houses.map((house) => (
                  <div key={house.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition">
                    <div className="flex items-start justify-between mb-4">
                      <FaHome className="text-blue-400 text-2xl" />
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(house.status)}`}>
                        {house.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{house.address}</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p><strong>Type:</strong> {house.type}</p>
                      <p><strong>Units:</strong> {house.units}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House Owners Tab */}
          {activeTab === "owners" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">House Owners</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Name</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Email</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Phone</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Properties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {owners.map((owner) => (
                      <tr key={owner.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4">{owner.name}</td>
                        <td className="px-6 py-4 text-gray-400">{owner.email}</td>
                        <td className="px-6 py-4 text-gray-400">{owner.phone}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {owner.properties.map((prop, idx) => (
                              <div key={idx} className="text-sm text-blue-400">{prop}</div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === "tenants" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Tenants</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Name</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Email</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Phone</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">House</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Move-in Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4">{tenant.name}</td>
                        <td className="px-6 py-4 text-gray-400">{tenant.email}</td>
                        <td className="px-6 py-4 text-gray-400">{tenant.phone}</td>
                        <td className="px-6 py-4 text-blue-400">{tenant.house}</td>
                        <td className="px-6 py-4 text-gray-400">{tenant.moveInDate}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tenant.status)}`}>
                            {tenant.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Complaints Tab */}
          {activeTab === "complaints" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Complaints</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{complaint.complainant}</h3>
                        <p className="text-sm text-gray-400">{complaint.house}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Type:</strong> <span className="text-blue-400">{complaint.type}</span></p>
                      <p><strong>Description:</strong> <span className="text-gray-300">{complaint.description}</span></p>
                      <p><strong>Date:</strong> <span className="text-gray-400">{complaint.date}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance Bills Tab */}
          {activeTab === "maintenance" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Maintenance Bills</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">House</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Amount</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Due Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Paid Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceBills.map((bill) => (
                      <tr key={bill.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4 text-blue-400">{bill.house}</td>
                        <td className="px-6 py-4 font-semibold">₹{bill.amount}</td>
                        <td className="px-6 py-4 text-gray-400">{bill.dueDate}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center w-fit ${getStatusColor(bill.status)}`}>
                            {bill.status === "Paid" ? (
                              <>
                                <FaCheckCircle className="mr-2" /> {bill.status}
                              </>
                            ) : (
                              <>
                                <FaTimesCircle className="mr-2" /> {bill.status}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{bill.paidDate || "-"}</td>
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
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AdminDashboard;
