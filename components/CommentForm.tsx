"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/app/actions";

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError("");
    const result = await addComment(data);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3">
      <input type="hidden" name="postId" value={postId} />
      <div className="flex gap-2">
        <input name="content" required maxLength={500} className="field" placeholder="Add a comment…" aria-label="Add a comment" />
        <button type="submit" disabled={pending} className="btn-ghost shrink-0">
          {pending ? "…" : "Comment"}
        </button>
      </div>
      {error && <p className="mt-1 text-[13px] text-stop">{error}</p>}
    </form>
  );
}
