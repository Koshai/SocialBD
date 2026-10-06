"use client";

import { OrganizationSwitcher } from "@/components/organization/organization-switcher";

import { AccountMenu } from "./account-menu";

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
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description ? (
            <p className="hidden text-sm text-muted sm:block">{description}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <OrganizationSwitcher />
          </div>
          <div className="sm:hidden">
            <AccountMenu user={user} compact />
          </div>
          <div className="hidden sm:block">
            <AccountMenu user={user} />
          </div>
        </div>
      </div>

      <div className="mt-3 md:hidden">
        <OrganizationSwitcher compact />
      </div>
    </header>
  );
}
