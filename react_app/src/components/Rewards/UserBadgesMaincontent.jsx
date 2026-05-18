import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BadgesGrid from "@/components/Rewards/BadgesGrid";

// Public-style badges view for any student (/users/:userId/badges).
export default function UserBadgesMaincontent() {
  const { userId } = useParams();
  const { t } = useTranslation();
  const numericId = parseInt(userId, 10);

  if (!Number.isInteger(numericId)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-gray-500 text-sm">
          {t("rewards.invalidUser", { defaultValue: "Unknown user." })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-white mb-6">
        {t("rewards.badgesTitle", { defaultValue: "Badges" })}
      </h1>
      <BadgesGrid userId={numericId} />
    </div>
  );
}
