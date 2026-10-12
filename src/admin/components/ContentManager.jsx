import { useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaArrowUp,
  FaArrowDown,
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
} from "./ui";

import {
  toFormData,
} from "./helpers";

/* =========================================================
   CONTENT MANAGER

   President, Alumni, Leadership, Gallery and Home Images are
   the same shape: ordered records with one or two images and a
   few text fields. They share this component so their
   behaviour - validation, reordering, image replacement,
   delete confirmation - stays identical.
========================================================= */

const buildInitialForm = (fields) =>
  Object.fromEntries(
    fields.map((field) => [
      field.name,
      field.type === "switch" ? field.defaultValue ?? false : "",
    ])
  );

const ContentManager = ({
  path,
  title,
  singular,
  icon,
  fields,
  imageFields = [{ name: "image", label: "Image" }],
  emptyDescription,
  renderTitle,
  renderSubtitle,
  renderBadges,
  searchPlaceholder = "Search...",
  gridClass = "admin-grid wide",
}) => {
  const toast = useToast();

  const list = useResourceList(path, { limit: 100 });

  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [form, setForm] = useState(() => buildInitialForm(fields));
  const [files, setFiles] = useState({});

  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reordering, setReordering] = useState(false);

  const setValue = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setForm(buildInitialForm(fields));
    setFiles({});
    setEditing({ mode: "create" });
  };

  const openEdit = (item) => {
    setForm(
      Object.fromEntries(
        fields.map((field) => [
          field.name,
          field.type === "switch"
            ? Boolean(item[field.name])
            : item[field.name] ?? "",
        ])
      )
    );

    setFiles({});
    setEditing({ mode: "edit", item });
  };

  const save = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      const body = toFormData(form, files);

      if (editing.mode === "create") {
        await api.post(path, body);
        toast.success(`${singular} added`);
      } else {
        await api.put(`${path}/${editing.item._id}`, body);
        toast.success(`${singular} updated`);
      }

      setEditing(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || `Could not save the ${singular}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setBusy(true);

    try {
      await api.delete(`${path}/${confirm._id}`);

      toast.success(`${singular} deleted`);
      setConfirm(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || `Could not delete the ${singular}`);
    } finally {
      setBusy(false);
    }
  };

  /* Swaps a record with its neighbour and persists both positions. */
  const move = async (index, direction) => {
    const target = index + direction;

    if (target < 0 || target >= list.items.length) return;

    const next = [...list.items];
    [next[index], next[target]] = [next[target], next[index]];

    setReordering(true);

    try {
      await api.patch(`${path}/reorder`, {
        items: next.map((item, position) => ({
          id: item._id,
          order: position,
        })),
      });

      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not reorder");
    } finally {
      setReordering(false);
    }
  };

  const renderField = (field) => {
    if (field.type === "switch") {
      return (
        <Field key={field.name} label={field.label} hint={field.hint} full>
          <Switch
            checked={form[field.name]}
            onChange={(value) => setValue(field.name, value)}
            label={field.switchLabel}
          />
        </Field>
      );
    }

    if (field.type === "textarea") {
      return (
        <Field
          key={field.name}
          label={field.label}
          required={field.required}
          hint={field.hint}
          full
        >
          <textarea
            className="admin-textarea"
            value={form[field.name]}
            onChange={(event) => setValue(field.name, event.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </Field>
      );
    }

    if (field.type === "select") {
      return (
        <Field
          key={field.name}
          label={field.label}
          required={field.required}
          hint={field.hint}
          full={field.full}
        >
          <select
            className="admin-select"
            value={form[field.name]}
            onChange={(event) => setValue(field.name, event.target.value)}
            required={field.required}
          >
            <option value="">{field.placeholder || "Select"}</option>

            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      );
    }

    return (
      <Field
        key={field.name}
        label={field.label}
        required={field.required}
        hint={field.hint}
        full={field.full}
      >
        <input
          className="admin-input"
          type={field.type === "number" ? "number" : "text"}
          min={field.type === "number" ? 0 : undefined}
          value={form[field.name]}
          onChange={(event) => setValue(field.name, event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      </Field>
    );
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
            placeholder={searchPlaceholder}
          />
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-primary admin-btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={openCreate}
        >
          <FaPlus /> Add {singular.toLowerCase()}
        </button>
      </div>

      {list.loading ? (
        <Loading label={`Loading ${title.toLowerCase()}...`} />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon={icon}
          title={`No ${title.toLowerCase()} yet`}
          description={emptyDescription}
          action={
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={openCreate}
            >
              <FaPlus /> Add {singular.toLowerCase()}
            </button>
          }
        />
      ) : (
        <div className={gridClass}>
          {list.items.map((item, index) => (
            <article key={item._id} className="admin-item-card">
              <div className="admin-item-media">
                {item.image?.url ? (
                  <img
                    src={item.image.url}
                    alt={renderTitle?.(item) || ""}
                    loading="lazy"
                  />
                ) : (
                  <div className="admin-item-placeholder">
                    <FaImage />
                  </div>
                )}

                <span className="admin-item-order">#{index + 1}</span>
              </div>

              <div className="admin-item-body">
                {renderBadges?.(item)}

                <h3>{renderTitle?.(item) || "Untitled"}</h3>

                {renderSubtitle?.(item) && <p>{renderSubtitle(item)}</p>}

                <div className="admin-item-foot">
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-icon"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reordering}
                    title="Move up"
                  >
                    <FaArrowUp />
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-icon"
                    onClick={() => move(index, 1)}
                    disabled={
                      index === list.items.length - 1 || reordering
                    }
                    title="Move down"
                  >
                    <FaArrowDown />
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-sm"
                    onClick={() => openEdit(item)}
                  >
                    <FaEdit /> Edit
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-danger admin-btn-sm admin-btn-icon"
                    onClick={() => setConfirm(item)}
                    style={{ marginLeft: "auto" }}
                    title="Delete"
                  >
                    <FaTrash />
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
            ? `Add ${singular.toLowerCase()}`
            : `Edit ${singular.toLowerCase()}`
        }
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
              form="content-form"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving && <span className="admin-spinner small" />}
              Save
            </button>
          </>
        }
      >
        <form id="content-form" onSubmit={save}>
          <div className="admin-form-grid">
            {fields.map(renderField)}

            {imageFields.map((field) => (
              <div key={field.name} className="admin-form-full">
                <ImagePicker
                  label={field.label}
                  hint={field.hint}
                  required={
                    field.required && editing?.mode === "create"
                  }
                  value={files[field.name] || null}
                  onChange={(file) =>
                    setFiles((current) => ({
                      ...current,
                      [field.name]: file,
                    }))
                  }
                  currentUrl={editing?.item?.[field.name]?.url}
                />
              </div>
            ))}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Delete this ${singular.toLowerCase()}?`}
        message={`This permanently removes "${
          confirm ? renderTitle?.(confirm) || "this record" : ""
        }" and its stored image. The change appears on the public website immediately.`}
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
};

export default ContentManager;

/* Small helper the content pages use for their status chips. */
export const ActiveBadge = ({ active }) => (
  <Badge tone={active ? "green" : "red"}>
    {active ? "Visible" : "Hidden"}
  </Badge>
);
