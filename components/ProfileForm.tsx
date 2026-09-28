"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateProfileAction } from "@/app/actions";
import { cn } from "@/lib/utils";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving…" : "Save profile"}
    </button>
  );
}

type Props = {
  headline: string | null;
  bio: string | null;
  skills: string | null;
  experience: string | null;
  hometown: string | null;
  openToWork: boolean;
};

export function ProfileForm({ headline, bio, skills, experience, hometown, openToWork }: Props) {
  const [state, formAction] = useFormState(updateProfileAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="headline">Headline</label>
        <input
          id="headline"
          name="headline"
          defaultValue={headline ?? ""}
          className="field"
          placeholder="Final-year CS student, into backend systems"
        />
      </div>
      <div>
        <label className="label" htmlFor="skills">Skills</label>
        <input
          id="skills"
          name="skills"
          defaultValue={skills ?? ""}
          className="field"
          placeholder="Python, React, SQL — comma separated"
        />
      </div>
      <div>
        <label className="label" htmlFor="bio">About you</label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={bio ?? ""}
          className="field"
          placeholder="A few lines a company would want to read before an interview."
        />
      </div>
      <div>
        <label className="label" htmlFor="hometown">Where you're from</label>
        <input
          id="hometown"
          name="hometown"
          defaultValue={hometown ?? ""}
          className="field"
          placeholder="City, so we can suggest roles near you"
        />
      </div>
      <div>
        <label className="label" htmlFor="experience">What you were doing before</label>
        <textarea
          id="experience"
          name="experience"
          rows={4}
          defaultValue={experience ?? ""}
          className="field"
          placeholder="Past internships, jobs, or projects — one or two lines each is plenty."
        />
      </div>
      <label className="flex items-center gap-2 text-[14px] text-paper/90">
        <input type="checkbox" name="openToWork" defaultChecked={openToWork} className="h-4 w-4 accent-[#FFB020]" />
        Open to work — show a badge on my profile
      </label>
      <div className="flex items-center gap-4">
        <Submit />
        {state && <p className={cn("text-[13px]", state.ok ? "text-go" : "text-stop")}>{state.message}</p>}
      </div>
    </form>
  );
}
