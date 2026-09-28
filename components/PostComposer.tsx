"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Send } from "lucide-react";
import { createPost } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

export function PostComposer({ name }: { name: string }) {
  const router = useRouter();
  const [article, setArticle] = useState(false);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!article) data.delete("title");

    setPending(true);
    setMsg(null);
    const result = await createPost(data);
    setPending(false);
    setMsg({ ok: result.ok, text: result.message });

    if (result.ok) {
      form.reset();
      setArticle(false);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel p-4">
      <div className="flex gap-3">
        <Avatar name={name} size={44} />
        <div className="flex-1 space-y-2">
          {article && (
            <input name="title" maxLength={150} className="field font-display text-[16px] font-semibold" placeholder="Article title" />
          )}
          <textarea
            name="content"
            rows={article ? 8 : 3}
            required
            maxLength={5000}
            className="field"
            placeholder={article ? "Write your article…" : "Start a post — share an update, a win, or a question"}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setArticle((v) => !v)} className="btn-ghost">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          {article ? "Switch to short post" : "Write article"}
        </button>
        <div className="flex items-center gap-3">
          {msg && <p className={cn("text-[13px]", msg.ok ? "text-go" : "text-stop")}>{msg.text}</p>}
          <button type="submit" disabled={pending} className="btn-primary">
            <Send className="h-3.5 w-3.5" aria-hidden />
            {pending ? "Posting…" : article ? "Publish" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
