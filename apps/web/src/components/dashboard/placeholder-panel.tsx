import Link from "next/link";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

type PlaceholderPanelProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function PlaceholderPanel({
  title,
  description,
  ctaLabel,
  ctaHref,
}: PlaceholderPanelProps) {
  return (
    <Card className="max-w-2xl">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      {ctaLabel && ctaHref ? (
        <div className="mt-4">
          <Link href={ctaHref}>
            <Button variant="outline">{ctaLabel}</Button>
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
