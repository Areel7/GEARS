import { useState } from "react";
import { FaSave } from "react-icons/fa";

import { useSettings } from "../SettingsContext";
import { useToast } from "../ToastContext";

import {
  Badge,
  Field,
  Loading,
  Switch,
} from "../components/ui";

import {
  formatDateTime,
} from "../components/helpers";

/*
  Rendered only once the settings document has loaded, so the form
  seeds itself from it instead of syncing through an effect.
*/
const SettingsForm = ({ settings }) => {
  const { setRegistrationEnabled, updateSettings } = useSettings();

  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [form, setForm] = useState(() => ({
    registrationClosedMessage: settings.registrationClosedMessage || "",
    homeGalleryLimit: settings.homeGalleryLimit ?? 12,
    galleryLimit: settings.galleryLimit ?? 60,
  }));

  const setValue = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleRegistration = async (enabled) => {
    setToggling(true);

    try {
      await setRegistrationEnabled(enabled);

      toast.success(
        enabled
          ? "Registration is now open on the public website."
          : "Registration is now closed. The form and navigation link are hidden."
      );
    } catch (error) {
      toast.error(error.message || "Could not update the setting");
    } finally {
      setToggling(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      await updateSettings(form);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error.message || "Could not save the settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* ============ REGISTRATION SWITCH ============ */}

      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <h2>Site Settings</h2>
            <p>Stored in MongoDB and applied to the public site immediately</p>
          </div>
        </div>

        <div className="admin-setting-row">
          <div className="admin-setting-text">
            <h3>Registration Status</h3>

            <p>
              When this is on, the registration page and its navigation
              links are visible and submissions are accepted. When it is
              off, the page shows a closed message, the links are hidden,
              and the server rejects any submission sent directly to the
              API.
            </p>

            <p style={{ marginTop: 10, color: "var(--faint)" }}>
              Last updated {formatDateTime(settings.updatedAt)}
              {settings.updatedBy
                ? ` by ${settings.updatedBy.name} (${settings.updatedBy.designation})`
                : ""}
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
            <Badge tone={settings.registrationEnabled ? "green" : "red"}>
              {settings.registrationEnabled ? "ON" : "OFF"}
            </Badge>

            <Switch
              checked={settings.registrationEnabled}
              disabled={toggling}
              onChange={toggleRegistration}
            />
          </div>
        </div>
      </section>

      {/* ============ OTHER SETTINGS ============ */}

      <section className="admin-section">
        <form className="admin-card admin-card-pad" onSubmit={save}>
          <div className="admin-section-head">
            <div>
              <h2>Display &amp; Messaging</h2>
              <p>Controls how much content the public pages render</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <Field
              label="Registration closed message"
              full
              hint="Shown on the registration page while registration is off."
            >
              <input
                className="admin-input"
                value={form.registrationClosedMessage}
                onChange={(event) =>
                  setValue("registrationClosedMessage", event.target.value)
                }
                placeholder="Registration is currently closed."
              />
            </Field>

            <Field
              label="Home gallery display limit"
              hint="The home achievements grid is a fixed CSS layout with 13 positions. Adding images will not change the home page until this limit is raised."
            >
              <input
                className="admin-input"
                type="number"
                min="0"
                max="13"
                value={form.homeGalleryLimit}
                onChange={(event) =>
                  setValue("homeGalleryLimit", event.target.value)
                }
              />
            </Field>

            <Field
              label="Gallery page display limit"
              hint="Maximum number of images rendered on the public gallery page."
            >
              <input
                className="admin-input"
                type="number"
                min="0"
                max="500"
                value={form.galleryLimit}
                onChange={(event) =>
                  setValue("galleryLimit", event.target.value)
                }
              />
            </Field>
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving ? (
                <span className="admin-spinner small" />
              ) : (
                <FaSave />
              )}
              Save settings
            </button>
          </div>
        </form>
      </section>
    </>
  );
};

const Settings = () => {
  const { settings, loading } = useSettings();

  if (loading || !settings) return <Loading label="Loading settings..." />;

  return <SettingsForm settings={settings} />;
};

export default Settings;
