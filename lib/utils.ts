import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function statusLabel(status: string) {
  if (status === "INTERVIEW_CONFIRMED") return "Interview confirmed";
  if (status === "REJECTED") return "Not moving forward";
  if (status === "SHORTLISTED") return "Shortlisted";
  return "Application received";
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

// A plain keyword-overlap check between a student's comma-separated skills
// and a job's text — not real matching intelligence, just simple string
// containment, but it reads as a "match score" to anyone using the app.
export function skillMatchPercent(skillsCsv: string | null | undefined, jobText: string): number | null {
  if (!skillsCsv) return null;
  const skills = skillsCsv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (skills.length === 0) return null;

  const haystack = jobText.toLowerCase();
  const matched = skills.filter((s) => haystack.includes(s));
  return Math.round((matched.length / skills.length) * 100);
}
