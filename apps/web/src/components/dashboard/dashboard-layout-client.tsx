"use client";

import { usePathname } from "next/navigation";

import { getDashboardPageMeta } from "@/lib/dashboard-page-meta";
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
  const pathname = usePathname();
  const { title, description } = getDashboardPageMeta(pathname);

  return (
    <DashboardShell user={user} title={title} description={description}>
      {children}
    </DashboardShell>
  );
}
