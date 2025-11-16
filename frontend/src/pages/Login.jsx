import { useState } from "react";
import { login } from "../api/auth";
import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";

export const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(form);
      setUser(res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-gray-200 px-4">
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl p-8 shadow-lg">
        
        <h2 className="text-3xl font-bold text-center mb-8 text-[#f5a623]">
          Login
        </h2>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 pr-3 py-3 rounded-md bg-[#0d1117] border border-[#30363d] 
                         focus:border-[#f5a623] outline-none transition text-gray-200"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-10 pr-3 py-3 rounded-md bg-[#0d1117] border border-[#30363d] 
                         focus:border-[#f5a623] outline-none transition text-gray-200"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {/* Error */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Submit */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-[#f5a623] 
                       hover:bg-[#e3921f] text-black font-semibold py-3 rounded-md transition"
          >
            <LogIn className="w-5 h-5" />
            Login
          </button>
        </form>

        {/* Redirect */}
        <p className="text-center mt-4 text-gray-400">
          Don’t have an account?{" "}
          <span
            className="text-[#f5a623] hover:underline cursor-pointer"
            onClick={() => navigate("/")}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
