export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="mt-8 flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
