import {
  getPostForPublish,
  listDueScheduledPostIds,
  markPostFailed,
  markPostPublished,
  publishFacebookPagePost,
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

  if (row.platform !== "facebook_page") {
    throw new Error(`Unsupported platform: ${row.platform}`);
  }

  try {
    const { externalPostId } = await publishFacebookPagePost({
      pageId: row.pageId,
      pageAccessToken: row.pageAccessToken,
      message: row.body,
    });

    await markPostPublished(postId, externalPostId);
    console.log(`[worker] Published post ${postId} → ${externalPostId}`);
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
