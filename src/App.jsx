import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import SignIn from "@/pages/SignIn";
import Home from "@/pages/Home";
import Nearby from "@/pages/Nearby";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import PublicProfile from "@/pages/PublicProfile";
import CreatorDashboard from "@/pages/CreatorDashboard";
import DropPage from "@/pages/DropPage";
import PageNotFound from "@/lib/PageNotFound";

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function AuthenticatedRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/nearby" element={<Nearby />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/creator" element={<CreatorDashboard />} />
      </Route>
      <Route path="/u/:username" element={<PublicProfile />} />
      <Route path="/drop/:dropId" element={<DropPage />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function PublicRoutes() {
  return (
    <Routes>
      {/* Profiles + drop share links are public — no auth wall. */}
      <Route path="/u/:username" element={<PublicProfile />} />
      <Route path="/drop/:dropId" element={<DropPage />} />
      <Route path="*" element={<SignIn />} />
    </Routes>
  );
}

export default function App() {
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <Router>
      {isLoading ? (
        <LoadingScreen />
      ) : isAuthenticated ? (
        <AuthenticatedRoutes />
      ) : (
        <PublicRoutes />
      )}
      <Toaster />
    </Router>
  );
}
