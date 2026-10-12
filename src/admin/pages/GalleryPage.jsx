import { FaImages } from "react-icons/fa";

import ContentManager from "../components/ContentManager";
import { Badge } from "../components/ui";

const FIELDS = [
  { name: "title", label: "Title", placeholder: "Robotics Workshop 9.0" },
  {
    name: "category",
    label: "Category",
    placeholder: "GEARS",
    hint: "Shown in the overlay on the public gallery card.",
  },
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
    switchLabel: "Show on the public gallery page",
  },
  { name: "description", label: "Description", type: "textarea" },
];

const GalleryPage = () => (
  <ContentManager
    path="/gallery"
    title="Gallery images"
    singular="Gallery image"
    icon={<FaImages />}
    fields={FIELDS}
    imageFields={[
      { name: "image", label: "Image", required: true },
    ]}
    searchPlaceholder="Search title, category..."
    emptyDescription="Images shown on the public gallery page, in the order set here."
    renderTitle={(item) => item.title || item.alt || "Untitled image"}
    renderSubtitle={(item) => item.description}
    gridClass="admin-grid"
    renderBadges={(item) => (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge tone="orange">{item.category || "GEARS"}</Badge>

        {!item.isActive && <Badge tone="red">Hidden</Badge>}
      </div>
    )}
  />
);

export default GalleryPage;
