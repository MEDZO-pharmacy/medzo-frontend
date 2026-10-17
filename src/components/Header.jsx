import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getRoleHome } from '../auth/roleRouting';

const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isActive = (path) => location.pathname === path;

  return (
    <header className="flex items-center justify-between gap-4 bg-white px-4 py-5 sm:px-6 lg:px-12">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 text-medzo-blue font-bold text-2xl cursor-pointer">
        <img
          src="/hospital-icon1.svg"
          alt="Medzo Logo"
          className="w-6 h-6"
        />
        <span>Medzo</span>
      </Link>

      {/* Navigation */}
      <nav className="hidden items-center gap-6 font-semibold text-medzo-text-light lg:flex xl:gap-10">
        <Link to="/" className={isActive("/") ? "text-medzo-blue border-b-2 border-medzo-blue pb-1" : "hover:text-medzo-blue transition-colors"}>Home</Link>
        <Link to="/products" className={isActive("/products") ? "text-medzo-blue border-b-2 border-medzo-blue pb-1" : "hover:text-medzo-blue transition-colors"}>Products</Link>
        <Link to="/services" className={isActive("/services") ? "text-medzo-blue border-b-2 border-medzo-blue pb-1" : "hover:text-medzo-blue transition-colors"}>Services</Link>
        <Link to="/about" className={isActive("/about") ? "text-medzo-blue border-b-2 border-medzo-blue pb-1" : "hover:text-medzo-blue transition-colors"}>About Us</Link>
        <Link to="/contact" className={isActive("/contact") ? "text-medzo-blue border-b-2 border-medzo-blue pb-1" : "hover:text-medzo-blue transition-colors"}>Contact</Link>
      </nav>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <span className="hidden sm:inline text-sm font-semibold text-[#4a5568]">Welcome back! {user.username || user.firstName}</span>
            <Link to={getRoleHome(user)} className="rounded-md border border-medzo-blue px-5 py-2.5 font-semibold text-medzo-blue hover:bg-blue-50">Dashboard</Link>
            <button type="button" onClick={logout} className="gradient-btn text-white px-6 py-2.5 rounded-md font-semibold hover:opacity-90 transition-opacity">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/signup" className="gradient-btn text-white px-6 py-2.5 rounded-md font-semibold hover:opacity-90 transition-opacity inline-block">Sign Up</Link>
            <Link to="/login" className="gradient-btn text-white px-6 py-2.5 rounded-md font-semibold hover:opacity-90 transition-opacity inline-block">Login</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
