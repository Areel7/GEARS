import { Link } from "react-router-dom";
import { FaHome, FaInfoCircle } from "react-icons/fa";

import ContentManager from "../components/ContentManager";
import { Badge } from "../components/ui";
import { useSettings } from "../SettingsContext";

const FIELDS = [
  { name: "title", label: "Title", placeholder: "NERC 2024" },
  {
    name: "alt",
    label: "Alt text",
    hint: "Describes the image for screen readers and when it fails to load.",
  },
  {
    name: "isActive",
    label: "Visibility",
    type: "switch",
    defaultValue: true,
    switchLabel: "Available for the home page grid",
  },
];

const HomeImagesPage = () => {
  const { settings } = useSettings();

  const limit = settings?.homeGalleryLimit ?? 12;

  return (
    <>
      {/*
        The home achievements grid is a hand-authored CSS layout with a
        fixed number of positions, so adding images here does not change
        the public page until the limit is raised deliberately.
      */}
      <div
        className="admin-card admin-card-pad"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <FaInfoCircle
          style={{ color: "var(--blue)", fontSize: 16, marginTop: 2 }}
        />

        <div>
          <strong style={{ fontSize: 13 }}>
            The home page shows the first {limit} images
          </strong>

          <p
            style={{
              margin: "5px 0 0",
              color: "var(--muted)",
              fontSize: 12,
              lineHeight: 1.7,
            }}
          >
            That grid is a fixed layout, so adding images here will not
            change the home page until you raise the display limit in{" "}
            <Link
              to="/admin/settings"
              style={{ color: "var(--orange)" }}
            >
              Settings
            </Link>
            . Use the arrows below to choose which images fill those
            positions.
          </p>
        </div>
      </div>

      <ContentManager
        path="/home-images"
        title="Home images"
        singular="Home image"
        icon={<FaHome />}
        fields={FIELDS}
        imageFields={[{ name: "image", label: "Image", required: true }]}
        searchPlaceholder="Search title or alt text..."
        emptyDescription="Images in the OUR ACHIEVEMENTS grid on the home page."
        gridClass="admin-grid"
        renderTitle={(item) => item.title || item.alt || "Untitled image"}
        renderSubtitle={(item) => item.alt}
        renderBadges={(item) => (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!item.isActive && <Badge tone="red">Hidden</Badge>}
          </div>
        )}
      />
    </>
  );
};

export default HomeImagesPage;
