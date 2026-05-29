"use client";

import { useEffect, useRef, useState } from "react";

export function InfoTooltip({ message }: { message: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="More info"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="size-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold leading-none flex items-center justify-center hover:bg-amber-300 hover:text-zinc-950 transition"
      >
        ?
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 z-20 rounded-2xl bg-white dark:bg-zinc-900 ring-2 ring-zinc-950/10 dark:ring-zinc-100/10 shadow-[0_4px_0_0_rgba(0,0,0,0.08)] p-3 text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {message}
        </div>
      )}
    </div>
  );
}
