"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@socialbd/ui";

import { AppearanceControls } from "@/components/preferences/appearance-controls";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { authClient } from "@/lib/auth-client";

type AccountMenuProps = {
  user: {
    name: string;
    email: string;
  };
  /** Compact trigger for mobile headers */
  compact?: boolean;
};

export function AccountMenu({ user, compact = false }: AccountMenuProps) {
  const { t } = usePreferences();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
    setSigningOut(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={[
          "flex items-center gap-2 rounded-xl border border-border bg-background transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          compact ? "h-11 w-11 justify-center p-0" : "px-3 py-2",
        ].join(" ")}
      >
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
        >
          {initials}
        </span>
        {!compact ? (
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        ) : (
          <span className="sr-only">{t("header.accountMenu")}</span>
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-border bg-surface p-3 shadow-lg"
        >
          <div className="border-b border-border pb-3">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>

          <div className="mt-3 space-y-3">
            <AppearanceControls />

            <Link
              href="/dashboard/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2 text-sm font-medium text-foreground hover:bg-background"
            >
              {t("nav.settings")}
            </Link>

            <Link
              href="/dashboard/workspaces/new"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2 text-sm font-medium text-foreground hover:bg-background"
            >
              {t("nav.newWorkspace")}
            </Link>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
            >
              {signingOut ? t("auth.signingOut") : t("auth.signOut")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
