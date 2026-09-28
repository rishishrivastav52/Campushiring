"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";

export function LiveTimeAgo({ date }: { date: Date | string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return <>{timeAgo(new Date(date))}</>;
}
