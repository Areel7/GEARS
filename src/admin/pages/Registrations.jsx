import { useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaFileCsv,
  FaFileExcel,
  FaClipboardList,
} from "react-icons/fa";

import { api } from "../../services/api";
import { useResourceList } from "../useResourceList";
import { useToast } from "../ToastContext";

import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Field,
  ImagePicker,
  Loading,
  Modal,
  Pagination,
} from "../components/ui";

import {
  formatDate,
  toFormData,
} from "../components/helpers";

const STATUSES = ["Pending", "Member", "Failed"];

const STATUS_TONE = { Pending: "amber", Member: "green", Failed: "red" };

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const EMPTY_FORM = {
  studentName: "",
  rollNumber: "",
  section: "",
  semester: "",
  fatherName: "",
  cnic: "",
  phone: "",
  email: "",
  gender: "",
  status: "Pending",
  notes: "",
};

const Registrations = () => {
  const toast = useToast();

  const list = useResourceList("/registrations", { limit: 25 });

  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [picture, setPicture] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const setValue = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setPicture(null);
    setEditing({ mode: "create" });
  };

  const openEdit = (item) => {
    setForm({
      studentName: item.studentName || "",
      rollNumber: item.rollNumber || "",
      section: item.section || "",
      semester: String(item.semester || ""),
      fatherName: item.fatherName || "",
      cnic: item.cnic || "",
      phone: item.phone || "",
      email: item.email || "",
      gender: item.gender || "",
      status: item.status || "Pending",
      notes: item.notes || "",
    });

    setPicture(null);
    setEditing({ mode: "edit", item });
  };

  const save = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      const body = toFormData(form, { picture });

      if (editing.mode === "create") {
        await api.post("/registrations", body);
        toast.success("Registration added");
      } else {
        const response = await api.put(
          `/registrations/${editing.item._id}`,
          body
        );

        toast.success(
          response.member
            ? "Registration saved and the member record is up to date"
            : "Registration saved"
        );
      }

      setEditing(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not save the registration");
    } finally {
      setSaving(false);
    }
  };

  /*
    Changing the status to "Member" makes the backend create or
    reactivate the linked Member record automatically.
  */
  const changeStatus = async (item, status) => {
    try {
      const response = await api.patch(
        `/registrations/${item._id}/status`,
        { status }
      );

      toast.success(response.message || "Status updated");
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not change the status");
    }
  };

  const remove = async () => {
    setBusy(true);

    try {
      await api.delete(`/registrations/${confirm._id}`);

      toast.success("Registration deleted");
      setConfirm(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not delete the registration");
    } finally {
      setBusy(false);
    }
  };

  const exportData = async (format) => {
    try {
      await api.download(
        "/registrations/export",
        { format, search: list.search, ...list.filters },
        `gears-registrations.${format}`
      );

      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (error) {
      toast.error(error.message || "Export failed");
    }
  };

  return (
    <>
      {/* ============ TOOLBAR ============ */}

      <div className="admin-toolbar">
        <div className="admin-search">
          <FaSearch />

          <input
            type="search"
            value={list.search}
            onChange={(event) => list.setSearch(event.target.value)}
            placeholder="Search name, roll number, email, phone..."
          />
        </div>

        <select
          className="admin-select"
          style={{ width: "auto", minWidth: 150 }}
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

        <select
          className="admin-select"
          style={{ width: "auto", minWidth: 140 }}
          value={list.filters.semester || ""}
          onChange={(event) =>
            list.setFilter("semester", event.target.value)
          }
        >
          <option value="">All semesters</option>

          {SEMESTERS.map((semester) => (
            <option key={semester} value={semester}>
              Semester {semester}
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
            <FaPlus /> Add registration
          </button>
        </div>
      </div>

      {/* ============ TABLE ============ */}

      {list.loading ? (
        <Loading label="Loading registrations..." />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon={<FaClipboardList />}
          title="No registrations found"
          description={
            list.search || Object.keys(list.filters).length
              ? "No records match the current search or filters."
              : "Submissions from the public registration form will appear here. You can also add one manually."
          }
          action={
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={openCreate}
            >
              <FaPlus /> Add registration
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
                    onClick={() => list.toggleSort("studentName")}
                  >
                    Student
                  </th>
                  <th
                    className="sortable"
                    onClick={() => list.toggleSort("rollNumber")}
                  >
                    Roll Number
                  </th>
                  <th>Contact</th>
                  <th
                    className="sortable"
                    onClick={() => list.toggleSort("semester")}
                  >
                    Semester
                  </th>
                  <th>Status</th>
                  <th
                    className="sortable"
                    onClick={() => list.toggleSort("createdAt")}
                  >
                    Date
                  </th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {list.items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="cell-strong">{item.studentName}</div>
                      <div className="cell-muted">
                        {item.gender} · Section {item.section}
                      </div>
                    </td>

                    <td className="cell-muted">{item.rollNumber}</td>

                    <td>
                      <div className="cell-muted">{item.email}</div>
                      <div className="cell-muted">{item.phone}</div>
                    </td>

                    <td className="cell-muted">{item.semester}</td>

                    <td>
                      <select
                        className="admin-select"
                        style={{ width: "auto", minWidth: 120, padding: "6px 30px 6px 10px" }}
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
                          onClick={() => setViewing(item)}
                          title="View"
                        >
                          <FaEye />
                        </button>

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
                          title="Delete"
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

      {/* ============ VIEW ============ */}

      <Modal
        open={Boolean(viewing)}
        title={viewing?.studentName}
        description={viewing?.rollNumber}
        onClose={() => setViewing(null)}
        footer={
          <button
            type="button"
            className="admin-btn"
            onClick={() => setViewing(null)}
          >
            Close
          </button>
        }
      >
        {viewing && (
          <div className="admin-form-grid">
            {viewing.picture?.url && (
              <div className="admin-form-full">
                <img
                  src={viewing.picture.url}
                  alt={viewing.studentName}
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
              </div>
            )}

            {[
              ["Father Name", viewing.fatherName],
              ["CNIC", viewing.cnic],
              ["Phone", viewing.phone],
              ["Email", viewing.email],
              ["Section", viewing.section],
              ["Semester", viewing.semester],
              ["Gender", viewing.gender],
              ["Submitted", formatDate(viewing.createdAt)],
              ["Source", viewing.source === "admin" ? "Added by admin" : "Public form"],
            ].map(([label, value]) => (
              <Field key={label} label={label}>
                <div style={{ fontSize: 13 }}>{value || "-"}</div>
              </Field>
            ))}

            <Field label="Status" full>
              <Badge tone={STATUS_TONE[viewing.status]}>
                {viewing.status}
              </Badge>
            </Field>

            {viewing.memberId && (
              <Field label="Linked member" full>
                <div style={{ fontSize: 13 }}>
                  {viewing.memberId.name} ({viewing.memberId.status})
                </div>
              </Field>
            )}

            {viewing.notes && (
              <Field label="Notes" full>
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                  {viewing.notes}
                </div>
              </Field>
            )}
          </div>
        )}
      </Modal>

      {/* ============ CREATE / EDIT ============ */}

      <Modal
        open={Boolean(editing)}
        title={
          editing?.mode === "create"
            ? "Add registration"
            : "Edit registration"
        }
        description="Uses the same fields as the public registration form."
        onClose={() => setEditing(null)}
        size="wide"
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
              form="registration-form"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving && <span className="admin-spinner small" />}
              Save registration
            </button>
          </>
        }
      >
        <form id="registration-form" onSubmit={save}>
          <div className="admin-form-grid">
            <Field label="Student full name" required>
              <input
                className="admin-input"
                value={form.studentName}
                onChange={(event) =>
                  setValue("studentName", event.target.value)
                }
                required
              />
            </Field>

            <Field
              label="Roll number"
              required
              hint="Example: FA/2023/BSCS/598"
            >
              <input
                className="admin-input"
                value={form.rollNumber}
                onChange={(event) =>
                  setValue("rollNumber", event.target.value.toUpperCase())
                }
                required
              />
            </Field>

            <Field label="Section" required>
              <input
                className="admin-input"
                value={form.section}
                onChange={(event) => setValue("section", event.target.value)}
                required
              />
            </Field>

            <Field label="Semester" required>
              <select
                className="admin-select"
                value={form.semester}
                onChange={(event) =>
                  setValue("semester", event.target.value)
                }
                required
              >
                <option value="">Select semester</option>

                {SEMESTERS.map((semester) => (
                  <option key={semester} value={semester}>
                    Semester {semester}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Father name" required>
              <input
                className="admin-input"
                value={form.fatherName}
                onChange={(event) =>
                  setValue("fatherName", event.target.value)
                }
                required
              />
            </Field>

            <Field label="CNIC" required hint="Format: 35202-1234567-1">
              <input
                className="admin-input"
                value={form.cnic}
                onChange={(event) => setValue("cnic", event.target.value)}
                pattern="[0-9]{5}-[0-9]{7}-[0-9]"
                required
              />
            </Field>

            <Field label="Phone" required hint="Format: 03XXXXXXXXX">
              <input
                className="admin-input"
                value={form.phone}
                onChange={(event) => setValue("phone", event.target.value)}
                pattern="03[0-9]{9}"
                required
              />
            </Field>

            <Field label="Email" required>
              <input
                className="admin-input"
                type="email"
                value={form.email}
                onChange={(event) => setValue("email", event.target.value)}
                required
              />
            </Field>

            <Field label="Gender" required>
              <select
                className="admin-select"
                value={form.gender}
                onChange={(event) => setValue("gender", event.target.value)}
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>

            <Field
              label="Status"
              hint="Setting this to Member creates the member record automatically."
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

            <div className="admin-form-full">
              <ImagePicker
                label="Student picture"
                value={picture}
                onChange={setPicture}
                currentUrl={editing?.item?.picture?.url}
              />
            </div>

            <Field label="Notes" full>
              <textarea
                className="admin-textarea"
                value={form.notes}
                onChange={(event) => setValue("notes", event.target.value)}
                placeholder="Internal notes (not shown publicly)"
              />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this registration?"
        message={`This permanently removes the registration for ${
          confirm?.studentName || "this student"
        }, including the uploaded picture. Any member record created from it is kept.`}
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
};

export default Registrations;
