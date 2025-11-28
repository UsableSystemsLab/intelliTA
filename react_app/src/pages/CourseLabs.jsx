import Nav from "@/components/Courses/Nav";
import Maincontent from "@/components/Activites/MainContent";
import Footer from "@/components/Courses/Footer";
import Sidebar from "@/components/Courses/Sidebar";

export default function CourseLabs({ user }) {

  return (
    <>
      <Nav user={user} />
      <div className="flex relative overflow-hidden bg-transparent min-h-screen">
        <Sidebar />
        <Maincontent />
      </div>
      <Footer />
    </>

    
  );
}
