import Nav from "@/components/Landing-page/Nav";
import Maincontent from "@/components/Leaderboard/Maincontent";
import Footer from "@/components/shared/Footer";
import Sidebar from "@/components/Courses/Sidebar";

export default function Leaderboard({ user }) {
  return (
    <>
      <Nav user={user} />
      <div className="flex relative overflow-hidden bg-transparent min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Maincontent user={user} />
          <Footer />
        </div>
      </div>
    </>
  );
}
