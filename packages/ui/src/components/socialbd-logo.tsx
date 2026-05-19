import { cn } from "../lib/utils";

export function SocialBDLogo({
  className,
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-xl font-bold tracking-tight">
        <span className="text-[var(--sb-primary)]">Social</span>
        <span className="text-[var(--sb-accent)]">BD</span>
      </span>
      {showTagline ? (
        <span className="text-xs text-[var(--sb-muted)]">
          Bangladesh-first social management
        </span>
      ) : null}
    </div>
  );
}
