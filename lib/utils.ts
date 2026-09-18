import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function statusLabel(status: string) {
  if (status === "INTERVIEW_CONFIRMED") return "Interview confirmed";
  if (status === "REJECTED") return "Not moving forward";
  return "Application received";
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
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
