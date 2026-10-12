import { useEffect, useMemo, useRef, useState } from "react";
import { FaImage, FaInbox, FaTimes, FaExclamationTriangle } from "react-icons/fa";

/* =========================================================
   SHARED ADMIN UI PRIMITIVES
========================================================= */

export const Loading = ({ label = "Loading..." }) => (
  <div className="admin-loading">
    <span className="admin-spinner" />
    {label}
  </div>
);

export const EmptyState = ({
  icon,
  title = "Nothing here yet",
  description,
  action,
}) => (
  <div className="admin-empty">
    <div className="admin-empty-icon">{icon || <FaInbox />}</div>

    <h3>{title}</h3>

    {description && <p>{description}</p>}

    {action}
  </div>
);

export const Badge = ({ tone = "", children }) => (
  <span className={`admin-badge ${tone}`}>{children}</span>
);

export const Field = ({
  label,
  required,
  hint,
  error,
  children,
  full,
}) => (
  <div className={`admin-field ${full ? "admin-form-full" : ""}`}>
    {label && (
      <label>
        {label} {required && <b>*</b>}
      </label>
    )}

    {children}

    {hint && <span className="admin-field-hint">{hint}</span>}

    {error && <span className="admin-field-error">{error}</span>}
  </div>
);

export const Switch = ({ checked, onChange, disabled, label }) => (
  <label className="admin-switch">
    <input
      type="checkbox"
      checked={Boolean(checked)}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
    />

    <span className="admin-switch-track" />

    {label && <span>{label}</span>}
  </label>
);

/* ---------------------------------------------------------
   MODAL
--------------------------------------------------------- */

export const Modal = ({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "",
}) => {
  /* Close on Escape and stop the page behind from scrolling. */
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="admin-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className={`admin-modal ${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
      >
        <div className="admin-modal-head">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="admin-modal-body">{children}</div>

        {footer && <div className="admin-modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   CONFIRMATION

   Used for every destructive action so nothing important is
   ever removed on a single click.
--------------------------------------------------------- */

export const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  busy,
}) => {
  if (!open) return null;

  return (
    <div
      className="admin-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel?.();
      }}
    >
      <div className="admin-modal narrow" role="alertdialog" aria-modal="true">
        <div className="admin-modal-head">
          <div className="admin-modal-icon">
            <FaExclamationTriangle />
          </div>

          <div>
            <h2>{title}</h2>
          </div>
        </div>

        <div className="admin-modal-body">
          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            {message}
          </p>
        </div>

        <div className="admin-modal-foot">
          <button
            type="button"
            className="admin-btn"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>

          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <span className="admin-spinner small" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   IMAGE PICKER

   Shows the stored image until a new one is chosen, then a
   local preview. The file itself is validated again on the
   server before anything is stored.
--------------------------------------------------------- */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const ImagePicker = ({
  value,
  onChange,
  currentUrl,
  label = "Image",
  hint = "JPG, PNG, WEBP or AVIF. Max 5MB.",
  required,
}) => {
  const inputRef = useRef(null);

  const [error, setError] = useState("");

  /* Derived from the selected file rather than stored in state. */
  const preview = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value]
  );

  /* Release the object URL when it is replaced or unmounted. */
  useEffect(() => {
    if (!preview) return undefined;

    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError("Choose a JPG, PNG, WEBP or AVIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("That image is larger than 5MB.");
      event.target.value = "";
      return;
    }

    setError("");
    onChange(file);
  };

  const shown = preview || currentUrl;

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <div className="admin-image-picker">
        <div className="admin-image-preview">
          {shown ? <img src={shown} alt="" /> : <FaImage />}
        </div>

        <div className="admin-image-actions">
          <button
            type="button"
            className="admin-btn admin-btn-sm"
            onClick={() => inputRef.current?.click()}
          >
            {shown ? "Replace image" : "Choose image"}
          </button>

          {value && (
            <button
              type="button"
              className="admin-btn admin-btn-sm"
              onClick={() => {
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Undo selection
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          className="admin-file-input"
          accept={ACCEPTED.join(",")}
          onChange={handleFile}
        />
      </div>
    </Field>
  );
};

/* ---------------------------------------------------------
   PAGINATION
--------------------------------------------------------- */

export const Pagination = ({ page, limit, total, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / limit));

  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="admin-pagination">
      <span className="admin-pagination-info">
        Showing {from}-{to} of {total}
      </span>

      <div className="admin-btn-group">
        <button
          type="button"
          className="admin-btn admin-btn-sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>

        <span className="admin-pagination-info">
          Page {page} of {pages}
        </span>

        <button
          type="button"
          className="admin-btn admin-btn-sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
