export function PageSkeleton({
  cards = 4,
  cardClass = "h-24",
}: {
  cards?: number;
  cardClass?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className={`${cardClass} bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse`}
          />
        ))}
      </div>
    </div>
  );
}
