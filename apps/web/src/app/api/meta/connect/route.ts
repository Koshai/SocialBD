import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { appUrl, getMetaRedirectUri } from "@/lib/app-url";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { buildMetaAuthorizeUrl } from "@/lib/meta/client";
import { isMetaConfigured } from "@/lib/meta/config";
import {
  createOAuthState,
  getOAuthStateCookieOptions,
} from "@/lib/meta/oauth-state";

export async function GET(request: Request) {
  if (!isMetaConfigured()) {
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "meta_not_configured" }),
    );
  }

  const { organizationId, userId } = await requireActiveOrganization();
  const redirectUri = getMetaRedirectUri(request);
  const state = createOAuthState({ organizationId, userId });
  const cookieOptions = getOAuthStateCookieOptions();

  const cookieStore = await cookies();
  cookieStore.set(cookieOptions.name, state, {
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
  });

  return NextResponse.redirect(buildMetaAuthorizeUrl(state, redirectUri));
}
