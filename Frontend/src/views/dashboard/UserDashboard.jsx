import { useState, useMemo, useEffect } from "react";
import {
  FaHome,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaUser,
  FaUsers,
  FaPhone,
  FaEnvelope,
  FaFilter,
  FaSort,
  FaPlus,
} from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Footer from "../../components/footer";
import Navbar from "../../components/navbar";

function UserDashboard() {
  const [activeTab, setActiveTab] = useState("sale");
  const tabIds = ["sale", "rent", "contact", "online"];
  const [currentUserName, setCurrentUserName] = useState("User");
  const [currentUserId, setCurrentUserId] = useState("N/A");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [sortBy, setSortBy] = useState("none");
  const [selectedFilters, setSelectedFilters] = useState({
    bhk: [],
    priceRange: "all",
    location: [],
  });
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [reviewHouse, setReviewHouse] = useState(null);
  const [toast, setToast] = useState({ text: "", type: "" });
  const [offerForm, setOfferForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    offerType: "rent",
    offerAmount: "",
    description: "",
  });
  // Houses for sale loaded from API
  const [housesForSale, setHousesForSale] = useState([]);

  // Houses for rent loaded from API
  const [housesForRent, setHousesForRent] = useState([]);
  const [onlineOwners, setOnlineOwners] = useState([]);

  const housesForSaleList = useMemo(() => housesForSale, [housesForSale]);

  const ownerContacts = useMemo(() => {
    const byKey = new Map();

    const allListings = [
      ...housesForSaleList.map((house) => ({ ...house, listingType: "Sale" })),
      ...housesForRent.map((house) => ({ ...house, listingType: "Rent" })),
    ];

    allListings.forEach((house) => {
      const key = `${house.owner}|${house.email}|${house.phone}`;
      const propertyInfo = `${house.listingType}: ${house.title}, ${house.address}`;

      if (!byKey.has(key)) {
        byKey.set(key, {
          name: house.owner,
          email: house.email,
          phone: house.phone,
          properties: [propertyInfo],
        });
        return;
      }

      const contact = byKey.get(key);
      if (!contact.properties.includes(propertyInfo)) {
        contact.properties.push(propertyInfo);
      }
    });

    return Array.from(byKey.values());
  }, [housesForSaleList, housesForRent]);

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
      if (selectedFilters.priceRange === "medium")
        return price >= 2500000 && price <= 5000000;
      if (selectedFilters.priceRange === "high") return price > 5000000;
    } else {
      if (selectedFilters.priceRange === "low") return price < 20000;
      if (selectedFilters.priceRange === "medium")
        return price >= 20000 && price <= 40000;
      if (selectedFilters.priceRange === "high") return price > 40000;
    }
    return true;
  };

  const filteredAndSortedHouses = useMemo(() => {
    let houses = activeTab === "sale" ? housesForSaleList : housesForRent;

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
  }, [activeTab, selectedFilters, sortBy, housesForSaleList, housesForRent]);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearFilters();
    window.location.hash = tab;
  };

  const navbarLinks = [
    { label: "For Sale", path: "/dashboard/user#sale" },
    { label: "For Rent", path: "/dashboard/user#rent" },
    { label: "Contact", path: "/dashboard/user#contact" },
    { label: "Online", path: "/dashboard/user#online" },
  ];

  useEffect(() => {
    const API = "/express";

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("socsysUser") || "{}",
      );
      const fallbackName = String(currentUser.email || "user")
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .trim();
      const displayName =
        currentUser.fullName ||
        currentUser.name ||
        currentUser.username ||
        (fallbackName
          ? fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1)
          : "User");
      setCurrentUserName(displayName);
      setCurrentUserId(
        String(currentUser.accountId || currentUser.id || "N/A"),
      );
      setCurrentUserEmail(
        String(currentUser.email || currentUser.linkedEmail || ""),
      );
    } catch {
      setCurrentUserName("User");
      setCurrentUserId("N/A");
      setCurrentUserEmail("");
    }

    Promise.all([
      fetch(`${API}/api/user/houses-for-sale`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status),
      ),
      fetch(`${API}/api/user/houses-for-rent`).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status),
      ),
    ])
      .then(([saleData, rentData]) => {
        if (saleData.houses) setHousesForSale(saleData.houses);
        if (rentData.houses) setHousesForRent(rentData.houses);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const emailList = Array.from(
      new Set(
        ownerContacts
          .map((owner) =>
            String(owner.email || "")
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean),
      ),
    );

    if (!emailList.length) {
      setOnlineOwners([]);
      return;
    }

    const query = encodeURIComponent(emailList.join(","));
    fetch(`/express/api/user/online-status?emails=${query}`)
      .then((response) =>
        response.ok ? response.json() : Promise.reject(response.status),
      )
      .then((payload) => {
        const rows = Array.isArray(payload.users) ? payload.users : [];
        const byEmail = new Map(
          rows.map((user) => [String(user.email || "").toLowerCase(), user]),
        );

        setOnlineOwners(
          ownerContacts.map((owner) => {
            const normalizedEmail = String(owner.email || "").toLowerCase();
            const matched = byEmail.get(normalizedEmail);
            return {
              ...owner,
              accountId: matched?.accountId ?? "N/A",
              isOnline: Boolean(matched?.isOnline),
            };
          }),
        );
      })
      .catch(() => {
        setOnlineOwners(
          ownerContacts.map((owner) => ({
            ...owner,
            accountId: "N/A",
            isOnline: false,
          })),
        );
      });
  }, [ownerContacts]);

  useEffect(() => {
    const syncTabFromHash = () => {
      const hashTab = window.location.hash.replace("#", "");
      if (tabIds.includes(hashTab)) {
        setActiveTab(hashTab);
        clearFilters();
      }
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  useEffect(() => {
    if (!toast.text) {
      return;
    }

    const timer = setTimeout(() => {
      setToast({ text: "", type: "" });
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  const formatPrice = (price) => {
    if (activeTab === "sale") {
      return `₹${(price / 100000).toFixed(1)}L`;
    }
    return `₹${price.toLocaleString()}/month`;
  };

  const onlineOwnersCount = onlineOwners.filter(
    (owner) => owner.isOnline,
  ).length;

  const handleSubmitOffer = async () => {
    if (
      offerForm.fullName &&
      offerForm.email &&
      offerForm.phone &&
      offerForm.offerAmount &&
      offerForm.description
    ) {
      try {
        const response = await fetch("/express/api/user/property-offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingType: activeTab === "sale" ? "sale" : "rent",
            houseName: selectedHouse.title,
            houseAddress: selectedHouse.address,
            ownerName: selectedHouse.owner,
            ownerEmail: selectedHouse.email,
            ownerPhone: selectedHouse.phone,
            buyerName: offerForm.fullName,
            buyerEmail: offerForm.email,
            buyerPhone: offerForm.phone,
            offerType: activeTab === "sale" ? "Buy" : "Rent",
            offerAmount: Number(offerForm.offerAmount),
            description: offerForm.description,
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || "Failed to submit offer");
        }

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
        setToast({
          text: "Offer submitted successfully. House owner has been notified.",
          type: "success",
        });
      } catch (error) {
        setToast({
          text: error.message || "Failed to submit offer",
          type: "error",
        });
      }
    } else {
      setToast({ text: "Please fill in all fields", type: "error" });
    }
  };

  return (
    <>
      <Navbar links={navbarLinks} sectionLabel="Market" />
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
            <p className="dashboard-eyebrow">Marketplace Explorer</p>
            <div className="dashboard-hero-row">
              <div>
                <h1 className="text-4xl font-bold">Property Dashboard</h1>
                <p className="text-blue-100 mt-2">
                  Find your perfect home with smarter filtering
                </p>
                <p className="text-blue-200/90 mt-1 text-sm">
                  Welcome, {currentUserName}
                </p>
                <p className="text-blue-200/80 mt-1 text-sm">
                  ID: {currentUserId}
                  {currentUserEmail ? ` • ${currentUserEmail}` : ""}
                </p>
              </div>
              <div className="dashboard-kpis">
                <article className="dashboard-kpi">
                  <span>For Sale</span>
                  <strong>{housesForSaleList.length}</strong>
                </article>
                <article className="dashboard-kpi">
                  <span>For Rent</span>
                  <strong>{housesForRent.length}</strong>
                </article>
                <article className="dashboard-kpi">
                  <span>
                    {activeTab === "online"
                      ? "Owners Online"
                      : activeTab === "contact"
                        ? "Owner Contacts"
                        : "Current Results"}
                  </span>
                  <strong>
                    {activeTab === "online"
                      ? onlineOwnersCount
                      : activeTab === "contact"
                        ? ownerContacts.length
                        : filteredAndSortedHouses.length}
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
                onClick={() => handleTabChange("sale")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "sale"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaHome /> <span>Houses for Sale</span>
              </button>
              <button
                onClick={() => handleTabChange("rent")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "rent"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaHome /> <span>Houses for Rent</span>
              </button>
              <button
                onClick={() => handleTabChange("contact")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "contact"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaPhone /> <span>Contact Owners</span>
              </button>
              <button
                onClick={() => handleTabChange("online")}
                className={`dashboard-tab py-4 px-2 font-semibold transition-all border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "online"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUsers /> <span>Online Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-content max-w-7xl mx-auto px-6 py-8">
          {activeTab === "online" ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-2xl font-bold">Owner Online Status</h2>
                <p className="text-gray-400 text-sm">
                  Online now:{" "}
                  <span className="text-green-400 font-semibold">
                    {onlineOwnersCount}
                  </span>
                  {" / "}
                  <span className="text-blue-400 font-semibold">
                    {onlineOwners.length}
                  </span>
                </p>
              </div>

              {onlineOwners.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {onlineOwners.map((owner, index) => (
                    <div
                      key={`${owner.email}-${owner.phone}-${index}`}
                      className={`bg-gray-800 border rounded-xl p-5 space-y-4 transition ${
                        owner.isOnline
                          ? "border-green-500/60"
                          : "border-gray-700 hover:border-blue-500"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold">{owner.name}</h3>
                          <p className="text-xs text-gray-400">
                            Owner ID: {owner.accountId}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            owner.isOnline
                              ? "bg-green-500/20 text-green-300"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {owner.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-gray-300 break-all">
                          <FaEnvelope className="text-blue-400" />
                          <span>{owner.email}</span>
                        </p>
                        <p className="flex items-center gap-2 text-gray-300">
                          <FaPhone className="text-blue-400" />
                          <span>{owner.phone}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                  <FaUsers className="text-5xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">
                    No owner presence data available right now.
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === "contact" ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-2xl font-bold">Owner Contact Page</h2>
                <p className="text-gray-400 text-sm">
                  Available owners:{" "}
                  <span className="text-blue-400 font-semibold">
                    {ownerContacts.length}
                  </span>
                </p>
              </div>

              {ownerContacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {ownerContacts.map((owner, index) => (
                    <div
                      key={`${owner.email}-${owner.phone}-${index}`}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4 hover:border-blue-500 transition"
                    >
                      <div>
                        <h3 className="text-lg font-bold">{owner.name}</h3>
                        <p className="text-xs text-gray-400">Property Owner</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-gray-300">
                          <FaPhone className="text-blue-400" />
                          <span>{owner.phone}</span>
                        </p>
                        <p className="flex items-center gap-2 text-gray-300 break-all">
                          <FaEnvelope className="text-blue-400" />
                          <span>{owner.email}</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          Listings
                        </p>
                        <ul className="space-y-1 text-sm text-gray-300">
                          {owner.properties.slice(0, 3).map((property) => (
                            <li
                              key={property}
                              className="flex items-start gap-2"
                            >
                              <FaHome
                                className="text-blue-400 mt-1"
                                size={12}
                              />
                              <span>{property}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <a
                          href={`tel:${owner.phone}`}
                          className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition text-center"
                        >
                          Call
                        </a>
                        <a
                          href={`mailto:${owner.email}`}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition text-center"
                        >
                          Email
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                  <FaPhone className="text-5xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">
                    No owner contacts available right now.
                  </p>
                </div>
              )}
            </div>
          ) : (
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
                    <h4 className="font-semibold text-blue-400 mb-3">
                      Property Type
                    </h4>
                    <div className="space-y-2">
                      {filterOptions.bhk.map((bhk) => (
                        <label
                          key={bhk}
                          className="flex items-center space-x-3 cursor-pointer hover:text-green-400 transition"
                        >
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
                    <h4 className="font-semibold text-blue-400 mb-3">
                      Price Range
                    </h4>
                    <div className="space-y-2">
                      {filterOptions.priceRange.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center space-x-3 cursor-pointer hover:text-green-400 transition"
                        >
                          <input
                            type="radio"
                            name="priceRange"
                            value={option.value}
                            checked={
                              selectedFilters.priceRange === option.value
                            }
                            onChange={() =>
                              handlePriceRangeChange(option.value)
                            }
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
                    Showing{" "}
                    <span className="font-bold text-white">
                      {filteredAndSortedHouses.length}
                    </span>{" "}
                    properties
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
                        <div className="h-48 bg-blue-500 flex items-center justify-center overflow-hidden group-hover:scale-105 transition">
                          {typeof house.image === "string" &&
                          house.image.startsWith("data:image") ? (
                            <img
                              src={house.image}
                              alt={house.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-6xl">
                              {house.image || "🏠"}
                            </span>
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-2">
                            {house.title}
                          </h3>

                          {/* Location */}
                          <div className="flex items-center text-gray-400 mb-4">
                            <FaMapMarkerAlt className="mr-2 text-green-400" />
                            <span className="text-sm">{house.address}</span>
                          </div>

                          {/* Property Details */}
                          <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-700">
                            <div>
                              <p className="text-gray-400 text-xs mb-1">
                                Property Type
                              </p>
                              <p className="font-semibold text-blue-400">
                                {house.bhk}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Area</p>
                              <p className="font-semibold">
                                {house.area} sq.ft
                              </p>
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
                              <span className="break-all text-xs">
                                {house.email}
                              </span>
                            </div>
                          </div>

                          {/* Price and Action */}
                          <div className="flex flex-col space-y-3 pt-4 border-t border-gray-700">
                            <div>
                              <p className="text-gray-400 text-xs mb-1">
                                {activeTab === "sale" ? "Price" : "Rent"}
                              </p>
                              <p className="text-2xl font-bold text-blue-400">
                                {formatPrice(house.price)}
                              </p>
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
                              <button
                                onClick={() => setReviewHouse(house)}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                              >
                                Review
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
                    <p className="text-gray-400 text-lg">
                      No properties found matching your filters.
                    </p>
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
          )}
        </div>

        {reviewHouse && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-xl w-full">
              <div className="bg-gray-900 border-b border-gray-700 p-5 flex items-center justify-between">
                <h3 className="text-xl font-bold">Property Review</h3>
                <button
                  type="button"
                  onClick={() => setReviewHouse(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-3 text-sm">
                <p>
                  <span className="text-gray-400">Title:</span>{" "}
                  <span className="font-semibold">{reviewHouse.title}</span>
                </p>
                <p>
                  <span className="text-gray-400">Address:</span>{" "}
                  <span>{reviewHouse.address}</span>
                </p>
                <p>
                  <span className="text-gray-400">Type:</span>{" "}
                  <span>{reviewHouse.bhk}</span>
                </p>
                <p>
                  <span className="text-gray-400">Area:</span>{" "}
                  <span>{reviewHouse.area} sq.ft</span>
                </p>
                <p>
                  <span className="text-gray-400">
                    {activeTab === "sale" ? "Price" : "Rent"}:
                  </span>{" "}
                  <span className="text-blue-400 font-semibold">
                    {formatPrice(reviewHouse.price)}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Owner:</span>{" "}
                  <span>{reviewHouse.owner}</span>
                </p>
                <p className="text-gray-400">
                  {reviewHouse.description || "No extra description available."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHouse(reviewHouse);
                      setReviewHouse(null);
                      setShowOfferForm(true);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition"
                  >
                    Make Offer
                  </button>
                  <a
                    href={`tel:${reviewHouse.phone}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition text-center"
                  >
                    Call Owner
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewHouse(null);
                      handleTabChange("contact");
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
                  >
                    Contact List
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <h3 className="font-semibold text-lg mb-2">
                    {selectedHouse.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {selectedHouse.address}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Owner:{" "}
                    <span className="text-blue-400">{selectedHouse.owner}</span>
                  </p>
                </div>

                {/* Form Fields */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={offerForm.fullName}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, fullName: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={offerForm.email}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, email: e.target.value })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Your email"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={offerForm.phone}
                      onChange={(e) =>
                        setOfferForm({ ...offerForm, phone: e.target.value })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    {activeTab === "sale"
                      ? "Offer Price"
                      : "Monthly Rent Offer"}
                  </label>
                  <input
                    type="number"
                    value={offerForm.offerAmount}
                    onChange={(e) =>
                      setOfferForm({
                        ...offerForm,
                        offerAmount: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder={
                      activeTab === "sale"
                        ? "Enter offer price"
                        : "Enter monthly rent offer"
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Description / Message
                  </label>
                  <textarea
                    value={offerForm.description}
                    onChange={(e) =>
                      setOfferForm({
                        ...offerForm,
                        description: e.target.value,
                      })
                    }
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
      </motion.div>
      <Footer />
    </>
  );
}

export default UserDashboard;
