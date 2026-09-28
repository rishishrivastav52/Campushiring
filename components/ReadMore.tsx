"use client";

import { useState } from "react";

export function ReadMore({ text, limit = 160 }: { text: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= limit) {
    return <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed whitespace-pre-line text-paper/80">{text}</p>;
  }

  return (
    <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed whitespace-pre-line text-paper/80">
      {expanded ? text : `${text.slice(0, limit)}…`}{" "}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-[13px] font-medium text-signal hover:underline"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </p>
  );
}
