import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-emerald-400/25 dark:bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 size-[28rem] rounded-full bg-amber-300/25 dark:bg-amber-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-4xl select-none" aria-hidden>
          🍜
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-center">
          {title}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 text-center">
          {subtitle}
        </p>

        <div className="mt-8 w-full flex justify-center">{children}</div>
      </div>
    </div>
  );
}
