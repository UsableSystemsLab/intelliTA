import { Outlet } from "react-router-dom";
import Nav from "@/components/Landing-page/Nav";
import DocsSidebar from "./DocsSidebar";


export default function DocsLayout({ user }) {
  return (
    <div className="docs-root min-h-screen bg-gray-950 text-gray-100">
      <Nav user={user} />
      <div className="flex max-w-[1600px] mx-auto">
        <DocsSidebar />
        <main className="flex-1 min-w-0">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
