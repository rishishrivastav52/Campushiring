"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { createJobAction } from "@/app/actions";
import { cn } from "@/lib/utils";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      <Plus className="h-4 w-4" aria-hidden />
      {pending ? "Publishing…" : "Publish role"}
    </button>
  );
}

export function CreateJobForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(createJobAction, null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await formAction(formData);
        ref.current?.reset();
      }}
      className="panel p-5"
    >
      <h2 className="font-display text-[17px] font-semibold">Publish a role</h2>
      <p className="mt-1 text-[13px] text-mist">Students see it on the board as soon as you publish.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="title">Role title</label>
          <input id="title" name="title" required className="field" placeholder="Frontend engineer, intern" />
        </div>
        <div>
          <label className="label" htmlFor="location">Location</label>
          <input id="location" name="location" required className="field" placeholder="Mumbai, or Remote" />
        </div>
        <div>
          <label className="label" htmlFor="salary">Salary</label>
          <input id="salary" name="salary" required className="field" placeholder="₹6–9 LPA" />
        </div>
        <div>
          <label className="label" htmlFor="employment">Type</label>
          <select id="employment" name="employment" className="field" defaultValue="Full-time">
            <option>Full-time</option>
            <option>Internship</option>
            <option>Contract</option>
            <option>Part-time</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">What the job involves</label>
          <textarea id="description" name="description" rows={3} className="field" placeholder="Two or three lines on the work, the team, and what you expect on day one." />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <Submit />
        {state && <p className={cn("text-[13px]", state.ok ? "text-go" : "text-stop")}>{state.message}</p>}
      </div>
    </form>
  );
}
