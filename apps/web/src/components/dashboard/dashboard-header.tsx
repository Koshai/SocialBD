"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppearanceControls } from "@/components/preferences/appearance-controls";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";

type DashboardHeaderProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  title: string;
  description?: string;
};

export function DashboardHeader({ user, title, description }: DashboardHeaderProps) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex flex-col gap-4 border-b border-border bg-surface/80 px-6 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AppearanceControls />
        <OrganizationSwitcher />
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
