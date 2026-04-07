import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

function Footer() {
  const currentYear = new Date().getFullYear();
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

  const quickLinks = [
    { label: "Home", to: homePath },
    { label: "About Us", to: "/about" },
    { label: "Features", to: "/features" },
    { label: "Pricing", to: "/pricing" },
    { label: "Blog", to: "/blog" },
  ];
  const supportLinks = [
    { label: "Help Center", to: "/help-center" },
    { label: "Documentation", to: "/documentation" },
    { label: "Contact Support", to: "/contact-support" },
    { label: "FAQs", to: "/faqs" },
    { label: "Status Page", to: "/status" },
  ];
  const legalLinks = [
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms of Service", to: "/terms-of-service" },
    { label: "Cookie Policy", to: "/cookie-policy" },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="bg-gray-900 text-white pt-16 pb-8 border-t border-gray-700"
    >
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Society Management
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering communities with smart management solutions. Built to
              make society administration simple and efficient.
            </p>
            <div className="flex space-x-4 pt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-blue-400 transition text-xl"
              >
                <FaFacebook />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-blue-400 transition text-xl"
              >
                <FaTwitter />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-blue-400 transition text-xl"
              >
                <FaInstagram />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-blue-400 transition text-xl"
              >
                <FaLinkedin />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <h4 className="text-lg font-semibold mb-6 text-white">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.to}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link
                      to={item.to}
                      className="text-gray-400 hover:text-blue-400 transition text-sm"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold mb-6 text-white">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((item) => (
                <li key={item.to}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link
                      to={item.to}
                      className="text-gray-400 hover:text-blue-400 transition text-sm"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <h4 className="text-lg font-semibold mb-6 text-white">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <FaPhone className="text-blue-400 mt-1" />
                <div>
                  <p className="text-gray-400 text-sm">+1 (555) 123-4567</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <FaEnvelope className="text-blue-400 mt-1" />
                <div>
                  <p className="text-gray-400 text-sm break-all">
                    support@societymanagement.com
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <FaMapMarkerAlt className="text-blue-400 mt-1" />
                <div>
                  <p className="text-gray-400 text-sm">
                    123 Community St, City, State 12345
                  </p>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <p className="text-gray-400 text-sm text-center md:text-left">
            &copy; {currentYear} Society Management. Crafted with clean commits
            by Megh Patel and Parixit Chauhan.
          </p>

          {/* Legal Links */}
          <div className="flex space-x-6">
            {legalLinks.map((item) => (
              <motion.div
                key={item.to}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  to={item.to}
                  className="text-gray-400 hover:text-blue-400 transition text-sm"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;
