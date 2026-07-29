import {
  createSignedMediaUrl,
  getPostForPublish,
  listDueScheduledPostIds,
  markPostFailed,
  markPostPublished,
  publishFacebookPagePost,
  publishInstagramPost,
  publishLinkedInOrganizationPost,
} from "@socialbd/db";

export async function processPublishJob(postId: string) {
  const row = await getPostForPublish(postId);
  if (!row) {
    console.warn(`[worker] Post ${postId} not found.`);
    return;
  }

  if (row.status !== "draft" && row.status !== "scheduled") {
    console.warn(`[worker] Post ${postId} has status ${row.status}, skipping.`);
    return;
  }

  try {
    if (row.platform === "facebook_page") {
      const { externalPostId } = await publishFacebookPagePost({
        pageId: row.pageId,
        pageAccessToken: row.pageAccessToken,
        message: row.body,
        media:
          row.mediaPath && row.mediaMimeType
            ? { path: row.mediaPath, mimeType: row.mediaMimeType }
            : undefined,
      });

      await markPostPublished(postId, externalPostId);
      console.log(`[worker] Published post ${postId} → ${externalPostId}`);
      return;
    }

    if (row.platform === "linkedin_organization") {
      const { externalPostId } = await publishLinkedInOrganizationPost({
        organizationId: row.pageId,
        accessToken: row.pageAccessToken,
        commentary: row.body,
        media:
          row.mediaPath && row.mediaMimeType
            ? { path: row.mediaPath, mimeType: row.mediaMimeType }
            : undefined,
      });

      await markPostPublished(postId, externalPostId);
      console.log(`[worker] Published LinkedIn post ${postId} → ${externalPostId}`);
      return;
    }

    if (row.platform === "instagram") {
      if (!row.mediaPath || !row.mediaMimeType) {
        throw new Error("Instagram posts require an image.");
      }

      const imageUrl = createSignedMediaUrl(row.mediaPath);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(imageUrl)) {
        console.warn(
          "[worker] Instagram image URL is localhost — Meta cannot fetch it. " +
            "Set PUBLIC_MEDIA_BASE_URL to your tunnel URL (see .env.example) and restart.",
        );
      }
      const { externalPostId } = await publishInstagramPost({
        igUserId: row.pageId,
        pageAccessToken: row.pageAccessToken,
        caption: row.body,
        imageUrl,
      });

      await markPostPublished(postId, externalPostId);
      console.log(`[worker] Published Instagram post ${postId} → ${externalPostId}`);
      return;
    }

    throw new Error(`Unsupported platform: ${row.platform}`);
  } catch (error) {
    await markPostFailed(postId);
    throw error;
  }
}

export async function syncDueScheduledPosts(addJob: (postId: string) => Promise<void>) {
  const dueIds = await listDueScheduledPostIds();
  for (const postId of dueIds) {
    await addJob(postId);
  }
}
