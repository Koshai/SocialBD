import { Queue } from "bullmq";
import { Redis } from "ioredis";

const QUEUE_NAME = "publish";

let queue: Queue<{ postId: string }> | null = null;

function getConnection() {
  return new Redis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
  });
}

function getQueue() {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection: getConnection() });
  }
  return queue;
}

export async function removePublishJob(postId: string) {
  const job = await getQueue().getJob(postId);
  if (job) {
    await job.remove();
  }
}

export async function enqueuePublishPost(postId: string, runAt?: Date | null) {
  await removePublishJob(postId);

  const delay = runAt ? Math.max(0, runAt.getTime() - Date.now()) : 0;

  await getQueue().add(
    "publish",
    { postId },
    {
      jobId: postId,
      delay,
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
}
