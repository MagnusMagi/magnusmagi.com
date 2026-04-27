import { Link } from "@/i18n/navigation";

interface TagChipProps {
  tag: string;
  count?: number;
}

export function TagChip({ tag, count }: TagChipProps) {
  return (
    <Link
      href={`/writing/tag/${encodeURIComponent(tag)}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-subtle/40 px-3 py-1 text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent"
    >
      <span>#{tag}</span>
      {typeof count === "number" ? (
        <span className="font-mono text-[10px] tabular-nums">{count}</span>
      ) : null}
    </Link>
  );
}
