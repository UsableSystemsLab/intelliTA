import { Type } from "lucide-react";
export default function FormInput({
  label,
  icon: Icon = Type,
  type = "text",
  required = false,
  placeholder = "",
  value,
  onChange,
  className = "",
}) {
  const baseInputClass = "w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all";
  const dateClass = type === "datetime-local" ? "[color-scheme:dark]" : "";

  return (
    <div className={className}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
        <Icon className="w-4 h-4 text-gray-500" />
        {label}
      </label>
      <input
        type={type}
        required={required}
        className={`${baseInputClass} ${dateClass}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
