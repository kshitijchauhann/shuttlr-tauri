import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import useAuthStore from "./store/authStore";
import React from "react";
import Dashboard from "./pages/MobileDashboard.tsx";
import ScanQR from "./pages/ScanQR.tsx";
import CreateRoom from "./pages/CreateRoom.tsx";
import Login from "./pages/Login.tsx";
import SignUp from "./pages/SignUp.tsx";
import FileTransferPage from "./pages/FileTransferPage.tsx";
import Profile from "./pages/UserProfile.tsx";

// Protected route component
const ProtectedRoute = () => {
  const { isLoggedIn, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

// Public route component that redirects to dashboard if logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scan" element={<ScanQR />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/transfer" element={<FileTransferPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Root route redirect */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Navigate to="/login" replace />
            </PublicRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;
