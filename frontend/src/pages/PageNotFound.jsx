import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1117] text-gray-200 px-4">
      <h1 className="text-7xl font-bold text-red-500">404</h1>
      <p className="mt-3 text-gray-400 text-lg">Oops! Page Not Found</p>

      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 mt-6 px-6 py-3 bg-[#f5a623] hover:bg-[#e3921f]
                   text-black font-semibold rounded-md transition"
      >
        <Home className="w-5 h-5" />
        Go Home
      </button>
    </div>
  );
};

export default PageNotFound;
