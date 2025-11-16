import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { LogOut, UserPlus, LogIn, Code2 } from "lucide-react";
import { logout } from "../api/auth";

export const Navbar = () => {
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    clearUser();
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 md:px-12 py-3 
      bg-[#0d1117] border-b border-[#30363d] text-gray-200 sticky top-0 z-50">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <Code2 className="w-7 h-7 text-[#f5a623]" />
        <span className="text-xl font-semibold tracking-wide text-[#f5a623]">
          Paper Pro
        </span>
      </Link>

      {/* Auth Buttons */}
      <div className="flex items-center gap-4">
        {!user ? (
          <>
            {/* Signup */}
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#30363d]
              hover:border-[#f5a623] hover:text-[#f5a623] transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Signup</span>
            </Link>

            {/* Login */}
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#30363d]
              hover:border-[#f5a623] hover:text-[#f5a623] transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#30363d]
            hover:border-red-500 hover:text-red-500 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
