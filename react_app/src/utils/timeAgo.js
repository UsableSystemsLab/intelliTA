// Compact relative timestamp ("just now", "5m", "3h", "2d", or a date).
// Shared by notifications and the points-history table.
export function timeAgo(input) {
  if (!input) return "";
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(then).toLocaleDateString();
}

export default timeAgo;
