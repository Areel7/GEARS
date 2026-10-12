import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaClipboardList,
  FaHourglassHalf,
  FaUsers,
  FaUserTie,
  FaBoxes,
  FaFileAlt,
  FaImages,
  FaUserShield,
  FaPlus,
  FaHome,
} from "react-icons/fa";

import { api } from "../../services/api";
import { useAdminAuth } from "../AdminAuthContext";
import { useSettings } from "../SettingsContext";
import { useToast } from "../ToastContext";

import {
  Badge,
  EmptyState,
  Loading,
  Switch,
} from "../components/ui";

import {
  formatDate,
  initials,
} from "../components/helpers";

const STAT_CARDS = [
  {
    key: "totalRegistrations",
    label: "Total Registrations",
    icon: FaClipboardList,
    tone: "",
    to: "/admin/registrations",
  },
  {
    key: "pendingRegistrations",
    label: "Pending Registrations",
    icon: FaHourglassHalf,
    tone: "amber",
    to: "/admin/registrations?status=Pending",
  },
  {
    key: "totalMembers",
    label: "Members",
    icon: FaUsers,
    tone: "blue",
    to: "/admin/members",
  },
  {
    key: "coreTeamRecords",
    label: "Core Team Members",
    icon: FaUserTie,
    tone: "green",
    to: "/admin/core-team",
  },
  {
    key: "inventoryItems",
    label: "Inventory Items",
    icon: FaBoxes,
    tone: "",
    to: "/admin/inventory",
  },
  {
    key: "documents",
    label: "Documents",
    icon: FaFileAlt,
    tone: "blue",
    to: "/admin/documents",
  },
  {
    key: "galleryImages",
    label: "Gallery Images",
    icon: FaImages,
    tone: "green",
    to: "/admin/gallery",
  },
  {
    key: "homeImages",
    label: "Home Images",
    icon: FaHome,
    tone: "amber",
    to: "/admin/home-images",
  },
  {
    key: "admins",
    label: "Admins",
    icon: FaUserShield,
    tone: "",
    to: "/admin/admins",
  },
];

const STATUS_TONE = {
  Pending: "amber",
  Member: "green",
  Failed: "red",
  "Core Member": "orange",
  Alumni: "blue",
  Terminate: "red",
};

