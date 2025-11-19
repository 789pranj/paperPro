import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import { fetchUser } from "./api/auth";
import { useAuthStore } from "./store/auth";
import PageNotFound from "./pages/PageNotFound";
import Footer from "./components/Footer";
import Login from "./Pages/Login";
import CreateTest from "./pages/CreateTest";
import GiveTest from "./pages/GiveTest";
import StartTest from "./pages/StartTest";
import EditTest from "./pages/EditTest";
import ViewTest from "./pages/ViewTest";

const App = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser()
      .then((res) => setUser(res.data.user))
      .catch(() => clearUser())
      .finally(() => setLoading(false));
  }, [setUser, clearUser]);

  if (loading) return <p>Loading...</p>; // Show while fetching user

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create-test" element={<ProtectedRoute><CreateTest /></ProtectedRoute>} />
            <Route path="/give-test" element={<ProtectedRoute><GiveTest /></ProtectedRoute>} />
            <Route path="/tests/:id/start" element={<ProtectedRoute><StartTest /></ProtectedRoute>} /> 
            <Route path="/tests/:testId/edit" element={<ProtectedRoute><EditTest /></ProtectedRoute>} />
            <Route path="/tests/:id" element={<ProtectedRoute><ViewTest /></ProtectedRoute>} />

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
