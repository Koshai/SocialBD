import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { appUrl, getMetaRedirectUri } from "@/lib/app-url";
import { requireDashboardSession } from "@/lib/dashboard-session";
import { exchangeCodeForToken } from "@/lib/meta/client";
import { getOAuthStateCookieName, verifyOAuthState } from "@/lib/meta/oauth-state";
import { syncFacebookPagesForOrganization } from "@/lib/meta/sync-pages";

export async function GET(request: Request) {
  const session = await requireDashboardSession();
  const redirectUri = getMetaRedirectUri(request);
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (error) {
    return NextResponse.redirect(appUrl(request, "/dashboard/accounts", { error: "meta_denied" }));
  }

  if (!code || !state) {
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "meta_invalid_callback" }),
    );
  }

  const cookieStore = await cookies();
  const cookieState = cookieStore.get(getOAuthStateCookieName())?.value;
  cookieStore.delete(getOAuthStateCookieName());

  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "meta_invalid_state" }),
    );
  }

  const payload = verifyOAuthState(state);
  if (!payload || payload.userId !== session.user.id) {
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "meta_invalid_state" }),
    );
  }

  try {
    const token = await exchangeCodeForToken(code, redirectUri);
    const { pageCount, instagramCount } = await syncFacebookPagesForOrganization({
      organizationId: payload.organizationId,
      userAccessToken: token.access_token,
      tokenExpiresInSeconds: token.expires_in,
    });

    if (pageCount === 0) {
      return NextResponse.redirect(
        appUrl(request, "/dashboard/accounts", { error: "meta_no_pages" }),
      );
    }

    const params: Record<string, string> = { connected: String(pageCount) };
    if (instagramCount > 0) {
      params.instagram = String(instagramCount);
    }

    return NextResponse.redirect(appUrl(request, "/dashboard/accounts", params));
  } catch (cause) {
    console.error("[meta/callback]", cause);
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "meta_sync_failed" }),
    );
  }
}
