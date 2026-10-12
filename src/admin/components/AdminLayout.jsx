import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaClipboardList,
  FaUsers,
  FaUserTie,
  FaCrown,
  FaMedal,
  FaChalkboardTeacher,
  FaImages,
  FaHome,
  FaBoxes,
  FaFileAlt,
  FaUserShield,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaKey,
} from "react-icons/fa";

import gearsLogo from "../../assets/images/gears-logo.png";

import { useAdminAuth } from "../AdminAuthContext";
import { ADMIN_LOGIN_PATH } from "../routes";
import { useToast } from "../ToastContext";
import { useSettings } from "../SettingsContext";
import {
  initials,
} from "./helpers";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: FaTachometerAlt, end: true },
  { to: "/admin/registrations", label: "Registrations", icon: FaClipboardList },
  { to: "/admin/members", label: "Members", icon: FaUsers },
  { to: "/admin/core-team", label: "Core Team", icon: FaUserTie },
  { to: "/admin/president", label: "President", icon: FaCrown },
  { to: "/admin/alumni", label: "Alumni of the Year", icon: FaMedal },
  { to: "/admin/leadership", label: "Leadership", icon: FaChalkboardTeacher },
  { to: "/admin/gallery", label: "Gallery", icon: FaImages },
  { to: "/admin/home-images", label: "Home Images", icon: FaHome },
  { to: "/admin/inventory", label: "Inventory", icon: FaBoxes },
  { to: "/admin/documents", label: "Documents", icon: FaFileAlt },
  { to: "/admin/admins", label: "Admins", icon: FaUserShield },
  { to: "/admin/settings", label: "Settings", icon: FaCog },
];

const PAGE_META = {
  "/admin": {
    title: "Dashboard",
    subtitle: "Live overview of everything in the society",
  },
  "/admin/registrations": {
    title: "Registrations",
    subtitle: "Student submissions and their status",
  },
  "/admin/members": {
    title: "Members",
    subtitle: "Society membership records",
  },
  "/admin/core-team": {
    title: "Core Team",
    subtitle: "Appointments shown on the public team page",
  },
  "/admin/president": {
    title: "President",
    subtitle: "Current and past presidents",
  },
  "/admin/alumni": {
    title: "Alumni of the Year",
    subtitle: "Recognised alumni shown publicly",
  },
  "/admin/leadership": {
    title: "Leadership",
    subtitle: "Supervisors and mentors",
  },
  "/admin/gallery": {
    title: "Gallery",
    subtitle: "Images on the public gallery page",
  },
  "/admin/home-images": {
    title: "Home Images",
    subtitle: "Images in the home page achievements grid",
  },
  "/admin/inventory": {
    title: "Inventory",
    subtitle: "Equipment and stock",
  },
  "/admin/documents": {
    title: "Documents",
    subtitle: "Reusable GEARS templates and files",
  },
  "/admin/admins": {
    title: "Admin Management",
    subtitle: "Dashboard accounts and access",
  },
  "/admin/settings": {
    title: "Settings",
    subtitle: "Site-wide controls stored in the database",
  },
  "/admin/profile": {
    title: "My Profile",
    subtitle: "Your account details and password",
  },
};

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const { settings } = useSettings();
  const toast = useToast();

  const location = useLocation();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  /* Close the profile menu on an outside click. */
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const meta = PAGE_META[location.pathname] || {
    title: "Admin",
    subtitle: "",
  };

  /* Panels are closed where navigation happens rather than by
     reacting to the route, which avoids an extra render pass. */
  const closePanels = () => {
    setDrawerOpen(false);
    setMenuOpen(false);
  };

  const go = (to) => {
    closePanels();
    navigate(to);
  };

  const handleLogout = async () => {
    closePanels();
    await logout();
    toast.success("Signed out");
    navigate(ADMIN_LOGIN_PATH, { replace: true });
  };

  return (
    <div className="admin-shell">
      {drawerOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ===================== SIDEBAR ===================== */}

      <aside className={`admin-sidebar ${drawerOpen ? "open" : ""}`}>
        <div className="admin-sidebar-brand">
          <img src={gearsLogo} alt="" />

          <div>
            <strong>GEARS</strong>
            <span>Admin Panel</span>
          </div>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="admin-nav">
          <span className="admin-nav-label">Overview</span>

          {NAV_ITEMS.slice(0, 1).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closePanels}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}

          <span className="admin-nav-label">People</span>

          {NAV_ITEMS.slice(1, 7).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closePanels}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}

          <span className="admin-nav-label">Content</span>

          {NAV_ITEMS.slice(7, 11).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closePanels}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}

          <span className="admin-nav-label">System</span>

          {NAV_ITEMS.slice(11).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closePanels}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* ===================== MAIN ===================== */}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <FaBars />
          </button>

          <div className="admin-page-title">
            <h1>{meta.title}</h1>
            {meta.subtitle && <p>{meta.subtitle}</p>}
          </div>

          <div className="admin-topbar-right">
            <span
              className={`admin-registration-pill ${
                settings?.registrationEnabled ? "on" : "off"
              }`}
              title="Public registration status"
            >
              <i />
              <span>Registration</span>
              {settings?.registrationEnabled ? "ON" : "OFF"}
            </span>

            <div className="admin-profile" ref={menuRef}>
              <button
                type="button"
                className="admin-profile-btn"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="admin-avatar">
                  {admin?.avatar ? (
                    <img src={admin.avatar} alt="" />
                  ) : (
                    initials(admin?.name)
                  )}
                </span>

                <span className="admin-profile-meta">
                  <strong>{admin?.name}</strong>
                  <span>{admin?.designation}</span>
                </span>
              </button>

              {menuOpen && (
                <div className="admin-profile-menu" role="menu">
                  {/*
                    Name, designation and email only.
                    Passwords are never held or shown here.
                  */}
                  <div className="admin-profile-head">
                    <strong>{admin?.name}</strong>
                    <em>{admin?.designation}</em>
                    <small>{admin?.email}</small>
                  </div>

                  <button
                    type="button"
                    className="admin-profile-item"
                    onClick={() => go("/admin/profile")}
                  >
                    <FaUserCircle />
                    View Profile
                  </button>

                  <button
                    type="button"
                    className="admin-profile-item"
                    onClick={() => go("/admin/profile#password")}
                  >
                    <FaKey />
                    Change Password
                  </button>

                  <button
                    type="button"
                    className="admin-profile-item"
                    onClick={() => go("/admin/settings")}
                  >
                    <FaCog />
                    Settings
                  </button>

                  <button
                    type="button"
                    className="admin-profile-item danger"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
