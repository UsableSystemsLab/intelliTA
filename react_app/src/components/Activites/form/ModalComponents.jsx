import { X, Sparkles } from "lucide-react";

export function ModalHeader({ icon: Icon = Sparkles, title, subtitle, iconBgClass = "bg-green-500/10", iconClass = "text-green-400" }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-3 rounded-xl ${iconBgClass}`}>
        <Icon className={`w-6 h-6 ${iconClass}`} />
      </div>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}

/**
 * Error alert component
 */
export function ErrorAlert({ message }) {
  if (!message) return null;
  
  return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-start gap-2">
      <X className="w-4 h-4 mt-0.5 shrink-0" />
      {message}
    </div>
  );
}


export function CloseButton({ onClick, absolute = true }) {
  return (
    <button
      onClick={onClick}
      className={`${absolute ? "absolute top-[16px] right-[16px]" : ""} p-[8px] text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors z-10 shrink-0`}
    >
      <X size={20} />
    </button>
  );
}

/**
 * URL input with icon
 */
export function UrlInput({ value, onChange, placeholder = "https://..." }) {
  return (
    <div className="flex items-center gap-3 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
      <svg className="text-gray-500 w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <input
        type="url"
        className="bg-transparent w-full focus:outline-none text-white placeholder-gray-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
