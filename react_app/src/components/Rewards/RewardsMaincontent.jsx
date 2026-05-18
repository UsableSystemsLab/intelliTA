import { useTranslation } from "react-i18next";
import RewardsSummary from "@/components/Rewards/RewardsSummary";
import BadgesGrid from "@/components/Rewards/BadgesGrid";
import PointsHistory from "@/components/Rewards/PointsHistory";

// The caller's own rewards dashboard (/rewards/me).
export default function RewardsMaincontent({ user }) {
  const { t } = useTranslation();
  const userId = user?.id;

  if (!userId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-gray-500 text-sm">
          {t("rewards.unavailable", {
            defaultValue: "Your rewards profile isn't available yet.",
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-white mb-6">
        {t("rewards.myProgress", { defaultValue: "My Progress" })}
      </h1>

      <RewardsSummary userId={userId} />

      <div className="mt-8">
        <BadgesGrid userId={userId} />
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-white mb-2">
          {t("rewards.pointsHistory", { defaultValue: "Points history" })}
        </h2>
        <PointsHistory userId={userId} />
      </div>
    </div>
  );
}
