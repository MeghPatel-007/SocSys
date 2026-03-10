import { useState } from "react";
import Footer from "../components/footer";
import { FaUser, FaLock, FaEnvelope, FaPhone } from "react-icons/fa";
import AdminDashboard from "./AdminDashboard";


function Login() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
    <div className="flex items-center justify-center min-h-screen bg-blue-600">
      <div className="bg-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl w-[420px] p-10 text-white border border-white/20">
        <h2 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-200 to-pink-200 bg-clip-text text-transparent">
          Society Management
        </h2>

        <p className="text-center text-white/70 mb-8 text-sm">
          Manage your community with ease
        </p>

        <div className="flex mb-8 bg-white/10 rounded-xl p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${isLogin ? "bg-white text-purple-600 shadow-lg" : "text-white/70 hover:text-white"}`}
          >
            Login
          </button>

          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${!isLogin ? "bg-white text-purple-600 shadow-lg" : "text-white/70 hover:text-white"}`}
          >
            Signup
          </button>
        </div>

        {isLogin ? (
          <div className="space-y-5">
            <div className="flex items-center bg-white/10 border border-white/30 backdrop-blur text-white p-4 rounded-xl hover:border-white/50 transition-all focus-within:border-white/70">
              <FaUser className="mr-3 text-blue-300" />
              <input
                type="text"
                placeholder="Username"
                className="outline-none w-full bg-transparent placeholder-white/50 text-white font-medium"
              />
            </div>

            <div className="flex items-center bg-white/10 border border-white/30 backdrop-blur text-white p-4 rounded-xl hover:border-white/50 transition-all focus-within:border-white/70">
              <FaLock className="mr-3 text-blue-300" />
              <input
                type="password"
                placeholder="Password"
                className="outline-none w-full bg-transparent placeholder-white/50 text-white font-medium"
              />
            </div>

            <button className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:shadow-2xl transform hover:scale-105">
              Login
            </button>

            <p className="text-center text-white/60 text-sm">
              Don't have an account?{" "}
              <span className="text-blue-300 cursor-pointer hover:text-blue-200">
                Sign up here
              </span>
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center bg-white/10 border border-white/30 backdrop-blur text-white p-4 rounded-xl hover:border-white/50 transition-all focus-within:border-white/70">
              <FaUser className="mr-3 text-pink-300" />
              <input
                type="text"
                placeholder="Full Name"
                className="outline-none w-full bg-transparent placeholder-white/50 text-white font-medium"
              />
            </div>

            <div className="flex items-center bg-white/10 border border-white/30 backdrop-blur text-white p-4 rounded-xl hover:border-white/50 transition-all focus-within:border-white/70">
              <FaUser className="mr-3 text-pink-300" />
              <input
                type="text"
                placeholder="Username"
                className="outline-none w-full bg-transparent placeholder-white/50 text-white font-medium"
              />
            </div>

            <div className="flex items-center bg-white/10 border border-white/30 backdrop-blur text-white p-4 rounded-xl hover:border-white/50 transition-all focus-within:border-white/70">
              <FaEnvelope className="mr-3 text-pink-300" />
              <input
                type="email"
                placeholder="Email"
                className="outline-none w-full bg-transparent placeholder-white/50 text-white font-medium"
              />
            </div>

            <div className="flex items-center bg-white/10 border border-white/30 backdrop-blur text-white p-4 rounded-xl hover:border-white/50 transition-all focus-within:border-white/70">
              <FaPhone className="mr-3 text-pink-300" />
              <input
                type="text"
                placeholder="Phone Number"
                className="outline-none w-full bg-transparent placeholder-white/50 text-white font-medium"
              />
            </div>

            <div className="flex items-center bg-white/10 border border-white/30 backdrop-blur text-white p-4 rounded-xl hover:border-white/50 transition-all focus-within:border-white/70">
              <FaLock className="mr-3 text-pink-300" />
              <input
                type="password"
                placeholder="Password"
                className="outline-none w-full bg-transparent placeholder-white/50 text-white font-medium"
              />
            </div>

            <div className="flex items-center bg-white/10 border border-white/30 backdrop-blur text-white p-4 rounded-xl hover:border-white/50 transition-all focus-within:border-white/70">
              <FaLock className="mr-3 text-pink-300" />
              <input
                type="password"
                placeholder="Confirm Password"
                className="outline-none w-full bg-transparent placeholder-white/50 text-white font-medium"
              />
            </div>

            <button className="w-full bg-gradient-to-r from-pink-400 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-pink-500 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-pink-500/50 hover:shadow-2xl transform hover:scale-105">
              Create Account
            </button>

            <p className="text-center text-white/60 text-sm">
              Already have an account?{" "}
              <span className="text-pink-300 cursor-pointer hover:text-pink-200">
                Login here
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default Login;
