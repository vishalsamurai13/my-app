import { createJobBodySchema, type StyleType } from '@ai-clipart/shared';
import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';
import { JobOrchestrator } from '@/lib/queue/job-orchestrator.js';
import { env } from '@/lib/config/env.js';
import { jobParamsSchema, retryParamsSchema } from '@/schemas/http.js';

export async function jobRoutes(
  app: FastifyInstance,
  options: { repository: AppRepository; orchestrator: JobOrchestrator },
) {
  app.post('/jobs', { preHandler: app.authenticate }, async (request, reply) => {
    const authUser = request.authUser!;
    const user = await options.repository.upsertUser(authUser);
    const body = createJobBodySchema.parse(request.body);
    const upload = await options.repository.getUploadForUser(body.uploadId, user.id);

    if (!upload) {
      return reply.code(404).send('Upload not found for user.');
    }

    const job = await options.repository.createJob({
      userId: user.id,
      uploadId: body.uploadId,
      promptVersion: env.PROMPT_VERSION,
      prompt: body.prompt,
      shape: body.shape,
      provider: options.orchestrator.providerName,
      model: options.orchestrator.modelName,
      styles: body.styles,
    });

    request.log.info({ jobId: job.id, userId: user.id, styles: body.styles }, 'job created');
    options.orchestrator.enqueue(job.id);

    return {
      jobId: job.id,
    };
  });

  app.get('/jobs/:jobId', { preHandler: app.authenticate }, async (request, reply) => {
    const authUser = request.authUser!;
    const user = await options.repository.upsertUser(authUser);
    const { jobId } = jobParamsSchema.parse(request.params);
    const job = await options.repository.getJobForUser(jobId, user.id);

    if (!job) {
      return reply.code(404).send('Job not found.');
    }

    return job;
  });

  app.post('/jobs/:jobId/styles/:style/retry', { preHandler: app.authenticate }, async (request, reply) => {
    const authUser = request.authUser!;
    const user = await options.repository.upsertUser(authUser);
    const { jobId, style } = retryParamsSchema.parse(request.params) as { jobId: string; style: StyleType };
    const job = await options.repository.getJobForUser(jobId, user.id);

    if (!job) {
      return reply.code(404).send('Job not found.');
    }

    const styleTask = job.styles.find((item) => item.style === style);
    if (!styleTask || styleTask.status !== 'error') {
      return reply.code(400).send('Only failed styles can be retried.');
    }

    await options.orchestrator.retry(jobId, style);
    request.log.info({ jobId, style, userId: user.id }, 'style retried');

    return options.repository.getJobForUser(jobId, user.id);
  });
}
