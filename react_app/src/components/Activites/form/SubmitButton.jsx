import { Loader, Sparkles } from "lucide-react";
export default function SubmitButton({
  loading = false,
  label = "Submit",
  loadingLabel = "Processing...",
  icon: Icon = Sparkles,
  className = "",
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-green-500/25 ${className}`}
    >
      {loading ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          <Icon className="w-5 h-5" />
          {label}
        </>
      )}
    </button>
  );
}