const Dashboard = () => {
  const { admin } = useAdminAuth();
  const { settings, setRegistrationEnabled } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get("/dashboard");
      setData(response);
    } catch (error) {
      toast.error(error.message || "Could not load the dashboard");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    /*
      The state updates inside this loader all happen after an await,
      so they cannot cascade renders the way this rule guards against.
    */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const toggleRegistration = async (enabled) => {
    setSaving(true);

    try {
      await setRegistrationEnabled(enabled);

      toast.success(
        enabled
          ? "Registration is now open on the public site."
          : "Registration is now closed on the public site."
      );
    } catch (error) {
      toast.error(error.message || "Could not update the setting");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading dashboard..." />;

  const stats = data?.stats || {};

  return (
    <>
      {/* ============ WELCOME ============ */}

      <section className="admin-section">
        <div className="admin-card admin-card-pad">
          <div className="admin-section-head" style={{ marginBottom: 0 }}>
            <div>
              <h2 style={{ fontSize: 17 }}>
                Welcome back, {admin?.name?.split(" ")[0]}
              </h2>

              <p>
                {admin?.designation} · {admin?.email}
              </p>
            </div>

            <div className="admin-btn-group">
              <button
                type="button"
                className="admin-btn admin-btn-sm"
                onClick={() => navigate("/admin/registrations")}
              >
                <FaPlus /> Registration
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-sm"
                onClick={() => navigate("/admin/members")}
              >
                <FaPlus /> Member
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-blue"
                onClick={() => navigate("/admin/inventory")}
              >
                <FaPlus /> Inventory
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ REGISTRATION SWITCH ============ */}

      <section className="admin-section">
        <div className="admin-setting-row">
          <div className="admin-setting-text">
            <h3>Public Registration</h3>

            <p>
              Controls whether the registration form is available on the
              public website. When it is off the form is hidden, the
              navigation link disappears, and the server rejects any
              submission sent directly to the API.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <Badge tone={settings?.registrationEnabled ? "green" : "red"}>
              {settings?.registrationEnabled ? "OPEN" : "CLOSED"}
            </Badge>

            <Switch
              checked={settings?.registrationEnabled}
              disabled={saving}
              onChange={toggleRegistration}
            />
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}

      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2>Overview</h2>
            <p>Live counts read straight from the database</p>
          </div>
        </div>

        <div className="admin-stat-grid">
          {STAT_CARDS.map((card) => (
            <Link key={card.key} to={card.to}>
              <div className={`admin-stat ${card.tone}`}>
                <div className="admin-stat-icon">
                  <card.icon />
                </div>

                <div className="admin-stat-value">
                  {stats[card.key] ?? 0}
                </div>

                <div className="admin-stat-label">{card.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ RECENT ACTIVITY ============ */}

      <section className="admin-section">
        <div className="admin-two-col">
          {/* Registrations */}

          <div className="admin-card admin-card-pad">
            <div className="admin-section-head">
              <div>
                <h2>Recent Registrations</h2>
                <p>Latest submissions from the public site</p>
              </div>

              <Link to="/admin/registrations" className="admin-btn admin-btn-sm">
                View all
              </Link>
            </div>

            {data?.recent?.registrations?.length ? (
              <div className="admin-list">
                {data.recent.registrations.map((item) => (
                  <div key={item._id} className="admin-list-row">
                    <span className="admin-avatar">
                      {initials(item.studentName)}
                    </span>

                    <div className="admin-list-main">
                      <strong>{item.studentName}</strong>
                      <span>
                        {item.rollNumber} · {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <Badge tone={STATUS_TONE[item.status]}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No registrations yet"
                description="Submissions from the public form will appear here."
              />
            )}
          </div>

          {/* Members */}

          <div className="admin-card admin-card-pad">
            <div className="admin-section-head">
              <div>
                <h2>Recent Members</h2>
                <p>Newest membership records</p>
              </div>

              <Link to="/admin/members" className="admin-btn admin-btn-sm">
                View all
              </Link>
            </div>

            {data?.recent?.members?.length ? (
              <div className="admin-list">
                {data.recent.members.map((item) => (
                  <div key={item._id} className="admin-list-row">
                    <span className="admin-avatar">
                      {initials(item.name)}
                    </span>

                    <div className="admin-list-main">
                      <strong>{item.name}</strong>
                      <span>
                        {item.rollNumber || "No roll number"} ·{" "}
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <Badge tone={STATUS_TONE[item.status]}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No members yet"
                description="Approve a registration to create the first member."
              />
            )}
          </div>
        </div>
      </section>

      {/* ============ INVENTORY ============ */}

      <section className="admin-section">
        <div className="admin-card admin-card-pad">
          <div className="admin-section-head">
            <div>
              <h2>Recent Inventory Updates</h2>
              <p>
                {stats.inventoryUnits ?? 0} units across{" "}
                {stats.inventoryItems ?? 0} items
              </p>
            </div>

            <Link to="/admin/inventory" className="admin-btn admin-btn-sm">
              Manage inventory
            </Link>
          </div>

          {data?.recent?.inventory?.length ? (
            <div className="admin-list">
              {data.recent.inventory.map((item) => (
                <div key={item._id} className="admin-list-row">
                  <div className="admin-list-main">
                    <strong>{item.name}</strong>
                    <span>Updated {formatDate(item.updatedAt)}</span>
                  </div>

                  <Badge tone={item.quantity > 0 ? "blue" : "red"}>
                    {item.quantity} in stock
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No inventory items"
              description="Add equipment and stock to keep track of it here."
            />
          )}
        </div>
      </section>
    </>
  );
};

export default Dashboard;
