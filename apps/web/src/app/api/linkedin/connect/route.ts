import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { appUrl, getLinkedInRedirectUri } from "@/lib/app-url";
import { requireActiveOrganization } from "@/lib/dashboard-session";
<<<<<<< HEAD
=======
import { isLinkedInFeatureEnabled } from "@/lib/features/linkedin";
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
import { buildLinkedInAuthorizeUrl } from "@/lib/linkedin/client";
import { isLinkedInConfigured } from "@/lib/linkedin/config";
import {
  createLinkedInOAuthState,
  getLinkedInOAuthStateCookieOptions,
} from "@/lib/linkedin/oauth-state";

export async function GET(request: Request) {
<<<<<<< HEAD
=======
  if (!isLinkedInFeatureEnabled()) {
    return NextResponse.redirect(appUrl(request, "/dashboard/accounts"));
  }

>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
  if (!isLinkedInConfigured()) {
    return NextResponse.redirect(
      appUrl(request, "/dashboard/accounts", { error: "linkedin_not_configured" }),
    );
  }

  const { organizationId, userId } = await requireActiveOrganization();
  const redirectUri = getLinkedInRedirectUri(request);
  const state = createLinkedInOAuthState({ organizationId, userId });
  const cookieOptions = getLinkedInOAuthStateCookieOptions();

  const cookieStore = await cookies();
  cookieStore.set(cookieOptions.name, state, {
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
  });

  return NextResponse.redirect(buildLinkedInAuthorizeUrl(state, redirectUri));
}
