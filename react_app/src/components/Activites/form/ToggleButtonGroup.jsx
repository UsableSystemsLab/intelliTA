
export default function ToggleButtonGroup({ options, activeValue, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`flex-1 py-2.5 px-4 rounded-xl border font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 ${
            activeValue === option.value
              ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
              : "bg-gray-900/50 border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300"
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.icon && <option.icon className="w-4 h-4" />}
          {option.label}
        </button>
      ))}
    </div>
  );
}
