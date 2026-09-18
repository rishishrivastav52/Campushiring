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
