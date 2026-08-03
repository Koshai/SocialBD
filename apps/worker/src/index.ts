import "@socialbd/db";

import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";

import { processMetaInboxJob } from "./meta-inbox-job";
import { processPublishJob, syncDueScheduledPosts } from "./publish-job";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const publishQueueName = "publish";
const inboxQueueName = "meta-inbox";

const publishQueue = new Queue(publishQueueName, { connection });

const publishWorker = new Worker<{ postId: string }>(
  publishQueueName,
  async (job) => {
    await processPublishJob(job.data.postId);
  },
  { connection },
);

const inboxWorker = new Worker<{ eventId: string }>(
  inboxQueueName,
  async (job) => {
    await processMetaInboxJob(job.data.eventId);
  },
  { connection },
);

publishWorker.on("completed", (job) => {
  console.log(`[worker] Completed publish job ${job.id}`);
});

publishWorker.on("failed", (job, err) => {
  console.error(`[worker] Failed publish job ${job?.id}`, err);
});

inboxWorker.on("completed", (job) => {
  console.log(`[worker] Completed inbox job ${job.id}`);
});

inboxWorker.on("failed", (job, err) => {
  console.error(`[worker] Failed inbox job ${job?.id}`, err);
});

console.log(
  `[worker] QueueOra worker listening on queues "${publishQueueName}" and "${inboxQueueName}"`,
);

async function enqueuePublish(postId: string) {
  await publishQueue.add(
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
  await publishWorker.close();
  await inboxWorker.close();
  await publishQueue.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
