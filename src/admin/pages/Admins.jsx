import { useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaKey,
  FaUserShield,
} from "react-icons/fa";

import { api } from "../../services/api";
import { useResourceList } from "../useResourceList";
import { useToast } from "../ToastContext";
import { useAdminAuth } from "../AdminAuthContext";

import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Field,
  Loading,
  Modal,
  Pagination,
  Switch,
} from "../components/ui";

import {
  formatDate,
  formatDateTime,
  initials,
} from "../components/helpers";

const EMPTY_FORM = {
  name: "",
  designation: "",
  email: "",
  password: "",
  isActive: true,
};

const Admins = () => {
  const toast = useToast();
  const { admin: currentAdmin } = useAdminAuth();

  const list = useResourceList("/admins", { limit: 25 });

  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const setValue = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing({ mode: "create" });
  };

  const openEdit = (item) => {
    /* Password is deliberately absent: it is never loaded or shown. */
    setForm({
      name: item.name || "",
      designation: item.designation || "",
      email: item.email || "",
      password: "",
      isActive: item.isActive !== false,
    });

    setEditing({ mode: "edit", item });
  };

  const save = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      if (editing.mode === "create") {
        await api.post("/admins", form);
        toast.success("Admin account created");
      } else {
        const { password, ...rest } = form;
        void password;

        await api.put(`/admins/${editing.item._id}`, rest);
        toast.success("Admin account updated");
      }

      setEditing(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not save the account");
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("The two passwords do not match");
      return;
    }

    setSaving(true);

    try {
      await api.patch(`/admins/${resetting._id}/password`, {
        newPassword,
      });

      toast.success(`Password updated for ${resetting.name}`);

      setResetting(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.message || "Could not update the password");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setBusy(true);

    try {
      await api.delete(`/admins/${confirm._id}`);

      toast.success("Admin removed");
      setConfirm(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not remove the admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-search">
          <FaSearch />

          <input
            type="search"
            value={list.search}
            onChange={(event) => list.setSearch(event.target.value)}
            placeholder="Search name, email or designation..."
          />
        </div>

        <select
          className="admin-select"
          style={{ width: "auto", minWidth: 150 }}
          value={list.filters.isActive ?? ""}
          onChange={(event) => list.setFilter("isActive", event.target.value)}
        >
          <option value="">All accounts</option>
          <option value="true">Active only</option>
          <option value="false">Deactivated</option>
        </select>

        <button
          type="button"
          className="admin-btn admin-btn-primary admin-btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={openCreate}
        >
          <FaPlus /> Add admin
        </button>
      </div>

      {list.loading ? (
        <Loading label="Loading admins..." />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon={<FaUserShield />}
          title="No admin accounts found"
          description="Admin accounts can sign in to this dashboard."
        />
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th
                    className="sortable"
                    onClick={() => list.toggleSort("name")}
                  >
                    Admin
                  </th>
                  <th>Designation</th>
                  <th
                    className="sortable"
                    onClick={() => list.toggleSort("email")}
                  >
                    Email
                  </th>
                  <th>Status</th>
                  <th
                    className="sortable"
                    onClick={() => list.toggleSort("lastLoginAt")}
                  >
                    Last login
                  </th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {list.items.map((item) => {
                  const isSelf = item._id === currentAdmin?.id;

                  return (
                    <tr key={item._id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <span className="admin-avatar">
                            {item.avatar?.url ? (
                              <img src={item.avatar.url} alt="" />
                            ) : (
                              initials(item.name)
                            )}
                          </span>

                          <div>
                            <div className="cell-strong">{item.name}</div>

                            {isSelf && (
                              <div className="cell-muted">You</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="cell-muted">{item.designation}</td>

                      <td className="cell-muted">{item.email}</td>

                      <td>
                        <Badge tone={item.isActive ? "green" : "red"}>
                          {item.isActive ? "Active" : "Deactivated"}
                        </Badge>
                      </td>

                      <td className="cell-muted">
                        {formatDateTime(item.lastLoginAt)}
                      </td>

                      <td className="cell-muted">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="cell-actions">
                        <div className="admin-btn-group">
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-icon"
                            onClick={() => openEdit(item)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-icon"
                            onClick={() => {
                              setResetting(item);
                              setNewPassword("");
                              setConfirmPassword("");
                            }}
                            title="Change password"
                          >
                            <FaKey />
                          </button>

                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm admin-btn-icon"
                            onClick={() => setConfirm(item)}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "You cannot delete your own account"
                                : "Remove"
                            }
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={list.page}
            limit={list.limit}
            total={list.total}
            onChange={list.setPage}
          />
        </>
      )}

      {/* ============ CREATE / EDIT ============ */}

      <Modal
        open={Boolean(editing)}
        title={
          editing?.mode === "create" ? "Add admin" : "Edit admin"
        }
        description="Passwords are stored only as a secure hash and are never displayed."
        onClose={() => setEditing(null)}
        footer={
          <>
            <button
              type="button"
              className="admin-btn"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="admin-form"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving && <span className="admin-spinner small" />}
              Save admin
            </button>
          </>
        }
      >
        <form id="admin-form" onSubmit={save}>
          <div className="admin-form-grid">
            <Field label="Name" required>
              <input
                className="admin-input"
                value={form.name}
                onChange={(event) => setValue("name", event.target.value)}
                required
              />
            </Field>

            <Field label="Designation" required>
              <input
                className="admin-input"
                value={form.designation}
                onChange={(event) =>
                  setValue("designation", event.target.value)
                }
                placeholder="Senior Admin"
                required
              />
            </Field>

            <Field label="Email" required full>
              <input
                className="admin-input"
                type="email"
                value={form.email}
                onChange={(event) => setValue("email", event.target.value)}
                autoComplete="off"
                required
              />
            </Field>

            {editing?.mode === "create" && (
              <Field
                label="Password"
                required
                full
                hint="At least 8 characters, including a letter and a number."
              >
                <input
                  className="admin-input"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setValue("password", event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
            )}

            <Field label="Account status" full>
              <Switch
                checked={form.isActive}
                onChange={(value) => setValue("isActive", value)}
                label={
                  form.isActive
                    ? "Active - can sign in"
                    : "Deactivated - cannot sign in"
                }
              />
            </Field>
          </div>
        </form>
      </Modal>

      {/* ============ RESET PASSWORD ============ */}

      <Modal
        open={Boolean(resetting)}
        title={`Change password for ${resetting?.name || ""}`}
        description="The current password is never shown and cannot be recovered."
        onClose={() => setResetting(null)}
        size="narrow"
        footer={
          <>
            <button
              type="button"
              className="admin-btn"
              onClick={() => setResetting(null)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="reset-password-form"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving && <span className="admin-spinner small" />}
              Update password
            </button>
          </>
        }
      >
        <form id="reset-password-form" onSubmit={resetPassword}>
          <div className="admin-form-grid single">
            <Field
              label="New password"
              required
              hint="At least 8 characters, including a letter and a number."
            >
              <input
                className="admin-input"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>

            <Field label="Confirm new password" required>
              <input
                className="admin-input"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Remove this admin?"
        message={`${
          confirm?.name || "This admin"
        } will lose access to the dashboard immediately. This cannot be undone.`}
        confirmLabel="Remove admin"
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
};

export default Admins;
