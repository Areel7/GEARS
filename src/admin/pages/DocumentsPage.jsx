import { useRef, useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaDownload,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
} from "react-icons/fa";

import { api } from "../../services/api";
import { useResourceList } from "../useResourceList";
import { useToast } from "../ToastContext";

import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Field,
  Loading,
  Modal,
  Pagination,
} from "../components/ui";

import {
  formatDate,
  toFormData,
} from "../components/helpers";

const ACCEPTED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const MAX_BYTES = 15 * 1024 * 1024;

const iconFor = (mimeType = "") => {
  if (mimeType.includes("pdf")) return <FaFilePdf />;
  if (mimeType.includes("word")) return <FaFileWord />;
  if (mimeType.includes("sheet") || mimeType.includes("excel")) {
    return <FaFileExcel />;
  }
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return <FaFilePowerpoint />;
  }
  return <FaFileAlt />;
};

const readableSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EMPTY_FORM = { name: "", category: "Other", description: "" };

const DocumentsPage = () => {
  const toast = useToast();

  const list = useResourceList("/documents", { limit: 30 });

  const categories = list.meta.categories || [];

  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const fileRef = useRef(null);

  const setValue = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setFileError("");
    setEditing({ mode: "create" });
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || "",
      category: item.category || "Other",
      description: item.description || "",
    });

    setFile(null);
    setFileError("");
    setEditing({ mode: "edit", item });
  };

  const pickFile = (event) => {
    const chosen = event.target.files?.[0];

    if (!chosen) return;

    if (!ACCEPTED.includes(chosen.type)) {
      setFileError("Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX.");
      event.target.value = "";
      return;
    }

    if (chosen.size > MAX_BYTES) {
      setFileError("That file is larger than 15MB.");
      event.target.value = "";
      return;
    }

    setFileError("");
    setFile(chosen);

    /* Offer the filename as the document name when it is still blank. */
    if (!form.name) {
      setValue("name", chosen.name.replace(/\.[^.]+$/, ""));
    }
  };

  const save = async (event) => {
    event.preventDefault();

    if (editing.mode === "create" && !file) {
      setFileError("Choose a file to upload.");
      return;
    }

    setSaving(true);

    try {
      const body = toFormData(form, { file });

      if (editing.mode === "create") {
        await api.post("/documents", body);
        toast.success("Document uploaded");
      } else {
        await api.put(`/documents/${editing.item._id}`, body);
        toast.success("Document updated");
      }

      setEditing(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not save the document");
    } finally {
      setSaving(false);
    }
  };

  const download = async (item) => {
    try {
      await api.download(
        `/documents/${item._id}/download`,
        null,
        item.file?.originalName || item.name
      );
    } catch (error) {
      toast.error(error.message || "Download failed");
    }
  };

  const remove = async () => {
    setBusy(true);

    try {
      await api.delete(`/documents/${confirm._id}`);

      toast.success("Document deleted");
      setConfirm(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not delete the document");
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
            placeholder="Search document name or description..."
          />
        </div>

        <select
          className="admin-select"
          style={{ width: "auto", minWidth: 165 }}
          value={list.filters.category || ""}
          onChange={(event) =>
            list.setFilter("category", event.target.value)
          }
        >
          <option value="">All categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="admin-btn admin-btn-primary admin-btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={openCreate}
        >
          <FaPlus /> Upload document
        </button>
      </div>

      {list.loading ? (
        <Loading label="Loading documents..." />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon={<FaFileAlt />}
          title="No documents yet"
          description="Store reusable GEARS templates here: minute sheets, official letters, certificates and forms."
          action={
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={openCreate}
            >
              <FaPlus /> Upload document
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
                    Document
                  </th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Uploaded by</th>
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            color: "var(--orange)",
                            fontSize: 16,
                          }}
                        >
                          {iconFor(item.file?.mimeType)}
                        </span>

                        <div>
                          <div className="cell-strong">{item.name}</div>

                          {item.description && (
                            <div className="cell-muted">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <Badge tone="blue">{item.category}</Badge>
                    </td>

                    <td className="cell-muted">
                      {readableSize(item.file?.size)}
                    </td>

                    <td className="cell-muted">
                      {item.uploadedBy?.name || "-"}
                    </td>

                    <td className="cell-muted">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="cell-actions">
                      <div className="admin-btn-group">
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-icon"
                          onClick={() => download(item)}
                          title="Download"
                        >
                          <FaDownload />
                        </button>

                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-icon"
                          onClick={() => openEdit(item)}
                          title="Rename or replace"
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

      <Modal
        open={Boolean(editing)}
        title={
          editing?.mode === "create"
            ? "Upload document"
            : "Edit document"
        }
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
              form="document-form"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving && <span className="admin-spinner small" />}
              Save document
            </button>
          </>
        }
      >
        <form id="document-form" onSubmit={save}>
          <div className="admin-form-grid">
            <Field label="Document name" required>
              <input
                className="admin-input"
                value={form.name}
                onChange={(event) => setValue("name", event.target.value)}
                required
              />
            </Field>

            <Field label="Category">
              <select
                className="admin-select"
                value={form.category}
                onChange={(event) =>
                  setValue("category", event.target.value)
                }
              >
                {(categories.length
                  ? categories
                  : ["Other"]
                ).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="File"
              required={editing?.mode === "create"}
              hint="PDF, DOC, DOCX, XLS, XLSX, PPT or PPTX. Max 15MB."
              error={fileError}
              full
            >
              <div className="admin-image-picker">
                <button
                  type="button"
                  className="admin-btn admin-btn-sm"
                  onClick={() => fileRef.current?.click()}
                >
                  {file || editing?.item
                    ? "Replace file"
                    : "Choose file"}
                </button>

                <span
                  style={{
                    color: "var(--muted)",
                    fontSize: 12,
                    overflowWrap: "anywhere",
                  }}
                >
                  {file
                    ? `${file.name} (${readableSize(file.size)})`
                    : editing?.item?.file?.originalName ||
                      "No file selected"}
                </span>

                <input
                  ref={fileRef}
                  type="file"
                  className="admin-file-input"
                  accept={ACCEPTED.join(",")}
                  onChange={pickFile}
                />
              </div>
            </Field>

            <Field label="Description" full>
              <textarea
                className="admin-textarea"
                value={form.description}
                onChange={(event) =>
                  setValue("description", event.target.value)
                }
                placeholder="What this template is used for."
              />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this document?"
        message={`This permanently removes "${
          confirm?.name || "this document"
        }" and its stored file.`}
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
};

export default DocumentsPage;
