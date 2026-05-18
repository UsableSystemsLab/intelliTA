import { useState, useEffect } from "react";
import { Users, Search, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_BASE, getAuthHeaders } from "../../config/api";
import { auth } from "@/utils/firebase.js";
import MemberCard from "./MemberCard";
import KickConfirmModal from "./KickConfirmModal";

export default function MembersList({ courseId, user, onClose }) {
    const { t } = useTranslation();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [memberToKick, setMemberToKick] = useState(null);
    const [kicking, setKicking] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, [courseId, user]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(
                `${API_BASE}/courses/${courseId}/students?firebaseId=${user.uid}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        ...await getAuthHeaders(auth.currentUser),
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch members");
            }

            const data = await response.json();
            setMembers(data);
        } catch (err) {
            console.error("Error loading members:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKick = async () => {
        if (!memberToKick) return;

        setKicking(true);
        try {
            const response = await fetch(
                `${API_BASE}/courses/${courseId}/students/${memberToKick.user_id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        ...await getAuthHeaders(auth.currentUser),
                    },
                    body: JSON.stringify({ firebaseId: user.uid }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to remove student");
            }

            setMembers(prev => prev.filter(m => m.user_id !== memberToKick.user_id));
            setMemberToKick(null);
        } catch (err) {
            console.error("Error removing student:", err);
            alert(t("failedToRemoveStudent"));
        } finally {
            setKicking(false);
        }
    };

    const filteredMembers = members.filter(member => {
        const searchLower = searchTerm.toLowerCase();
        return (
            member.first_name?.toLowerCase().includes(searchLower) ||
            member.last_name?.toLowerCase().includes(searchLower) ||
            member.email?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400">{t('loadingMembers')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <p className="text-gray-400">{error}</p>
                <button
                    onClick={fetchMembers}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    {t('retry')}
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            {t('enrolledStudents')}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {members.length} {members.length === 1 ? t('studentEnrolledSingular') : t('studentEnrolledPlural')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Search */}
            {members.length > 0 && (
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder={t('searchMembers')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            )}

            {/* Members List */}
            {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-gray-700">
                        <Users className="w-8 h-8 text-gray-600" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-300 mb-2">
                        {t('noStudentsYet')}
                    </h4>
                    <p className="text-gray-500 max-w-sm">
                        {t('shareTokenHint')}
                    </p>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">{t('noSearchResults')}</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {filteredMembers.map(member => (
                        <MemberCard
                            key={member.user_id}
                            member={member}
                            onKick={setMemberToKick}
                            courseId={courseId}
                        />
                    ))}
                </div>
            )}

            {/* Kick Confirmation Modal */}
            {memberToKick && (
                <KickConfirmModal
                    member={memberToKick}
                    onConfirm={handleKick}
                    onClose={() => setMemberToKick(null)}
                    loading={kicking}
                />
            )}
        </div>
    );
}
