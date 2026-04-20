import { useTranslation } from "react-i18next";

export default function StatusBadge({ status }) {
  const { t } = useTranslation();

  return (
    <div className=" bottom-2 right-2">
      {status ? (
        <span className="
          text-green-400
          bg-gray-900
          border border-gray-700
          px-2 py-0.5
          text-xs
          rounded
          font-mono
        ">
          {t("started")}
        </span>
      ) : (
        <span className="
          text-gray-300
          bg-gray-900
          border border-gray-700
          px-2 py-0.5
          text-xs
          rounded
          font-mono
        ">
          {t("notStarted")}
        </span>
      )}
    </div>
  );
}
