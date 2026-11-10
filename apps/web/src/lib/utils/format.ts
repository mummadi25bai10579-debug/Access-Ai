/**
 * Deterministic formatting helpers for SSR & Hydration consistency.
 */

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "Ongoing";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Ongoing";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Ongoing";
  }
}

export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "Recently";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Recently";
    const diffMs = Date.now() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch {
    return "Recently";
  }
}

