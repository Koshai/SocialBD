import { Worker } from "bullmq";
import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const queueName = "publish";

const worker = new Worker(
  queueName,
  async (job) => {
    console.log(`[worker] Processing job ${job.id}`, job.data);
    // Publish pipeline will be implemented in a later phase.
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

async function shutdown() {
  console.log("[worker] Shutting down…");
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
