import { useAuthStore } from "../store/auth";

export const Dashboard = () => {
  const user = useAuthStore((s) => s.user);

  if (!user)
    return (
      <p className="text-center mt-10 text-gray-300 animate-pulse">
        Loading...
      </p>
    );

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-8">
      <div className="max-w-xl mx-auto bg-[#161b22] border border-[#30363d] p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-semibold text-[#f5a623] mb-4">Dashboard</h1>

        <p className="text-gray-300">
          <span className="font-semibold">Name:</span> {user.fullName}
        </p>

        <p className="text-gray-300 mt-2">
          <span className="font-semibold">Email:</span> {user.email}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
