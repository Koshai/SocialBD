import { cn } from "../lib/utils";

export function QueueOraLogo({
  className,
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-xl font-bold tracking-tight">
        <span className="text-[var(--sb-primary)]">Queue</span>
        <span className="text-[var(--sb-accent)]">Ora</span>
      </span>
      {showTagline ? (
        <span className="text-xs text-[var(--sb-muted)]">Social media scheduling made simple</span>
      ) : null}
    </div>
  );
}

/** @deprecated Use QueueOraLogo */
export const SocialBDLogo = QueueOraLogo;
