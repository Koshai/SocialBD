import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { appUrl, getLinkedInRedirectUri } from "@/lib/app-url";
import { requireDashboardSession } from "@/lib/dashboard-session";
import { exchangeLinkedInCode } from "@/lib/linkedin/client";
import {
  getLinkedInOAuthStateCookieName,
  verifyLinkedInOAuthState,
} from "@/lib/linkedin/oauth-state";
import { syncLinkedInOrganizationsForOrganization } from "@/lib/linkedin/sync-organizations";

export async function GET(request: Request) {
  const session = await requireDashboardSession();
  const redirectUri = getLinkedInRedirectUri(request);
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (error) {
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "linkedin_denied" }),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "linkedin_invalid_callback" }),
    );
  }

  const cookieStore = await cookies();
  const cookieState = cookieStore.get(getLinkedInOAuthStateCookieName())?.value;
  cookieStore.delete(getLinkedInOAuthStateCookieName());

  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "linkedin_invalid_state" }),
    );
  }

  const payload = verifyLinkedInOAuthState(state);
  if (!payload || payload.userId !== session.user.id) {
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "linkedin_invalid_state" }),
    );
  }

  try {
    const token = await exchangeLinkedInCode(code, redirectUri);
    const { organizationCount } = await syncLinkedInOrganizationsForOrganization({
      organizationId: payload.organizationId,
      accessToken: token.access_token,
      expiresInSeconds: token.expires_in,
    });

    if (organizationCount === 0) {
      return NextResponse.redirect(
        appUrl(request, "/dashboard/accounts", { error: "linkedin_no_organizations" }),
      );
    }

    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { linkedin_connected: String(organizationCount) }),
    );
  } catch (cause) {
    console.error("[linkedin/callback]", cause);
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "linkedin_sync_failed" }),
    );
  }
}
