import { Link, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Footer from "../../components/footer";

function pageContent(pageKey) {
  const map = {
    about: {
      title: "About SocSys",
      description:
        "SocSys helps communities handle homes, tenants, maintenance, complaints, and communication in one place.",
      body: "Built for admins, owners, tenants, and buyers, the platform combines operations, transparency, and accountability across every role.",
      sections: [
        {
          heading: "What We Solve",
          points: [
            "Fragmented property operations across spreadsheets and chat threads.",
            "Delayed complaint handling and poor owner-tenant visibility.",
            "No shared source of truth for billing and listing activity.",
          ],
        },
        {
          heading: "Core Principles",
          points: [
            "Role-based workflows with clear ownership of actions.",
            "Fast updates with practical dashboards over complex menus.",
            "Audit-friendly records for complaints, offers, and payments.",
          ],
        },
      ],
    },
    features: {
      title: "Platform Features",
      description:
        "Everything required to run society operations and property workflows.",
      body: "From complaint lifecycles to marketplace offers, features are designed for daily execution and quick decision-making.",
      sections: [
        {
          heading: "Operations",
          points: [
            "House, owner, and tenant records with role-specific access.",
            "Maintenance bill generation and payment tracking.",
            "Centralized complaint review with live status updates.",
          ],
        },
        {
          heading: "Marketplace",
          points: [
            "Owner sale listings with image support.",
            "Buyer rental and purchase offers delivered to owner alerts.",
            "Contact-first browsing with filters and price sorting.",
          ],
        },
      ],
    },
    pricing: {
      title: "Pricing",
      description: "Simple plans for small and large communities.",
      body: "Choose a plan based on unit count, support depth, and workflow complexity.",
      sections: [
        {
          heading: "Starter",
          points: [
            "Up to 75 units",
            "Core dashboards and complaint workflow",
            "Email support during business hours",
          ],
        },
        {
          heading: "Growth",
          points: [
            "76-300 units",
            "Advanced billing and marketplace usage",
            "Priority support and onboarding sessions",
          ],
        },
        {
          heading: "Enterprise",
          points: [
            "300+ units or multi-society groups",
            "Custom integrations and deployment support",
            "Dedicated success and migration assistance",
          ],
        },
      ],
    },
    blog: {
      title: "Blog",
      description:
        "Guides, release updates, and best practices for modern community management.",
      body: "Practical walkthroughs and release notes to help teams improve day-to-day execution.",
      sections: [
        {
          heading: "Popular Topics",
          points: [
            "Reducing complaint turnaround time in busy societies.",
            "Building transparent maintenance billing cycles.",
            "Improving owner response rates on tenant requests.",
          ],
        },
      ],
    },
    "help-center": {
      title: "Help Center",
      description:
        "Find walkthroughs and troubleshooting help for all dashboard flows.",
      body: "Use this center to quickly resolve account, payment, complaint, and listing issues.",
      sections: [
        {
          heading: "Quick Troubleshooting",
          points: [
            "Unable to open dashboard: verify role selected at login.",
            "Missing profile details: refresh and confirm linked email mapping.",
            "Complaint not updating: check status transitions and review permissions.",
          ],
        },
      ],
    },
    documentation: {
      title: "Documentation",
      description: "Technical and product documentation for setup and usage.",
      body: "Reference docs for role flows, backend endpoints, and dashboard state behavior.",
      sections: [
        {
          heading: "Docs Index",
          points: [
            "Authentication and role authorization flow",
            "Admin, owner, tenant, and buyer dashboard actions",
            "API contract patterns for create, update, and review endpoints",
          ],
        },
      ],
    },
    "contact-support": {
      title: "Contact Support",
      description: "Need direct assistance? Reach our support team.",
      body: "Share your issue with context and role details so we can resolve it faster.",
      sections: [
        {
          heading: "Support Channels",
          points: [
            "Email: support@societymanagement.com",
            "Phone: +1 (555) 123-4567",
            "Hours: Mon-Fri, 9:00 AM to 6:00 PM",
          ],
        },
      ],
    },
    faqs: {
      title: "Frequently Asked Questions",
      description:
        "Quick answers for common account, profile, and dashboard questions.",
      body: "Common questions collected from admins, owners, tenants, and buyers.",
      sections: [
        {
          heading: "FAQ",
          points: [
            "How do I switch roles after login? Use the role picker and re-authorize your account.",
            "Why is a review button disabled? The action may require your exact role identity headers.",
            "Can owners see all complaints? Owners can review notifications surfaced to their flow.",
            "Where can I track maintenance history? Tenant and admin dashboards both show bill history.",
          ],
        },
      ],
    },
    status: {
      title: "System Status",
      description: "Current service health and operational status.",
      body: "Status updates for platform components and scheduled maintenance windows.",
      sections: [
        {
          heading: "Live Components",
          points: [
            "Authentication: Operational",
            "Dashboard API: Operational",
            "Listings and Offers: Operational",
            "Complaint Processing: Operational",
          ],
        },
      ],
    },
    "privacy-policy": {
      title: "Privacy Policy",
      description:
        "How SocSys collects, stores, and processes user information.",
      body: "We collect only the data required to deliver account access and platform workflows.",
      sections: [
        {
          heading: "Data Handling",
          points: [
            "Profile and role data is used for permission-aware dashboard access.",
            "Operational records are stored to maintain action history and traceability.",
            "Support interactions may be logged for quality and issue resolution.",
          ],
        },
      ],
    },
    "terms-of-service": {
      title: "Terms of Service",
      description: "Rules and terms for using the SocSys platform.",
      body: "By using SocSys, users agree to maintain accurate account information and follow acceptable usage practices.",
      sections: [
        {
          heading: "Usage Terms",
          points: [
            "Users must provide true and current profile information.",
            "Actions performed on dashboards are considered accountable records.",
            "Abuse, unauthorized access, or data tampering may suspend access.",
          ],
        },
      ],
    },
    "cookie-policy": {
      title: "Cookie Policy",
      description: "How browser storage and cookies are used in SocSys.",
      body: "SocSys uses browser storage for session continuity and dashboard preferences.",
      sections: [
        {
          heading: "Storage Usage",
          points: [
            "Session and role context for dashboard access control.",
            "Temporary UI preferences such as tab and form state.",
            "No third-party tracking cookies are required for core usage.",
          ],
        },
      ],
    },
  };

  return (
    map[pageKey] || {
      title: "SocSys Information",
      description: "Requested page could not be found.",
      body: "Please use the footer links to navigate to an available page.",
      sections: [],
    }
  );
}

function InfoPage({ pageKey }) {
  const content = pageContent(pageKey);
  const navigate = useNavigate();

  const homePath = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("socsysUser") || "{}");
      const role = String(user.role || "")
        .trim()
        .toLowerCase();
      if (role === "admin") return "/dashboard/admin";
      if (role === "owner") return "/dashboard/owner";
      if (role === "tenant") return "/dashboard/tenant";
      if (role === "buyer") return "/dashboard/user";
      return "/";
    } catch {
      return "/";
    }
  })();

  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="min-h-screen bg-gray-950 text-white px-6 py-16"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Back
            </button>
            <Link
              to={homePath}
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Home
            </Link>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="text-blue-400 text-sm font-semibold uppercase tracking-[0.2em] mb-3"
          >
            SocSys
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            {content.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.14 }}
            className="text-blue-100 text-lg mb-6"
          >
            {content.description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8"
          >
            <p className="text-gray-200 leading-relaxed">{content.body}</p>
          </motion.div>

          {Array.isArray(content.sections) && content.sections.length > 0 && (
            <div className="space-y-4 mb-8">
              {content.sections.map((section, index) => (
                <motion.section
                  key={section.heading}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + index * 0.06 }}
                  className="bg-gray-900/70 border border-gray-700 rounded-xl p-6"
                >
                  <h2 className="text-xl font-semibold mb-3 text-blue-300">
                    {section.heading}
                  </h2>
                  <ul className="space-y-2 text-gray-200 list-disc list-inside">
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </motion.section>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              to={homePath}
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Go to Home
            </Link>
            <Link
              to="/dashboard/user"
              className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Go to User Dashboard
            </Link>
          </div>
        </div>
      </motion.main>
      <Footer />
    </>
  );
}

export default InfoPage;
