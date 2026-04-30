import { Link } from "@/i18n/navigation";

interface TagChipProps {
  tag: string;
  count?: number;
}

export function TagChip({ tag, count }: TagChipProps) {
  return (
    <Link
      href={`/writing/tag/${encodeURIComponent(tag)}`}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-subtle/40 px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span>#{tag}</span>
      {typeof count === "number" ? (
        <span className="font-mono text-[10px] tabular-nums">{count}</span>
      ) : null}
    </Link>
  );
}
