"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUserAction } from "@/app/actions";
import { cn } from "@/lib/utils";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "Working…" : children}
    </button>
  );
}

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"STUDENT" | "COMPANY">("STUDENT");
  const [signInError, setSignInError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [state, formAction] = useFormState(registerUserAction, null);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignInError("");
    setSigningIn(true);

    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      redirect: false,
      email: String(data.get("email") || ""),
      password: String(data.get("password") || ""),
    });

    setSigningIn(false);
    if (result?.error) {
      setSignInError("That email and password do not match an account.");
      return;
    }
    router.refresh();
    router.push("/");
  }

  return (
    <div className="panel p-6">
      <div className="mb-5 flex gap-1 rounded-md border border-line p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-[13px] font-medium transition-colors",
              mode === m ? "bg-paper text-ink" : "text-mist hover:text-paper",
            )}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {mode === "signin" ? (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="label" htmlFor="si-email">
              Email
            </label>
            <input id="si-email" name="email" type="email" required className="field" placeholder="you@college.edu" />
          </div>
          <div>
            <label className="label" htmlFor="si-password">
              Password
            </label>
            <input id="si-password" name="password" type="password" required className="field" placeholder="••••••••" />
          </div>
          {signInError && <p className="text-[13px] text-stop">{signInError}</p>}
          <button type="submit" disabled={signingIn} className="btn-primary w-full">
            {signingIn ? "Checking…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="su-role">
              I am here to
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["STUDENT", "COMPANY"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-[13px] font-medium transition-colors",
                    role === r ? "border-signal bg-signal/10 text-signal" : "border-line text-mist hover:text-paper",
                  )}
                >
                  {r === "STUDENT" ? "Find a job" : "Hire people"}
                </button>
              ))}
            </div>
            <input type="hidden" name="role" value={role} />
          </div>
          <div>
            <label className="label" htmlFor="su-name">
              {role === "COMPANY" ? "Company name" : "Full name"}
            </label>
            <input id="su-name" name="name" required className="field" placeholder={role === "COMPANY" ? "Northwind Labs" : "Asha Menon"} />
          </div>
          <div>
            <label className="label" htmlFor="su-email">
              Email
            </label>
            <input id="su-email" name="email" type="email" required className="field" />
          </div>
          <div>
            <label className="label" htmlFor="su-password">
              Password
            </label>
            <input id="su-password" name="password" type="password" required minLength={6} className="field" placeholder="At least 6 characters" />
          </div>
          {state && <p className={cn("text-[13px]", state.ok ? "text-go" : "text-stop")}>{state.message}</p>}
          <Submit>Create account</Submit>
        </form>
      )}
    </div>
  );
}
