import { Navigate, Route, Routes } from "react-router-dom";

import "./admin.css";

import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH } from "./routes";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuthContext";
import { SettingsProvider } from "./SettingsContext";
import { ToastProvider } from "./ToastContext";

import AdminLayout from "./components/AdminLayout";
import { Loading } from "./components/ui";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Registrations from "./pages/Registrations";
import Members from "./pages/Members";
import CoreTeamPage from "./pages/CoreTeamPage";
import Presidents from "./pages/Presidents";
import AlumniPage from "./pages/AlumniPage";
import LeadershipPage from "./pages/LeadershipPage";
import GalleryPage from "./pages/GalleryPage";
import HomeImagesPage from "./pages/HomeImagesPage";
import InventoryPage from "./pages/InventoryPage";
import DocumentsPage from "./pages/DocumentsPage";
import Admins from "./pages/Admins";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

/* =========================================================
   ROUTE GUARDS

   A convenience for the browser only. The backend independently
   rejects any unauthenticated API call, so a forged client
   session gets nothing.
========================================================= */

const RequireAuth = ({ children }) => {
  const { isAuthenticated, isChecking } = useAdminAuth();

  if (isChecking) {
    return (
      <div className="admin-login">
        <Loading label="Checking your session..." />
      </div>
    );
  }

  /*
    Visitors without a session are sent to the public home page
    rather than to the sign-in page: bouncing them to it would
    hand the private sign-in address to anyone who guessed this
    URL. Admins reach the form by its own address.
  */
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RedirectIfAuthenticated = ({ children }) => {
  const { isAuthenticated, isChecking } = useAdminAuth();

  if (isChecking) {
    return (
      <div className="admin-login">
        <Loading label="Checking your session..." />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to={ADMIN_BASE_PATH} replace />;

  return children;
};

const AdminRoutes = () => (
  <Routes>
    <Route
      path={ADMIN_LOGIN_PATH}
      element={
        <RedirectIfAuthenticated>
          <Login />
        </RedirectIfAuthenticated>
      }
    />

    <Route
      path={ADMIN_BASE_PATH}
      element={
        <RequireAuth>
          <AdminLayout />
        </RequireAuth>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="registrations" element={<Registrations />} />
      <Route path="members" element={<Members />} />
      <Route path="core-team" element={<CoreTeamPage />} />
      <Route path="president" element={<Presidents />} />
      <Route path="alumni" element={<AlumniPage />} />
      <Route path="leadership" element={<LeadershipPage />} />
      <Route path="gallery" element={<GalleryPage />} />
      <Route path="home-images" element={<HomeImagesPage />} />
      <Route path="inventory" element={<InventoryPage />} />
      <Route path="documents" element={<DocumentsPage />} />
      <Route path="admins" element={<Admins />} />
      <Route path="settings" element={<Settings />} />
      <Route path="profile" element={<Profile />} />
    </Route>

    <Route
      path={`${ADMIN_BASE_PATH}/*`}
      element={<Navigate to={ADMIN_BASE_PATH} replace />}
    />
  </Routes>
);

const AdminApp = () => (
  <div className="gears-admin">
    <AdminAuthProvider>
      <ToastProvider>
        <SettingsProvider>
          <AdminRoutes />
        </SettingsProvider>
      </ToastProvider>
    </AdminAuthProvider>
  </div>
);

export default AdminApp;
