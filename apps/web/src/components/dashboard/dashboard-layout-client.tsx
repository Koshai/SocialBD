"use client";

import { usePathname } from "next/navigation";

import { useDashboardPageMeta } from "@/lib/i18n/use-dashboard-page-meta";
import { DashboardShell } from "./dashboard-shell";

type DashboardLayoutClientProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  children: React.ReactNode;
};

export function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const { title, description } = useDashboardPageMeta();

  return (
    <DashboardShell user={user} title={title} description={description}>
      {children}
    </DashboardShell>
  );
}
