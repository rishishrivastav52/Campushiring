// Sends a plain-text email through Resend's HTTP API directly (no SDK needed,
// so nobody has to `npm install` anything extra to get this working).
//
// If RESEND_API_KEY isn't set, this quietly does nothing — the app keeps
// working exactly as before, it just skips the email. That means the feature
// is fully optional and never blocks a signup, application, or deploy.

type StatusEmailKind = "INTERVIEW_CONFIRMED" | "REJECTED";

export async function sendStatusEmail(to: string, jobTitle: string, kind: StatusEmailKind) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const subject =
    kind === "INTERVIEW_CONFIRMED" ? `Interview confirmed — ${jobTitle}` : `Update on your application — ${jobTitle}`;

  const text =
    kind === "INTERVIEW_CONFIRMED"
      ? `Good news — the company has confirmed an interview for "${jobTitle}". Sign in to CampusHiring to see the details.`
      : `The company has decided not to move forward with your application for "${jobTitle}". Keep applying — new roles are posted regularly.`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "CampusHiring <onboarding@resend.dev>",
        to,
        subject,
        text,
      }),
    });

    if (!res.ok) {
      console.error("Resend API error:", await res.text());
    }
  } catch (err) {
    // Never let an email failure break the status update itself.
    console.error("Failed to send status email:", err);
  }
}
