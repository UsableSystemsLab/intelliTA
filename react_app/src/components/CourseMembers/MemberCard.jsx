import { UserCircle, Mail, Calendar, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const StatusBadge = ({ status, t }) => {
    const config = {
        active: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            text: 'text-emerald-400',
            label: t('statusActive')
        },
        completed: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            text: 'text-blue-400',
            label: t('statusCompleted')
        },
        dropped: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            text: 'text-red-400',
            label: t('statusDropped')
        }
    };

    const { bg, border, text, label } = config[status] || config.active;

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${border} ${text} border`}>
            {label}
        </span>
    );
};

export default function MemberCard({ member, onKick }) {
    const { t } = useTranslation();
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getInitials = (firstName, lastName) => {
        const first = firstName?.charAt(0)?.toUpperCase() || '';
        const last = lastName?.charAt(0)?.toUpperCase() || '';
        return first + last || '?';
    };

    return (
        <div className="group relative bg-gray-800 border border-gray-700 rounded-xl p-4 transition-all duration-300 hover:border-gray-600">
            <div className="flex items-center justify-between gap-4">
                {/* Avatar & Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden">
                        {member.photo_url ? (
                            <img
                                src={member.photo_url}
                                alt={`${member.first_name} ${member.last_name}`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                    {getInitials(member.first_name, member.last_name)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Name & Email */}
                    <div className="min-w-0 flex-1">
                        <h4 className="text-white font-medium truncate">
                            {member.first_name} {member.last_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                        </div>
                    </div>
                </div>

                {/* Enrolled Date */}
                <div className="hidden sm:flex items-center gap-1.5 text-gray-500 text-sm flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(member.enrollment_date)}</span>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                    <StatusBadge status={member.status} t={t} />
                </div>

                {/* Kick Button */}
                <button
                    onClick={() => onKick(member)}
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    title={t('removeFromCourse')}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
