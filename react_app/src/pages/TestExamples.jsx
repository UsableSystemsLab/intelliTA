import TestExamplesContent from "@/components/TestExamples/Maincontent";
import DocsTOC from "@/components/Docs/DocsTOC";

const TOC = [
  { id: "overview", label: "How Tests Work" },
  { id: "naming", label: "File Naming" },
  { id: "rules", label: "Language Rules" },
  { id: "examples", label: "Code Examples" },
  { id: "bound-test", label: "Bound Tests" },
  { id: "assertions", label: "Assertions" },
  { id: "mistakes", label: "Common Mistakes" },
];

export default function TestExamples({ user }) {
  return (
    <div className="flex">
      <TestExamplesContent user={user} />
      <DocsTOC items={TOC} />
    </div>
  );
}
