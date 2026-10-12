import { useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFileCsv,
  FaFileExcel,
  FaUsers,
} from "react-icons/fa";

import { api } from "../../services/api";
import { useResourceList } from "../useResourceList";
import { useToast } from "../ToastContext";

import {
  ConfirmDialog,
  EmptyState,
  Field,
  Loading,
  Modal,
  Pagination,
} from "../components/ui";

import {
  formatDate,
} from "../components/helpers";

const STATUSES = ["Member", "Core Member", "Alumni", "Terminate"];

const EMPTY_FORM = {
  name: "",
  rollNumber: "",
  phone: "",
  email: "",
  status: "Member",
};

const Members = () => {
  const toast = useToast();

  const list = useResourceList("/members", { limit: 25 });

  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const setValue = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing({ mode: "create" });
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || "",
      rollNumber: item.rollNumber || "",
      phone: item.phone || "",
      email: item.email || "",
      status: item.status || "Member",
    });

    setEditing({ mode: "edit", item });
  };

  const save = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      if (editing.mode === "create") {
        await api.post("/members", form);
        toast.success("Member added");
      } else {
        const response = await api.put(
          `/members/${editing.item._id}`,
          form
        );

        toast.success(
          response.coreTeam
            ? "Member saved and added to the core team"
            : "Member saved"
        );
      }

      setEditing(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not save the member");
    } finally {
      setSaving(false);
    }
  };

  /*
    Promoting to "Core Member" makes the backend create or reactivate
    the core team appointment automatically; any other status retires
    it without deleting the historical record.
  */
  const changeStatus = async (item, status) => {
    try {
      const response = await api.patch(`/members/${item._id}/status`, {
        status,
      });

      toast.success(response.message || "Status updated");
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not change the status");
    }
  };

  const remove = async () => {
    setBusy(true);

    try {
      await api.delete(`/members/${confirm._id}`);

      toast.success("Member removed");
      setConfirm(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not remove the member");
    } finally {
      setBusy(false);
    }
  };

  const exportData = async (format) => {
    try {
      await api.download(
        "/members/export",
        { format, search: list.search, ...list.filters },
        `gears-members.${format}`
      );

      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (error) {
      toast.error(error.message || "Export failed");
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
            placeholder="Search name, roll number, email..."
          />
        </div>

        <select
          className="admin-select"
          style={{ width: "auto", minWidth: 165 }}
          value={list.filters.status || ""}
          onChange={(event) => list.setFilter("status", event.target.value)}
        >
          <option value="">All statuses</option>

          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status} ({list.counts[status] ?? 0})
            </option>
          ))}
        </select>

        <div className="admin-btn-group" style={{ marginLeft: "auto" }}>
          <button
            type="button"
            className="admin-btn admin-btn-sm"
            onClick={() => exportData("csv")}
          >
            <FaFileCsv /> CSV
          </button>

          <button
            type="button"
            className="admin-btn admin-btn-sm"
            onClick={() => exportData("xlsx")}
          >
            <FaFileExcel /> Excel
          </button>

          <button
            type="button"
            className="admin-btn admin-btn-primary admin-btn-sm"
            onClick={openCreate}
          >
            <FaPlus /> Add member
          </button>
        </div>
      </div>

      {list.loading ? (
        <Loading label="Loading members..." />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon={<FaUsers />}
          title="No members found"
          description="Members appear here when a registration is approved, or you can add one manually."
          action={
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={openCreate}
            >
              <FaPlus /> Add member
            </button>
          }
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
                    Name
                  </th>
                  <th
                    className="sortable"
                    onClick={() => list.toggleSort("rollNumber")}
                  >
                    Roll Number
                  </th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th
                    className="sortable"
                    onClick={() => list.toggleSort("createdAt")}
                  >
                    Joined
                  </th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {list.items.map((item) => (
                  <tr key={item._id}>
                    <td className="cell-strong">{item.name}</td>

                    <td className="cell-muted">
                      {item.rollNumber || (
                        <span style={{ color: "var(--faint)" }}>
                          Not recorded
                        </span>
                      )}
                    </td>

                    <td className="cell-muted">{item.phone || "-"}</td>

                    <td className="cell-muted">{item.email || "-"}</td>

                    <td>
                      <select
                        className="admin-select"
                        style={{
                          width: "auto",
                          minWidth: 138,
                          padding: "6px 30px 6px 10px",
                        }}
                        value={item.status}
                        onChange={(event) =>
                          changeStatus(item, event.target.value)
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
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
                          className="admin-btn admin-btn-danger admin-btn-sm admin-btn-icon"
                          onClick={() => setConfirm(item)}
                          title="Remove"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      <Modal
        open={Boolean(editing)}
        title={editing?.mode === "create" ? "Add member" : "Edit member"}
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
              form="member-form"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving && <span className="admin-spinner small" />}
              Save member
            </button>
          </>
        }
      >
        <form id="member-form" onSubmit={save}>
          <div className="admin-form-grid">
            <Field label="Name" required>
              <input
                className="admin-input"
                value={form.name}
                onChange={(event) => setValue("name", event.target.value)}
                required
              />
            </Field>

            <Field label="Roll number" required>
              <input
                className="admin-input"
                value={form.rollNumber}
                onChange={(event) =>
                  setValue("rollNumber", event.target.value.toUpperCase())
                }
                required
              />
            </Field>

            <Field label="Phone">
              <input
                className="admin-input"
                value={form.phone}
                onChange={(event) => setValue("phone", event.target.value)}
                placeholder="03XXXXXXXXX"
              />
            </Field>

            <Field label="Email">
              <input
                className="admin-input"
                type="email"
                value={form.email}
                onChange={(event) => setValue("email", event.target.value)}
              />
            </Field>

            <Field
              label="Status"
              full
              hint="Choosing Core Member makes this person available in Core Team."
            >
              <select
                className="admin-select"
                value={form.status}
                onChange={(event) => setValue("status", event.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Remove this member?"
        message={`This deletes the member record for ${
          confirm?.name || "this person"
        } and any core team appointment linked to it. The original registration is kept.`}
        confirmLabel="Remove member"
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
};

export default Members;
