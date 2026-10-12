import { FaMedal } from "react-icons/fa";

import ContentManager from "../components/ContentManager";
import { Badge } from "../components/ui";

const FIELDS = [
  { name: "name", label: "Name", required: true },
  {
    name: "title",
    label: "Card label",
    placeholder: "ALUMNI OF THE YEAR",
    hint: "The highlighted line above the name on the public card.",
  },
  {
    name: "designation",
    label: "Recognition",
    placeholder: "Outstanding contribution to GEARS",
  },
  { name: "year", label: "Year", placeholder: "2025" },
  {
    name: "isActive",
    label: "Visibility",
    type: "switch",
    defaultValue: true,
    switchLabel: "Show on the public team page",
  },
  { name: "description", label: "Description", type: "textarea" },
];

const AlumniPage = () => (
  <ContentManager
    path="/alumni"
    title="Alumni of the Year"
    singular="Alumni record"
    icon={<FaMedal />}
    fields={FIELDS}
    imageFields={[
      {
        name: "image",
        label: "Photo",
        hint: "Shown in the Alumni of the Year cards.",
      },
    ]}
    searchPlaceholder="Search alumni name or year..."
    emptyDescription="Recognised alumni appear in their own section on the public team page."
    renderTitle={(item) => item.name}
    renderSubtitle={(item) => item.designation || item.description}
    renderBadges={(item) => (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge tone="orange">{item.title || "Alumni"}</Badge>

        {item.year && <Badge tone="blue">{item.year}</Badge>}

        {!item.isActive && <Badge tone="red">Hidden</Badge>}
      </div>
    )}
  />
);

export default AlumniPage;
