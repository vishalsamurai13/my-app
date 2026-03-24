import { createJobBodySchema, type StyleType } from '@ai-clipart/shared';
import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';
import { JobOrchestrator } from '@/lib/queue/job-orchestrator.js';
import { env } from '@/lib/config/env.js';
import { deviceHeaderSchema, jobParamsSchema, retryParamsSchema } from '@/schemas/http.js';

export async function jobRoutes(
  app: FastifyInstance,
  options: { repository: AppRepository; orchestrator: JobOrchestrator },
) {
  app.post('/jobs', async (request, reply) => {
    const { 'x-device-id': deviceId } = deviceHeaderSchema.parse(request.headers);

    const body = createJobBodySchema.parse(request.body);
    const upload = await options.repository.getUploadForDevice(body.uploadId, deviceId);

    if (!upload) {
      return reply.code(404).send('Upload not found for device.');
    }

    const job = await options.repository.createJob({
      deviceId,
      uploadId: body.uploadId,
      promptVersion: env.PROMPT_VERSION,
      provider: options.orchestrator.providerName,
      model: options.orchestrator.modelName,
      styles: body.styles,
    });

    request.log.info({ jobId: job.id, deviceId, styles: body.styles }, 'job created');
    options.orchestrator.enqueue(job.id);

    return {
      jobId: job.id,
    };
  });

  app.get('/jobs/:jobId', async (request, reply) => {
    const { 'x-device-id': deviceId } = deviceHeaderSchema.parse(request.headers);
    const { jobId } = jobParamsSchema.parse(request.params);
    const job = await options.repository.getJobForDevice(jobId, deviceId);

    if (!job) {
      return reply.code(404).send('Job not found.');
    }

    return job;
  });

  app.post('/jobs/:jobId/styles/:style/retry', async (request, reply) => {
    const { 'x-device-id': deviceId } = deviceHeaderSchema.parse(request.headers);
    const { jobId, style } = retryParamsSchema.parse(request.params) as { jobId: string; style: StyleType };
    const job = await options.repository.getJobForDevice(jobId, deviceId);

    if (!job) {
      return reply.code(404).send('Job not found.');
    }

    const styleTask = job.styles.find((item) => item.style === style);
    if (!styleTask || styleTask.status !== 'error') {
      return reply.code(400).send('Only failed styles can be retried.');
    }

    await options.orchestrator.retry(jobId, style);
    request.log.info({ jobId, style, deviceId }, 'style retried');

    return options.repository.getJobForDevice(jobId, deviceId);
  });
}
