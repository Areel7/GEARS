import { useCallback, useEffect, useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaUserMinus,
  FaFileCsv,
  FaFileExcel,
  FaUserTie,
  FaUser,
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
  Switch,
} from "../components/ui";

import {
  toFormData,
} from "../components/helpers";

const EMPTY_FORM = {
  designation: "",
  description: "",
  startYear: "",
  endYear: "",
  order: 0,
  showOnHome: true,
};

const CoreTeamPage = () => {
  const toast = useToast();

  const list = useResourceList("/core-team", {
    limit: 100,
    initialFilters: { isActive: "true" },
  });

  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [memberId, setMemberId] = useState("");
  const [eligible, setEligible] = useState([]);

  const [image, setImage] = useState(null);
  const [homeImage, setHomeImage] = useState(null);

  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const designations = list.meta.designations || [];

  const setValue = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const loadEligible = useCallback(async () => {
    try {
      const response = await api.get("/core-team/eligible");
      setEligible(response.items || []);
    } catch {
      setEligible([]);
    }
  }, []);

  useEffect(() => {
    /*
      The state updates inside this loader all happen after an await,
      so they cannot cascade renders the way this rule guards against.
    */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEligible();
  }, [loadEligible, list.items]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setMemberId("");
    setImage(null);
    setHomeImage(null);
    setEditing({ mode: "create" });
  };

  const openEdit = (item) => {
    setForm({
      designation: item.designation || "",
      description: item.description || "",
      startYear: item.startYear || "",
      endYear: item.endYear || "",
      order: item.order ?? 0,
      showOnHome: item.showOnHome !== false,
    });

    setMemberId(item.member?._id || "");
    setImage(null);
    setHomeImage(null);
    setEditing({ mode: "edit", item });
  };

  const save = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      const body = toFormData(
        editing.mode === "create" ? { ...form, member: memberId } : form,
        { image, homeImage }
      );

      if (editing.mode === "create") {
        await api.post("/core-team", body);
        toast.success("Added to the core team");
      } else {
        await api.put(`/core-team/${editing.item._id}`, body);
        toast.success("Core team record saved");
      }

      setEditing(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not save the record");
    } finally {
      setSaving(false);
    }
  };

  /* Removes the appointment only. The member record is never deleted. */
  const removeFromTeam = async () => {
    setBusy(true);

    try {
      await api.delete(`/core-team/${confirm._id}`);

      toast.success(
        "Removed from the core team. The member record was kept."
      );

      setConfirm(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not remove the record");
    } finally {
      setBusy(false);
    }
  };

  const exportData = async (format) => {
    try {
      await api.download(
        "/core-team/export",
        { format },
        `gears-core-team.${format}`
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
            placeholder="Search name, roll number, designation..."
          />
        </div>

        <select
          className="admin-select"
          style={{ width: "auto", minWidth: 160 }}
          value={list.filters.designation || ""}
          onChange={(event) =>
            list.setFilter("designation", event.target.value)
          }
        >
          <option value="">All designations</option>

          {designations.map((designation) => (
            <option key={designation} value={designation}>
              {designation}
            </option>
          ))}
        </select>

        <select
          className="admin-select"
          style={{ width: "auto", minWidth: 150 }}
          value={list.filters.isActive ?? ""}
          onChange={(event) => list.setFilter("isActive", event.target.value)}
        >
          <option value="true">Active only</option>
          <option value="false">Past appointments</option>
          <option value="">All records</option>
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
            <FaPlus /> Add to core team
          </button>
        </div>
      </div>

      {list.loading ? (
        <Loading label="Loading core team..." />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon={<FaUserTie />}
          title="No core team records"
          description="Set a member status to Core Member, or add someone here directly."
          action={
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={openCreate}
            >
              <FaPlus /> Add to core team
            </button>
          }
        />
      ) : (
        <div className="admin-grid wide">
          {list.items.map((item) => (
            <article key={item._id} className="admin-item-card">
              <div className="admin-item-media">
                {item.image?.url ? (
                  <img src={item.image.url} alt={item.member?.name} />
                ) : (
                  <div className="admin-item-placeholder">
                    <FaUser />
                  </div>
                )}

                <span className="admin-item-order">#{item.order ?? 0}</span>
              </div>

              <div className="admin-item-body">
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Badge tone="orange">{item.designation}</Badge>

                  {!item.isActive && <Badge tone="red">Past</Badge>}

                  {item.showOnHome && item.isActive && (
                    <Badge tone="blue">On home</Badge>
                  )}
                </div>

                <h3>{item.member?.name || "Unknown member"}</h3>

                <p style={{ color: "var(--faint)", fontSize: 11.5 }}>
                  {item.member?.rollNumber || "No roll number"}
                </p>

                {item.description && <p>{item.description}</p>}

                <div className="admin-item-foot">
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm"
                    onClick={() => openEdit(item)}
                  >
                    <FaEdit /> Edit
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => setConfirm(item)}
                    style={{ marginLeft: "auto" }}
                  >
                    <FaUserMinus /> Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        title={
          editing?.mode === "create"
            ? "Add to core team"
            : `Edit ${editing?.item?.member?.name || "record"}`
        }
        description="Name, roll number and email come from the linked member record."
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
              form="core-team-form"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving && <span className="admin-spinner small" />}
              Save
            </button>
          </>
        }
      >
        <form id="core-team-form" onSubmit={save}>
          <div className="admin-form-grid">
            {editing?.mode === "create" && (
              <Field
                label="Member"
                required
                full
                hint={
                  eligible.length
                    ? "Only members without an active appointment are listed."
                    : "Every member already has an active appointment. Add a member first."
                }
              >
                <select
                  className="admin-select"
                  value={memberId}
                  onChange={(event) => setMemberId(event.target.value)}
                  required
                >
                  <option value="">Select a member</option>

                  {eligible.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                      {member.rollNumber ? ` (${member.rollNumber})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field
              label="Designation"
              required
              hint="Pick a role or type a new one."
            >
              <input
                className="admin-input"
                list="core-designations"
                value={form.designation}
                onChange={(event) =>
                  setValue("designation", event.target.value)
                }
                required
              />

              <datalist id="core-designations">
                {designations.map((designation) => (
                  <option key={designation} value={designation} />
                ))}
              </datalist>
            </Field>

            <Field label="Display order" hint="Lower numbers appear first.">
              <input
                className="admin-input"
                type="number"
                min="0"
                value={form.order}
                onChange={(event) => setValue("order", event.target.value)}
              />
            </Field>

            <Field label="Start year">
              <input
                className="admin-input"
                value={form.startYear}
                onChange={(event) =>
                  setValue("startYear", event.target.value)
                }
                placeholder="2024"
              />
            </Field>

            <Field label="End year">
              <input
                className="admin-input"
                value={form.endYear}
                onChange={(event) => setValue("endYear", event.target.value)}
                placeholder="2025"
              />
            </Field>

            <Field label="Description" full>
              <textarea
                className="admin-textarea"
                value={form.description}
                onChange={(event) =>
                  setValue("description", event.target.value)
                }
                placeholder="Shown under the name on the public team page."
              />
            </Field>

            <div className="admin-form-full">
              <ImagePicker
                label="Team page image"
                value={image}
                onChange={setImage}
                currentUrl={editing?.item?.image?.url}
                hint="Shown in the core team grid on the /team page."
              />
            </div>

            <div className="admin-form-full">
              <ImagePicker
                label="Home page image"
                value={homeImage}
                onChange={setHomeImage}
                currentUrl={editing?.item?.homeImage?.url}
                hint="Shown in the core team carousel on the home page. Falls back to the team page image."
              />
            </div>

            <Field label="Show on home page" full>
              <Switch
                checked={form.showOnHome}
                onChange={(value) => setValue("showOnHome", value)}
                label={
                  form.showOnHome
                    ? "Included in the home carousel"
                    : "Hidden from the home carousel"
                }
              />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Remove from the core team?"
        message={`${
          confirm?.member?.name || "This person"
        } will no longer appear on the public team page and will be set back to Member. The member record and its history are kept.`}
        confirmLabel="Remove from team"
        onConfirm={removeFromTeam}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
};

export default CoreTeamPage;
