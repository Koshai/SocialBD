import { getPublishedPostPlatformContext } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import {
  buildFacebookPostInsightsUrl,
  buildFacebookPostPermalink,
  resolveInstagramPermalink,
} from "@/lib/facebook-boost";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { organizationId } = await requireActiveOrganization();
  const { id } = await context.params;

  const post = await getPublishedPostPlatformContext(id, organizationId);
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  if (post.status !== "published" || !post.externalPostId) {
    return NextResponse.json(
      { error: "Platform link is only available for published posts." },
      { status: 400 },
    );
  }

  if (post.platform === "facebook_page") {
    const insightsUrl = buildFacebookPostInsightsUrl(post.externalPostId, post.pageId);
    const permalink = buildFacebookPostPermalink(post.externalPostId, post.pageId);
    if (!insightsUrl && !permalink) {
      return NextResponse.json({ error: "Could not build Facebook link." }, { status: 400 });
    }
    return NextResponse.json({
      platform: post.platform,
      url: insightsUrl ?? permalink,
      permalink,
    });
  }

  if (post.platform === "instagram") {
    const permalink = await resolveInstagramPermalink(post.externalPostId, post.pageAccessToken);
    if (!permalink) {
      return NextResponse.json(
        {
          error:
            "Could not open Instagram. Reconnect the Instagram account in Accounts, then try again.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json({
      platform: post.platform,
      url: permalink,
      permalink,
    });
  }

  return NextResponse.json(
    { error: "Platform link is only available for Facebook and Instagram posts." },
    { status: 400 },
  );
}
