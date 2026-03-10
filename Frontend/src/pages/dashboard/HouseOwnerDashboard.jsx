import { useState, useEffect } from "react";
import { FaHome, FaUsers, FaBell, FaUser, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaClock, FaEdit, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import Footer from "../../components/footer";

function HouseOwnerDashboard() {
  const [activeTab, setActiveTab] = useState("houses");
  const [editProfile, setEditProfile] = useState(false);

  // Refresh notifications when notifications tab is opened
  useEffect(() => {
    if (activeTab === "notifications") {
      // Reload notifications from localStorage
      const tenantComplaints = JSON.parse(localStorage.getItem('tenantComplaints') || '[]');
      const propertyOffers = JSON.parse(localStorage.getItem('propertyOffers') || '[]');
      
      const complaintNotifications = tenantComplaints.map((complaint) => ({
        id: `complaint-${complaint.id}`,
        type: "Complaint",
        from: complaint.tenantName,
        house: complaint.house,
        message: `[${complaint.type}] ${complaint.description}`,
        date: complaint.date,
        status: "New",
        tenantEmail: complaint.tenantEmail,
      }));

      const offerNotifications = propertyOffers.map((offer) => ({
        id: `offer-${offer.id}`,
        type: `${offer.offerType} Offer`,
        from: offer.buyerName,
        house: offer.houseAddress,
        message: `${offer.offerType === "Buy" ? `Offering ₹${offer.offerAmount}` : `Offering ₹${offer.offerAmount}/month`} - "${offer.description}"`,
        date: offer.date,
        status: "New",
        buyerEmail: offer.buyerEmail,
        buyerPhone: offer.buyerPhone,
      }));
      
      const originalNotifications = [
        { id: 1, type: "Rent Offer", from: "Eva Wilson", house: "456 Oak Ave", message: "Interested in renting. Offering ₹22,000/month", date: "2024-03-09", status: "New" },
        { id: 2, type: "Buy Offer", from: "Frank Miller", house: "123 Main St", message: "Offering ₹50,00,000 to purchase", date: "2024-03-08", status: "New" },
        { id: 3, type: "Rent Inquiry", from: "Grace Lee", house: "789 Pine Rd", message: "Wants to discuss rental terms", date: "2024-03-07", status: "Viewed" },
      ];
      
      setNotifications([...offerNotifications, ...complaintNotifications, ...originalNotifications]);
    }
  }, [activeTab]);

  // Sample house owner profile
  const [ownerProfile, setOwnerProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "555-0101",
    address: "123 Main St, City",
    totalProperties: 3,
    joinDate: "2020-05-15",
    bankAccount: "XXXX XXXX XXXX 1234",
  });

  // Sample houses data
  const [myHouses] = useState([
    { id: 1, address: "123 Main St", type: "3BHK", area: 1500, status: "Rented", tenant: "Alice Brown", rentAmount: 25000, rentDueDate: "2024-03-15" },
    { id: 2, address: "456 Oak Ave", type: "2BHK", area: 1000, status: "Vacant", tenant: null, rentAmount: null, rentDueDate: null },
    { id: 3, address: "789 Pine Rd", type: "4BHK", area: 2500, status: "Rented", tenant: "Charlie Davis", rentAmount: 35000, rentDueDate: "2024-03-20" },
  ]);

  // Sample tenants data
  const [myTenants] = useState([
    { id: 1, name: "Alice Brown", email: "alice@example.com", phone: "555-0201", house: "123 Main St", moveInDate: "2023-01-15", status: "Active" },
    { id: 2, name: "Charlie Davis", email: "charlie@example.com", phone: "555-0202", house: "789 Pine Rd", moveInDate: "2024-02-10", status: "Active" },
  ]);

  // Sample notifications
  const [notifications, setNotifications] = useState(() => {
    // Get tenant complaints from localStorage
    const tenantComplaints = JSON.parse(localStorage.getItem('tenantComplaints') || '[]');
    
    // Convert tenant complaints to notification format
    const complaintNotifications = tenantComplaints.map((complaint) => ({
      id: `complaint-${complaint.id}`,
      type: "Complaint",
      from: complaint.tenantName,
      house: complaint.house,
      message: `[${complaint.type}] ${complaint.description}`,
      date: complaint.date,
      status: "New",
      tenantEmail: complaint.tenantEmail,
    }));

    // Original notifications
    const originalNotifications = [
      { id: 1, type: "Rent Offer", from: "Eva Wilson", house: "456 Oak Ave", message: "Interested in renting. Offering ₹22,000/month", date: "2024-03-09", status: "New" },
      { id: 2, type: "Buy Offer", from: "Frank Miller", house: "123 Main St", message: "Offering ₹50,00,000 to purchase", date: "2024-03-08", status: "New" },
      { id: 3, type: "Rent Inquiry", from: "Grace Lee", house: "789 Pine Rd", message: "Wants to discuss rental terms", date: "2024-03-07", status: "Viewed" },
    ];

    return [...complaintNotifications, ...originalNotifications];
  });

  // Sample rent payments
  const [rentPayments] = useState([
    { id: 1, house: "123 Main St", tenant: "Alice Brown", amount: 25000, dueDate: "2024-03-15", status: "Paid", paidDate: "2024-03-14", method: "Bank Transfer" },
    { id: 2, house: "789 Pine Rd", tenant: "Charlie Davis", amount: 35000, dueDate: "2024-03-20", status: "Pending", paidDate: null, method: null },
    { id: 3, house: "123 Main St", tenant: "Alice Brown", amount: 25000, dueDate: "2024-02-15", status: "Paid", paidDate: "2024-02-14", method: "UPI" },
  ]);

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
  // Count new notifications
  const newNotificationCount = notifications.filter((n) => n.status === "New").length;
  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-blue-600 p-8 shadow-lg">
          <h1 className="text-4xl font-bold">House Owner Dashboard</h1>
          <p className="text-blue-100 mt-2">Manage your properties and tenants</p>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 shadow-lg z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("houses")}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "houses"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaHome /> <span>My Houses</span>
              </button>
              <button
                onClick={() => setActiveTab("tenants")}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "tenants"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUsers /> <span>Tenants</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap relative ${
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
                onClick={() => setActiveTab("rent")}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "rent"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaMoneyBillWave /> <span>Rent Payments</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
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
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* My Houses Tab */}
          {activeTab === "houses" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">My Houses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myHouses.map((house) => (
                  <div key={house.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition">
                    <div className="flex items-start justify-between mb-4">
                      <FaHome className="text-blue-400 text-2xl" />
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(house.status)}`}>
                        {house.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{house.address}</h3>
                    <div className="space-y-3 text-sm text-gray-400 mb-4 pb-4 border-b border-gray-700">
                      <p><strong>Type:</strong> {house.type}</p>
                      <p><strong>Area:</strong> {house.area} sq.ft</p>
                      {house.status === "Rented" && (
                        <>
                          <p><strong>Tenant:</strong> <span className="text-blue-400">{house.tenant}</span></p>
                          <p><strong>Rent Amount:</strong> <span className="text-green-400">₹{house.rentAmount.toLocaleString()}</span></p>
                          <p><strong>Next Due:</strong> {house.rentDueDate}</p>
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
              <h2 className="text-2xl font-bold mb-6">My Tenants</h2>
              {myTenants.length > 0 ? (
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
                      {myTenants.map((tenant) => (
                        <tr key={tenant.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition">
                          <td className="px-6 py-4">{tenant.name}</td>
                          <td className="px-6 py-4 text-gray-400 break-all text-sm">{tenant.email}</td>
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
                  <div key={notification.id} className={`border rounded-lg p-6 hover:border-opacity-100 transition ${
                    notification.type === "Complaint"
                      ? `border-red-500/50 ${notification.status === "New" ? "bg-red-500/10" : "bg-gray-800"}`
                      : notification.type.includes("Offer")
                      ? `border-green-500/50 ${notification.status === "New" ? "bg-green-500/10" : "bg-gray-800"}`
                      : `border-gray-700 ${notification.status === "New" ? "bg-blue-500/10" : "bg-gray-800"}`
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-white px-3 py-1 rounded-full text-xs font-semibold ${
                            notification.type === "Complaint" 
                              ? "bg-red-500"
                              : notification.type.includes("Offer")
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}>
                            {notification.type}
                          </span>
                          {notification.status === "New" && (
                            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              NEW
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-1">From: {notification.from}</h3>
                        <p className="text-gray-400 text-sm mb-3">Property: <span className="text-blue-400">{notification.house}</span></p>
                        <p className="text-gray-300">{notification.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm mb-4">{notification.date}</p>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm">
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
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">House</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Tenant</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Amount</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Due Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Paid Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-300">Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4 text-blue-400">{payment.house}</td>
                        <td className="px-6 py-4">{payment.tenant}</td>
                        <td className="px-6 py-4 font-semibold text-green-400">₹{payment.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-400">{payment.dueDate}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center w-fit ${getStatusColor(payment.status)}`}>
                            {payment.status === "Paid" ? (
                              <>
                                <FaCheckCircle className="mr-2" /> {payment.status}
                              </>
                            ) : (
                              <>
                                <FaClock className="mr-2" /> {payment.status}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{payment.paidDate || "-"}</td>
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
                        <h3 className="text-3xl font-bold mb-2">{ownerProfile.name}</h3>
                        <p className="text-gray-400">House Owner • Member since {ownerProfile.joinDate}</p>
                      </div>
                      <button
                        onClick={() => setEditProfile(true)}
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
                          <p className="text-gray-400 text-sm mb-1">Email Address</p>
                          <div className="flex items-center space-x-2">
                            <FaEnvelope className="text-blue-400" />
                            <p className="text-lg">{ownerProfile.email}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Phone Number</p>
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
                          <p className="text-gray-400 text-sm mb-1">Total Properties</p>
                          <p className="text-lg font-semibold text-blue-400">{ownerProfile.totalProperties} Properties</p>
                        </div>
                      </div>
                    </div>

                    {/* Banking Information */}
                    <div className="pt-8">
                      <h4 className="text-lg font-semibold mb-4">Banking Information</h4>
                      <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1">Bank Account</p>
                        <p className="text-lg font-mono">{ownerProfile.bankAccount}</p>
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
                          <label className="block text-gray-400 text-sm mb-2">Full Name</label>
                          <input
                            type="text"
                            defaultValue={ownerProfile.name}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Email</label>
                          <input
                            type="email"
                            defaultValue={ownerProfile.email}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Phone</label>
                          <input
                            type="tel"
                            defaultValue={ownerProfile.phone}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Address</label>
                          <input
                            type="text"
                            defaultValue={ownerProfile.address}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Bank Account</label>
                          <input
                            type="text"
                            defaultValue={ownerProfile.bankAccount}
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
        </div>
      </div>
      <Footer />
    </>
  );
}

export default HouseOwnerDashboard;
