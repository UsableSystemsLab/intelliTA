import { X } from "lucide-react";
import MembersList from "./MembersList";

export default function MembersModal({ courseId, user, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Course Members</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative z-10 p-6 overflow-y-auto">
                    <MembersList
                        courseId={courseId}
                        user={user}
                        onClose={onClose}
                    />
                </div>
            </div>
        </div>
    );
}
