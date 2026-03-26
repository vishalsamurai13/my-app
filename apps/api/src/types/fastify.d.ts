import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthUser } from './app.js';

declare module 'fastify' {
  interface FastifyRequest {
    authUser: AuthUser | null;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
