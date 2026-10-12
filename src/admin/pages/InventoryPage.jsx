import { useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaBoxes,
  FaBox,
  FaMinus,
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
  toFormData,
} from "../components/helpers";

const EMPTY_FORM = { name: "", quantity: "0", category: "", notes: "" };

const InventoryPage = () => {
  const toast = useToast();

  const list = useResourceList("/inventory", { limit: 48 });

  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null);

  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adjusting, setAdjusting] = useState(null);

  const setValue = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setImage(null);
    setEditing({ mode: "create" });
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || "",
      quantity: String(item.quantity ?? 0),
      category: item.category || "",
      notes: item.notes || "",
    });

    setImage(null);
    setEditing({ mode: "edit", item });
  };

  const save = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      const body = toFormData(form, { image });

      if (editing.mode === "create") {
        await api.post("/inventory", body);
        toast.success("Inventory item added");
      } else {
        await api.put(`/inventory/${editing.item._id}`, body);
        toast.success("Inventory item updated");
      }

      setEditing(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not save the item");
    } finally {
      setSaving(false);
    }
  };

  /* Quick stock adjustment straight from the card. */
  const adjust = async (item, delta) => {
    setAdjusting(item._id);

    try {
      await api.patch(`/inventory/${item._id}/quantity`, { delta });
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not update the quantity");
    } finally {
      setAdjusting(null);
    }
  };

  const remove = async () => {
    setBusy(true);

    try {
      await api.delete(`/inventory/${confirm._id}`);

      toast.success("Inventory item removed");
      setConfirm(null);
      list.reload();
    } catch (error) {
      toast.error(error.message || "Could not remove the item");
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
            placeholder="Search product name or category..."
          />
        </div>

        <select
          className="admin-select"
          style={{ width: "auto", minWidth: 150 }}
          value={list.sort}
          onChange={(event) => list.toggleSort(event.target.value)}
        >
          <option value="name">Name</option>
          <option value="-quantity">Quantity, high to low</option>
          <option value="quantity">Quantity, low to high</option>
          <option value="-updatedAt">Recently updated</option>
        </select>

        <button
          type="button"
          className="admin-btn admin-btn-primary admin-btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={openCreate}
        >
          <FaPlus /> Add item
        </button>
      </div>

      {list.loading ? (
        <Loading label="Loading inventory..." />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon={<FaBoxes />}
          title="No inventory items"
          description="Track equipment, kits and components the society owns."
          action={
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={openCreate}
            >
              <FaPlus /> Add item
            </button>
          }
        />
      ) : (
        <>
          <div className="admin-grid">
            {list.items.map((item) => (
              <article key={item._id} className="admin-item-card">
                <div className="admin-item-media">
                  {item.image?.url ? (
                    <img src={item.image.url} alt={item.name} loading="lazy" />
                  ) : (
                    <div className="admin-item-placeholder">
                      <FaBox />
                    </div>
                  )}
                </div>

                <div className="admin-item-body">
                  {item.category && (
                    <div>
                      <Badge tone="blue">{item.category}</Badge>
                    </div>
                  )}

                  <h3>{item.name}</h3>

                  <div className="admin-qty">
                    <button
                      type="button"
                      onClick={() => adjust(item, -1)}
                      disabled={
                        item.quantity <= 0 || adjusting === item._id
                      }
                      aria-label="Decrease quantity"
                    >
                      <FaMinus style={{ fontSize: 10 }} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() => adjust(item, 1)}
                      disabled={adjusting === item._id}
                      aria-label="Increase quantity"
                    >
                      <FaPlus style={{ fontSize: 10 }} />
                    </button>
                  </div>

                  {item.notes && <p>{item.notes}</p>}

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
                      className="admin-btn admin-btn-danger admin-btn-sm admin-btn-icon"
                      onClick={() => setConfirm(item)}
                      style={{ marginLeft: "auto" }}
                      title="Remove"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </article>
            ))}
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
            ? "Add inventory item"
            : "Edit inventory item"
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
              form="inventory-form"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving && <span className="admin-spinner small" />}
              Save item
            </button>
          </>
        }
      >
        <form id="inventory-form" onSubmit={save}>
          <div className="admin-form-grid">
            <Field label="Product name" required>
              <input
                className="admin-input"
                value={form.name}
                onChange={(event) => setValue("name", event.target.value)}
                required
              />
            </Field>

            <Field label="Quantity" required>
              <input
                className="admin-input"
                type="number"
                min="0"
                value={form.quantity}
                onChange={(event) =>
                  setValue("quantity", event.target.value)
                }
                required
              />
            </Field>

            <Field label="Category">
              <input
                className="admin-input"
                value={form.category}
                onChange={(event) =>
                  setValue("category", event.target.value)
                }
                placeholder="Sensors, Motors, Tools..."
              />
            </Field>

            <div className="admin-form-full">
              <ImagePicker
                label="Product image"
                value={image}
                onChange={setImage}
                currentUrl={editing?.item?.image?.url}
              />
            </div>

            <Field label="Notes" full>
              <textarea
                className="admin-textarea"
                value={form.notes}
                onChange={(event) => setValue("notes", event.target.value)}
                placeholder="Storage location, condition, supplier..."
              />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Remove this item?"
        message={`This permanently removes "${
          confirm?.name || "this item"
        }" and its image from the inventory.`}
        confirmLabel="Remove item"
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </>
  );
};

export default InventoryPage;
