import Nav from "@/components/Courses/Nav";
import Maincontent from "@/components/Activity/Maincontent";
import Footer from "@/components/Courses/Footer";

export default function Activity({ user }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#0d1117]">
            <Nav user={user} />
            <div className="flex-1 overflow-hidden relative">
                <Maincontent user={user} />
            </div>
            <Footer />
        </div>
    );
}