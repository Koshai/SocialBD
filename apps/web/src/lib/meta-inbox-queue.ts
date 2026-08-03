import { Queue } from "bullmq";
import { Redis } from "ioredis";

const QUEUE_NAME = "meta-inbox";

export type MetaInboxJobData = {
  eventId: string;
};

let queue: Queue<MetaInboxJobData> | null = null;

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

export async function enqueueMetaInboxEvent(eventId: string) {
  await getQueue().add(
    "meta-inbox",
    { eventId },
    {
      jobId: eventId,
      removeOnComplete: true,
      removeOnFail: 200,
    },
  );
}
