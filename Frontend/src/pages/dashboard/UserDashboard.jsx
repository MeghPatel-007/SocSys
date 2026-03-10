import { useState, useMemo } from "react";
import { FaHome, FaMapMarkerAlt, FaRulerCombined, FaUser, FaPhone, FaEnvelope, FaFilter, FaSort, FaPlus } from "react-icons/fa";
import Footer from "../../components/footer";

function UserDashboard() {
  const [activeTab, setActiveTab] = useState("sale");
  const [sortBy, setSortBy] = useState("none");
  const [selectedFilters, setSelectedFilters] = useState({
    bhk: [],
    priceRange: "all",
    location: [],
  });
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [offerForm, setOfferForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    offerType: "rent",
    offerAmount: "",
    description: "",
  });

  // Sample houses for sale
  const [housesForSale] = useState([
    { id: 1, title: "Luxury Apartment", address: "123 Main St", bhk: "3BHK", price: 5000000, area: 1500, owner: "John Doe", phone: "555-0101", email: "john@example.com", image: "🏢" },
    { id: 2, title: "Cozy Studio", address: "456 Oak Ave", bhk: "1BHK", price: 1500000, area: 600, owner: "Jane Smith", phone: "555-0102", email: "jane@example.com", image: "🏠" },
    { id: 3, title: "Modern Villa", address: "789 Pine Rd", bhk: "4BHK", price: 8000000, area: 2500, owner: "Bob Johnson", phone: "555-0103", email: "bob@example.com", image: "🏡" },
    { id: 4, title: "Spacious Flat", address: "321 Elm St", bhk: "2BHK", price: 3000000, area: 1000, owner: "Alice Brown", phone: "555-0104", email: "alice@example.com", image: "🏘️" },
    { id: 5, title: "Compact Apartment", address: "654 Maple Lane", bhk: "1BHK", price: 1800000, area: 700, owner: "Charlie Davis", phone: "555-0105", email: "charlie@example.com", image: "🏢" },
    { id: 6, title: "Premium Bungalow", address: "987 Birch St", bhk: "5BHK", price: 12000000, area: 3500, owner: "Eva Wilson", phone: "555-0106", email: "eva@example.com", image: "🏡" },
  ]);

  // Sample houses for rent
  const [housesForRent] = useState([
    { id: 1, title: "Downtown Apartment", address: "111 Center St", bhk: "2BHK", price: 25000, area: 1000, owner: "Frank Miller", phone: "555-0201", email: "frank@example.com", image: "🏢" },
    { id: 2, title: "Hill View Studio", address: "222 Hill Rd", bhk: "1BHK", price: 12000, area: 500, owner: "Grace Lee", phone: "555-0202", email: "grace@example.com", image: "🏠" },
    { id: 3, title: "Beachfront Villa", address: "333 Beach Ave", bhk: "3BHK", price: 40000, area: 1800, owner: "Henry Brown", phone: "555-0203", email: "henry@example.com", image: "🏡" },
    { id: 4, title: "Garden Apartment", address: "444 Garden St", bhk: "2BHK", price: 22000, area: 950, owner: "Iris Chen", phone: "555-0204", email: "iris@example.com", image: "🏘️" },
    { id: 5, title: "Minimalist Studio", address: "555 Modern Lane", bhk: "1BHK", price: 15000, area: 700, owner: "Jack Wilson", phone: "555-0205", email: "jack@example.com", image: "🏢" },
    { id: 6, title: "Luxury Penthouse", address: "666 Sky Tower", bhk: "4BHK", price: 60000, area: 2200, owner: "Kate Johnson", phone: "555-0206", email: "kate@example.com", image: "🏡" },
  ]);

  const filterOptions = {
    bhk: ["1BHK", "2BHK", "3BHK", "4BHK", "5BHK"],
    priceRange: [
      { label: "All Prices", value: "all" },
      ...(activeTab === "sale"
        ? [
            { label: "Below ₹25 Lakhs", value: "low" },
            { label: "₹25 - ₹50 Lakhs", value: "medium" },
            { label: "Above ₹50 Lakhs", value: "high" },
          ]
        : [
            { label: "Below ₹20,000", value: "low" },
            { label: "₹20,000 - ₹40,000", value: "medium" },
            { label: "Above ₹40,000", value: "high" },
          ]),
    ],
  };

  const filterByPrice = (house) => {
    if (selectedFilters.priceRange === "all") return true;
    const price = house.price;
    if (activeTab === "sale") {
      if (selectedFilters.priceRange === "low") return price < 2500000;
      if (selectedFilters.priceRange === "medium") return price >= 2500000 && price <= 5000000;
      if (selectedFilters.priceRange === "high") return price > 5000000;
    } else {
      if (selectedFilters.priceRange === "low") return price < 20000;
      if (selectedFilters.priceRange === "medium") return price >= 20000 && price <= 40000;
      if (selectedFilters.priceRange === "high") return price > 40000;
    }
    return true;
  };

  const filteredAndSortedHouses = useMemo(() => {
    let houses = activeTab === "sale" ? housesForSale : housesForRent;

    // Apply BHK filter
    if (selectedFilters.bhk.length > 0) {
      houses = houses.filter((h) => selectedFilters.bhk.includes(h.bhk));
    }

    // Apply price filter
    houses = houses.filter(filterByPrice);

    // Apply sorting
    if (sortBy !== "none") {
      houses = [...houses].sort((a, b) => {
        if (sortBy === "low-high") return a.price - b.price;
        if (sortBy === "high-low") return b.price - a.price;
        return 0;
      });
    }

    return houses;
  }, [activeTab, selectedFilters, sortBy, housesForSale, housesForRent]);

  const toggleBhkFilter = (bhk) => {
    setSelectedFilters((prev) => ({
      ...prev,
      bhk: prev.bhk.includes(bhk)
        ? prev.bhk.filter((b) => b !== bhk)
        : [...prev.bhk, bhk],
    }));
  };

  const handlePriceRangeChange = (value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      priceRange: value,
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      bhk: [],
      priceRange: "all",
      location: [],
    });
    setSortBy("none");
  };

  const formatPrice = (price) => {
    if (activeTab === "sale") {
      return `₹${(price / 100000).toFixed(1)}L`;
    }
    return `₹${price.toLocaleString()}/month`;
  };

  const handleSubmitOffer = () => {
    if (offerForm.fullName && offerForm.email && offerForm.phone && offerForm.offerAmount && offerForm.description) {
      const newOffer = {
        id: Date.now(),
        houseName: selectedHouse.title,
        houseAddress: selectedHouse.address,
        ownerName: selectedHouse.owner,
        ownerEmail: selectedHouse.email,
        ownerPhone: selectedHouse.phone,
        buyerName: offerForm.fullName,
        buyerEmail: offerForm.email,
        buyerPhone: offerForm.phone,
        offerType: activeTab === "sale" ? "Buy" : "Rent",
        offerAmount: offerForm.offerAmount,
        description: offerForm.description,
        date: new Date().toISOString().split('T')[0],
        status: "New",
      };

      // Save to localStorage
      const existingOffers = JSON.parse(localStorage.getItem('propertyOffers') || '[]');
      localStorage.setItem('propertyOffers', JSON.stringify([newOffer, ...existingOffers]));

      // Reset form
      setOfferForm({
        fullName: "",
        email: "",
        phone: "",
        offerType: "rent",
        offerAmount: "",
        description: "",
      });
      setShowOfferForm(false);
      setSelectedHouse(null);
      alert("Offer submitted successfully! House owner will be notified.");
    } else {
      alert("Please fill in all fields");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-blue-600 p-8 shadow-lg">
          <h1 className="text-4xl font-bold">Property Dashboard</h1>
          <p className="text-blue-100 mt-2">Find your perfect home</p>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 shadow-lg z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab("sale");
                  clearFilters();
                }}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "sale"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaHome /> <span>Houses for Sale</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("rent");
                  clearFilters();
                }}
                className={`py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "rent"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaHome /> <span>Houses for Rent</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-24">
                <div className="flex items-center space-x-2 mb-6">
                  <FaFilter className="text-blue-400" />
                  <h3 className="text-xl font-bold">Filters</h3>
                </div>

                {/* BHK Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-blue-400 mb-3">Property Type</h4>
                  <div className="space-y-2">
                    {filterOptions.bhk.map((bhk) => (
                      <label key={bhk} className="flex items-center space-x-3 cursor-pointer hover:text-green-400 transition">
                        <input
                          type="checkbox"
                          checked={selectedFilters.bhk.includes(bhk)}
                          onChange={() => toggleBhkFilter(bhk)}
                          className="w-4 h-4 rounded accent-blue-500"
                        />
                        <span className="text-gray-300">{bhk}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-blue-400 mb-3">Price Range</h4>
                  <div className="space-y-2">
                    {filterOptions.priceRange.map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer hover:text-green-400 transition">
                        <input
                          type="radio"
                          name="priceRange"
                          value={option.value}
                          checked={selectedFilters.priceRange === option.value}
                          onChange={() => handlePriceRangeChange(option.value)}
                          className="w-4 h-4 accent-blue-500"
                        />
                        <span className="text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={clearFilters}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Sort Options */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-400">
                  Showing <span className="font-bold text-white">{filteredAndSortedHouses.length}</span> properties
                </p>
                <div className="flex items-center space-x-3">
                  <FaSort className="text-blue-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="none">Sort by Price</option>
                    <option value="low-high">Low to High</option>
                    <option value="high-low">High to Low</option>
                  </select>
                </div>
              </div>

              {/* Properties Grid */}
              {filteredAndSortedHouses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredAndSortedHouses.map((house) => (
                    <div
                      key={house.id}
                      className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500 transition group"
                    >
                      {/* Image Section */}
                      <div className="h-48 bg-blue-500 flex items-center justify-center text-6xl group-hover:scale-105 transition">
                        {house.image}
                      </div>

                      {/* Content Section */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">{house.title}</h3>

                        {/* Location */}
                        <div className="flex items-center text-gray-400 mb-4">
                          <FaMapMarkerAlt className="mr-2 text-green-400" />
                          <span className="text-sm">{house.address}</span>
                        </div>

                        {/* Property Details */}
                        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-700">
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Property Type</p>
                            <p className="font-semibold text-blue-400">{house.bhk}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Area</p>
                            <p className="font-semibold">{house.area} sq.ft</p>
                          </div>
                        </div>

                        {/* Owner Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <FaUser className="text-blue-400" />
                            <span>{house.owner}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <FaPhone className="text-blue-400" />
                            <span>{house.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <FaEnvelope className="text-blue-400" />
                            <span className="break-all text-xs">{house.email}</span>
                          </div>
                        </div>

                        {/* Price and Action */}
                        <div className="flex flex-col space-y-3 pt-4 border-t border-gray-700">
                          <div>
                            <p className="text-gray-400 text-xs mb-1">
                              {activeTab === "sale" ? "Price" : "Rent"}
                            </p>
                            <p className="text-2xl font-bold text-blue-400">{formatPrice(house.price)}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                setSelectedHouse(house);
                                setShowOfferForm(true);
                              }}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center space-x-1"
                            >
                              <FaPlus size={14} /> <span>Offer</span>
                            </button>
                            <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                              Contact
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FaHome className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No properties found matching your filters.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Offer Form Modal */}
        {showOfferForm && selectedHouse && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Make an Offer</h2>
                <button
                  onClick={() => {
                    setShowOfferForm(false);
                    setSelectedHouse(null);
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Property Details */}
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-lg mb-2">{selectedHouse.title}</h3>
                  <p className="text-gray-400 text-sm">{selectedHouse.address}</p>
                  <p className="text-gray-400 text-sm mt-2">Owner: <span className="text-blue-400">{selectedHouse.owner}</span></p>
                </div>

                {/* Form Fields */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Full Name</label>
                  <input
                    type="text"
                    value={offerForm.fullName}
                    onChange={(e) => setOfferForm({ ...offerForm, fullName: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Email</label>
                    <input
                      type="email"
                      value={offerForm.email}
                      onChange={(e) => setOfferForm({ ...offerForm, email: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Your email"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Phone</label>
                    <input
                      type="tel"
                      value={offerForm.phone}
                      onChange={(e) => setOfferForm({ ...offerForm, phone: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    {activeTab === "sale" ? "Offer Price" : "Monthly Rent Offer"}
                  </label>
                  <input
                    type="number"
                    value={offerForm.offerAmount}
                    onChange={(e) => setOfferForm({ ...offerForm, offerAmount: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder={activeTab === "sale" ? "Enter offer price" : "Enter monthly rent offer"}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Description / Message</label>
                  <textarea
                    value={offerForm.description}
                    onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-32 resize-none"
                    placeholder="Explain why you're interested in this property and any relevant details..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={handleSubmitOffer}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition"
                  >
                    Submit Offer
                  </button>
                  <button
                    onClick={() => {
                      setShowOfferForm(false);
                      setSelectedHouse(null);
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default UserDashboard;
