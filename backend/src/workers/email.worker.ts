import { Worker, Job } from "bullmq";
import {
    getRedisConnection,
    EMAIL_QUEUE_NAME,
    EmailJobData,
} from "../queues/email.queue";
import { sendEmail } from "../services/email.service";
import { renderEmailTemplate } from "../utils/renderTemplate";
import { appLogger } from "../config/logger";

let _worker: Worker<EmailJobData> | null = null;

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
    const { template, templateData, ...emailOptions } = job.data;

    // If a template name is provided, render it to HTML and override the html field.
    if (template) {
        emailOptions.html = await renderEmailTemplate(
            template,
            templateData ?? {},
        );
    }

    await sendEmail(emailOptions);
}

export function startEmailWorker(): Worker<EmailJobData> {
    if (_worker) return _worker;

    _worker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processEmailJob, {
        connection: getRedisConnection(),
        concurrency: 5,
    });

    _worker.on("completed", (job) => {
        appLogger.info("[email-worker] Job completed", {
            jobId: job.id,
            name: job.name,
        });
    });

    _worker.on("failed", (job, err) => {
        appLogger.error("[email-worker] Job failed", {
            jobId: job?.id,
            name: job?.name,
            err,
        });
    });

    return _worker;
}

export async function stopEmailWorker(): Promise<void> {
    if (_worker) {
        await _worker.close();
        _worker = null;
    }
}
