"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost">
      <LogOut className="h-3.5 w-3.5" aria-hidden />
      Sign out
    </button>
  );
}
