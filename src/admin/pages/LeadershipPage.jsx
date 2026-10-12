import { FaChalkboardTeacher } from "react-icons/fa";

import ContentManager from "../components/ContentManager";
import { Badge } from "../components/ui";

const FIELDS = [
  { name: "name", label: "Name", required: true },
  {
    name: "designation",
    label: "Designation",
    placeholder: "Supervisor",
  },
  { name: "session", label: "Session", placeholder: "2024 - 2025" },
  {
    name: "isActive",
    label: "Visibility",
    type: "switch",
    defaultValue: true,
    switchLabel: "Show on the public team page",
  },
  {
    name: "showOnHome",
    label: "Home page strip",
    type: "switch",
    switchLabel: "Include in the OUR TEAM strip on the home page",
    hint: "The home page shows a short, curated list rather than everyone.",
  },
  {
    name: "description",
    label: "Message",
    type: "textarea",
    placeholder: "Quoted under the name on the team page.",
  },
];

const LeadershipPage = () => (
  <ContentManager
    path="/leadership"
    title="Leadership"
    singular="Leadership record"
    icon={<FaChalkboardTeacher />}
    fields={FIELDS}
    imageFields={[
      {
        name: "image",
        label: "Team page photo",
        hint: "Shown in the leadership list on the /team page.",
      },
      {
        name: "homeImage",
        label: "Home page photo",
        hint: "Used in the home page strip. Falls back to the team page photo.",
      },
    ]}
    searchPlaceholder="Search leadership name or role..."
    emptyDescription="Supervisors and mentors shown in the leadership section of the public team page."
    renderTitle={(item) => item.name}
    renderSubtitle={(item) => item.description}
    renderBadges={(item) => (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge tone="orange">{item.designation || "Leadership"}</Badge>

        {item.showOnHome && <Badge tone="blue">On home</Badge>}

        {!item.isActive && <Badge tone="red">Hidden</Badge>}
      </div>
    )}
  />
);

export default LeadershipPage;
