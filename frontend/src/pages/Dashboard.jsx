import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";
import api from "../api/auth";
import { Plus, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const [myTests, setMyTests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const res = await api.get("/tests/mine");  // ✅ FIXED
        setMyTests(res.data.tests || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  if (!user) return <p className="text-center mt-12 text-gray-400">Loading...</p>;

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[#f5a623]">Dashboard</h1>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/create-test")}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#30363d] text-black hover:border-[#f5a623] bg-yellow-500"
            >
              <Plus className="w-4 h-4" /> Create Test
            </button>

            <Link
              to="/give-test"
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#30363d] hover:border-emerald-600 bg-emerald-500"
            >
              <BookOpen className="w-4 h-4" /> Give Test
            </Link>
          </div>
        </header>

        <section className="bg-[#161b22] border border-[#30363d] rounded-md p-4">
          <h2 className="text-lg font-medium mb-3">My Tests</h2>

          {myTests.length === 0 ? (
            <p className="text-gray-400">You haven't created any tests yet.</p>
          ) : (
            <ul className="space-y-3">
              {myTests.map((t) => (
                <li
                  key={t._id}
                  className="flex items-center justify-between p-3 rounded-md border border-[#23272a]"
                >
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-gray-400">
                      {t.difficulty} • {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    {/* Copy ID Button */}
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(t._id);

                        // Temporary copied effect:
                        const btn = document.getElementById(`copy-${t._id}`);
                        btn.innerText = "Copied!";
                        setTimeout(() => (btn.innerText = "Copy ID"), 1500);
                      }}
                      id={`copy-${t._id}`}
                      className="px-3 py-1 rounded-md border border-[#30363d] bg-blue-500 "
                    >
                      Copy ID
                    </button>

                    <button
                      onClick={() => navigate(`/tests/${t._id}/edit`)}
                      className="px-3 py-1 rounded-md border border-[#30363d] bg-green-500"
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
