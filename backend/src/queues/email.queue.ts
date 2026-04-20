import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import env from '../config/env';
import type { SendEmailOptions } from '../services/email.service';

export const EMAIL_QUEUE_NAME = 'email';

/**
 * Job payload stored in Redis.
 *
 * Either provide `template` + `templateData` (EJS template rendered by the worker),
 * or provide raw `html`/`text` directly — both are valid and can be combined.
 */
export type EmailJobData = SendEmailOptions & {
  /** EJS template name (filename without .ejs), e.g. 'verify-email' */
  template?: string;
  /** Variables passed into the EJS template */
  templateData?: Record<string, unknown>;
};

let _connection: IORedis | null = null;
let _emailQueue: Queue<EmailJobData> | null = null;

export function getRedisConnection(): IORedis {
  if (_connection) return _connection;

  _connection = new IORedis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    ...(env.REDIS_USERNAME ? { username: env.REDIS_USERNAME } : {}),
    ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
    db: env.REDIS_DB,
    maxRetriesPerRequest: null, // required by BullMQ
  });

  return _connection;
}

export function getEmailQueue(): Queue<EmailJobData> {
  if (_emailQueue) return _emailQueue;

  _emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  });

  return _emailQueue;
}

/**
 * Enqueue an email to be sent asynchronously.
 *
 * Pass `template` + `templateData` to use an EJS template rendered by the worker,
 * or pass raw `html`/`text` directly.
 *
 * @param options  Email options — recipient, subject, template or raw html, cc/bcc, attachments…
 * @param jobName  Optional label shown in BullMQ dashboards (defaults to template name or subject)
 */
export async function enqueueEmail(
  options: EmailJobData,
  jobName?: string,
): Promise<void> {
  const queue = getEmailQueue();
  const name = jobName ?? options.template ?? options.subject;
  await queue.add(name, options);
}
