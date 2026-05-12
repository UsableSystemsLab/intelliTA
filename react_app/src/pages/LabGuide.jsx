import LabGuideContent from "@/components/LabGuide/Maincontent";
import DocsTOC from "@/components/Docs/DocsTOC";

const TOC = [
  { id: "concept", label: "What is a Lab?" },
  { id: "flow", label: "How It Works" },
  { id: "creation", label: "Creation Steps" },
  { id: "checkpoints", label: "Checkpoint Types" },
  { id: "tests", label: "Writing Tests" },
  { id: "hints", label: "AI Hints" },
  { id: "example", label: "Full Example" },
];

export default function LabGuide({ user }) {
  return (
    <div className="flex">
      <LabGuideContent user={user} />
      <DocsTOC items={TOC} />
    </div>
  );
}
