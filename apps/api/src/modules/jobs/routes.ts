import { createJobBodySchema, type StyleType } from '@ai-clipart/shared';
import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';
import { JobOrchestrator } from '@/lib/queue/job-orchestrator.js';

const PROMPT_VERSION = 'v1';

export async function jobRoutes(
  app: FastifyInstance,
  options: { repository: AppRepository; orchestrator: JobOrchestrator },
) {
  app.post('/jobs', async (request, reply) => {
    const deviceId = request.headers['x-device-id'];

    if (!deviceId || typeof deviceId !== 'string') {
      return reply.code(400).send('Missing x-device-id header.');
    }

    const body = createJobBodySchema.parse(request.body);
    const job = await options.repository.createJob({
      deviceId,
      uploadId: body.uploadId,
      promptVersion: PROMPT_VERSION,
      styles: body.styles,
    });

    options.orchestrator.enqueue(job.id);

    return {
      jobId: job.id,
    };
  });

  app.get('/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await options.repository.getJob(jobId);

    if (!job) {
      return reply.code(404).send('Job not found.');
    }

    return job;
  });

  app.post('/jobs/:jobId/styles/:style/retry', async (request, reply) => {
    const { jobId, style } = request.params as { jobId: string; style: StyleType };
    const job = await options.repository.getJob(jobId);

    if (!job) {
      return reply.code(404).send('Job not found.');
    }

    await options.orchestrator.retry(jobId, style);

    return options.repository.getJob(jobId);
  });
}
