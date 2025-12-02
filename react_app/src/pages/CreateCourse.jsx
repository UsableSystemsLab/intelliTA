import Nav from "@/components/Courses/Nav";
import Sidebar from "@/components/Courses/Sidebar";
import Footer from "@/components/Courses/Footer";
import CreateCourseMain from "@/components/CreateCourse/Maincontent";

export default function CreateCourse({ user }) {
  return (
    <>
      <Nav user={user} />

      <div className="flex relative overflow-hidden bg-gray-900 min-h-screen">
        <Sidebar />
        <CreateCourseMain />
      </div>
      <Footer />
    </>
  );
}
