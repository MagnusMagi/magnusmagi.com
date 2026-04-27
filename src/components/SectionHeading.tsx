interface SectionHeadingProps {
  eyebrow?: string;
  heading: string;
}

export function SectionHeading({ eyebrow, heading }: SectionHeadingProps) {
  return (
    <div className="mb-10 flex flex-col gap-2">
      {eyebrow ? (
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {heading}
      </h2>
    </div>
  );
}
