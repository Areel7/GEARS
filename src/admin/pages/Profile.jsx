import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaKey, FaShieldAlt } from "react-icons/fa";

import { api } from "../../services/api";
import { useAdminAuth } from "../AdminAuthContext";
import { ADMIN_LOGIN_PATH } from "../routes";
import { useToast } from "../ToastContext";

import {
  Field,
  ImagePicker,
  Loading,
} from "../components/ui";

import {
  formatDateTime,
  initials,
  toFormData,
} from "../components/helpers";

/*
  Rendered only once the signed-in admin is known, so the form can
  seed itself from that profile instead of syncing through an effect.
*/
const ProfileForms = ({ admin }) => {
  const { refresh, logout } = useAdminAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => ({
    name: admin.name || "",
    designation: admin.designation || "",
    email: admin.email || "",
  }));

  const [avatar, setAvatar] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savingPassword, setSavingPassword] = useState(false);

  const setValue = (key, value) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const setPassword = (key, value) =>
    setPasswords((current) => ({ ...current, [key]: value }));

  const saveProfile = async (event) => {
    event.preventDefault();

    setSavingProfile(true);

    try {
      await api.put("/auth/profile", toFormData(profile, { avatar }));

      await refresh();

      setAvatar(null);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.message || "Could not update your profile");
    } finally {
      setSavingProfile(false);
    }
  };

  /*
    The current password is verified on the server before the new one
    is accepted. Nothing about the existing password is ever sent back.
  */
  const changePassword = async (event) => {
    event.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("The new passwords do not match");
      return;
    }

    setSavingPassword(true);

    try {
      await api.put("/auth/change-password", passwords);

      toast.success("Password changed. Please sign in again.");

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      /* The server invalidated the session, so start a fresh sign-in. */
      await logout();
      navigate(ADMIN_LOGIN_PATH, { replace: true });
    } catch (error) {
      toast.error(error.message || "Could not change your password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="admin-two-col">
      {/* ============ PROFILE ============ */}

      <form className="admin-card admin-card-pad" onSubmit={saveProfile}>
        <div className="admin-section-head">
          <div>
            <h2>Profile</h2>
            <p>Shown in the dashboard topbar</p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 0 18px",
            borderBottom: "1px solid var(--border)",
            marginBottom: 18,
          }}
        >
          <span
            className="admin-avatar"
            style={{ width: 52, height: 52, fontSize: 17 }}
          >
            {admin.avatar ? (
              <img src={admin.avatar} alt="" />
            ) : (
              initials(admin.name)
            )}
          </span>

          <div>
            <strong style={{ display: "block", fontSize: 15 }}>
              {admin.name}
            </strong>

            <span
              style={{
                display: "block",
                color: "var(--orange)",
                fontSize: 12,
              }}
            >
              {admin.designation}
            </span>

            <span
              style={{
                display: "block",
                color: "var(--muted)",
                fontSize: 12,
                marginTop: 3,
              }}
            >
              {admin.email}
            </span>
          </div>
        </div>

        <div className="admin-form-grid single">
          <Field label="Full name" required>
            <input
              className="admin-input"
              value={profile.name}
              onChange={(event) => setValue("name", event.target.value)}
              required
            />
          </Field>

          <Field label="Designation" required>
            <input
              className="admin-input"
              value={profile.designation}
              onChange={(event) =>
                setValue("designation", event.target.value)
              }
              required
            />
          </Field>

          <Field label="Email address" required>
            <input
              className="admin-input"
              type="email"
              value={profile.email}
              onChange={(event) => setValue("email", event.target.value)}
              required
            />
          </Field>

          <ImagePicker
            label="Profile picture"
            value={avatar}
            onChange={setAvatar}
            currentUrl={admin.avatar}
          />
        </div>

        <div style={{ marginTop: 18 }}>
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={savingProfile}
          >
            {savingProfile ? (
              <span className="admin-spinner small" />
            ) : (
              <FaSave />
            )}
            Save profile
          </button>
        </div>

        <p
          style={{
            margin: "16px 0 0",
            color: "var(--faint)",
            fontSize: 11.5,
            lineHeight: 1.7,
          }}
        >
          Account created {formatDateTime(admin.createdAt)}
          <br />
          Last sign-in {formatDateTime(admin.lastLoginAt)}
        </p>
      </form>

      {/* ============ PASSWORD ============ */}

      <form
        id="password"
        className="admin-card admin-card-pad"
        onSubmit={changePassword}
      >
        <div className="admin-section-head">
          <div>
            <h2>Change Password</h2>
            <p>Verified against your current password</p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 11,
            padding: 13,
            marginBottom: 18,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-2)",
          }}
        >
          <FaShieldAlt
            style={{ color: "var(--blue)", fontSize: 15, marginTop: 2 }}
          />

          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontSize: 11.5,
              lineHeight: 1.7,
            }}
          >
            Your password is stored only as a secure hash. It is never
            displayed anywhere in this dashboard and cannot be recovered
            — only replaced.
          </p>
        </div>

        <div className="admin-form-grid single">
          <Field label="Current password" required>
            <input
              className="admin-input"
              type="password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPassword("currentPassword", event.target.value)
              }
              autoComplete="current-password"
              required
            />
          </Field>

          <Field
            label="New password"
            required
            hint="At least 8 characters, including a letter and a number."
          >
            <input
              className="admin-input"
              type="password"
              value={passwords.newPassword}
              onChange={(event) =>
                setPassword("newPassword", event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>

          <Field label="Confirm new password" required>
            <input
              className="admin-input"
              type="password"
              value={passwords.confirmPassword}
              onChange={(event) =>
                setPassword("confirmPassword", event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
        </div>

        <div style={{ marginTop: 18 }}>
          <button
            type="submit"
            className="admin-btn admin-btn-blue"
            disabled={savingPassword}
          >
            {savingPassword ? (
              <span className="admin-spinner small" />
            ) : (
              <FaKey />
            )}
            Change password
          </button>
        </div>

        <p
          style={{
            margin: "14px 0 0",
            color: "var(--faint)",
            fontSize: 11.5,
            lineHeight: 1.7,
          }}
        >
          You will be signed out and asked to sign in again with your new
          password.
        </p>
      </form>
    </div>
  );
};

const Profile = () => {
  const { admin } = useAdminAuth();

  if (!admin) return <Loading label="Loading profile..." />;

  /*
    Keyed on the admin id so switching accounts remounts the forms
    with fresh values rather than keeping the previous ones.
  */
  return <ProfileForms key={admin.id} admin={admin} />;
};

export default Profile;
