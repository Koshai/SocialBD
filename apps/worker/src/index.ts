import "@socialbd/db";

import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";

import { processPublishJob, syncDueScheduledPosts } from "./publish-job";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const queueName = "publish";

const queue = new Queue(queueName, { connection });

const worker = new Worker<{ postId: string }>(
  queueName,
  async (job) => {
    await processPublishJob(job.data.postId);
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`[worker] Completed job ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Failed job ${job?.id}`, err);
});

console.log(`[worker] SocialBD worker listening on queue "${queueName}"`);

async function enqueuePublish(postId: string) {
  await queue.add(
    "publish",
    { postId },
    { jobId: postId, removeOnComplete: true, removeOnFail: 100 },
  );
}

const pollIntervalMs = 60_000;

void syncDueScheduledPosts(enqueuePublish).catch((error: unknown) => {
  console.error("[worker] Initial due-post sync failed", error);
});

setInterval(() => {
  void syncDueScheduledPosts(enqueuePublish).catch((error: unknown) => {
    console.error("[worker] Due-post sync failed", error);
  });
}, pollIntervalMs);

async function shutdown() {
  console.log("[worker] Shutting down…");
  await worker.close();
  await queue.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
