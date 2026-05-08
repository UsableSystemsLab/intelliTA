import Nav from "@/components/Landing-page/Nav";
import Maincontent from "@/components/Activity/Maincontent";

export default function Activity({ user }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#0d1117]">
            {/* Removing nav from Activity page for better UX */}
            <div className="flex-1 overflow-hidden relative">
                <Maincontent user={user} />
            </div>
            {/* Footer removed for full-screen IDE experience */}
        </div>
    );
}