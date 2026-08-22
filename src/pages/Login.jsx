import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col font-sans">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-12 py-6">
        <Link to="/" className="flex items-center gap-2 text-medzo-blue font-bold text-2xl cursor-pointer">
          <img
            src="/hospital-icon1.svg"
            alt="Medzo Logo"
            className="w-6 h-6"
          />
          <span>Medzo</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-[#4a5568] hover:text-[#0a192f] font-semibold transition-colors">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-5xl min-h-[600px] flex items-center justify-center p-12">

          {/* Centered Form Area */}
          <div className="w-full max-w-[500px]">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-[#0a192f] mb-2">Welcome</h1>
              <p className="text-[#6b7280]">Please sign in to access your Medzo account.</p>
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* Username/Email */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#0a192f]">
                  Username or Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={20} className="text-[#a0aec0]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your username/email"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#f8fafc] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medzo-blue focus:border-transparent transition-all placeholder:text-[#a0aec0]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#0a192f]">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-[#a0aec0]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3.5 bg-[#f8fafc] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medzo-blue focus:border-transparent transition-all placeholder:text-[#a0aec0]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#a0aec0] hover:text-[#4a5568] focus:outline-none"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" className="text-sm font-bold text-medzo-blue hover:text-blue-700 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full gradient-btn text-white py-4 rounded-lg font-bold hover:opacity-90 transition-opacity mt-4"
              >
                Login to Account
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Login;