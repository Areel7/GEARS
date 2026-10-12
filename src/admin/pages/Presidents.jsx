import { FaCrown } from "react-icons/fa";

import ContentManager from "../components/ContentManager";
import { Badge } from "../components/ui";

const FIELDS = [
  { name: "name", label: "Name", required: true },
  {
    name: "designation",
    label: "Designation",
    placeholder: "President",
  },
  {
    name: "startYear",
    label: "Start year",
    placeholder: "2024",
    hint: "Shown as the session, e.g. 2024 - 2025.",
  },
  { name: "endYear", label: "End year", placeholder: "2025" },
  {
    name: "isCurrent",
    label: "Current president",
    type: "switch",
    switchLabel: "Show the session as 'Present'",
    hint: "Leave the end year empty for an ongoing term.",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
  },
];

const session = (item) => {
  if (!item.startYear) return item.endYear || "";

  const end = item.isCurrent ? "Present" : item.endYear;

  return end ? `${item.startYear} - ${end}` : item.startYear;
};

const Presidents = () => (
  <ContentManager
    path="/president"
    title="Presidents"
    singular="President"
    icon={<FaCrown />}
    fields={FIELDS}
    imageFields={[
      {
        name: "image",
        label: "Photo",
        hint: "Shown in the Past Presidents grid on the team page.",
      },
    ]}
    searchPlaceholder="Search president name or year..."
    emptyDescription="Historical presidents appear on the public team page. Records are kept so the legacy section stays complete."
    renderTitle={(item) => item.name}
    renderSubtitle={(item) => item.description}
    renderBadges={(item) => (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge tone="orange">{session(item) || "No session"}</Badge>

        {item.isCurrent && <Badge tone="green">Current</Badge>}
      </div>
    )}
  />
);

export default Presidents;
