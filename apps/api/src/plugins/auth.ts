import { createClerkClient, verifyToken } from '@clerk/backend';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AuthUser } from '@/types/app.js';

function extractBearerToken(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
}

export async function authPlugin(app: FastifyInstance, options: { clerkSecretKey?: string }) {
  const clerkClient = options.clerkSecretKey
    ? createClerkClient({
        secretKey: options.clerkSecretKey,
      })
    : null;

  app.decorateRequest('authUser', null);

  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const token = extractBearerToken(request);

      if (!token) {
        await reply.code(401).send('Authentication required.');
        return;
      }

      if (!options.clerkSecretKey) {
        await reply.code(500).send('Clerk secret key is not configured.');
        return;
      }

      try {
        const payload = await verifyToken(token, {
          secretKey: options.clerkSecretKey,
        });

        const clerkUser = clerkClient ? await clerkClient.users.getUser(payload.sub) : null;
        const primaryEmail = clerkUser?.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId,
        );

        const authUser: AuthUser = {
          clerkUserId: payload.sub,
          email:
            primaryEmail?.emailAddress ??
            (typeof payload.email === 'string' ? payload.email : null),
          firstName:
            clerkUser?.firstName ??
            (typeof payload.first_name === 'string' ? payload.first_name : null),
          lastName:
            clerkUser?.lastName ??
            (typeof payload.last_name === 'string' ? payload.last_name : null),
          imageUrl:
            clerkUser?.imageUrl ??
            (typeof payload.image_url === 'string' ? payload.image_url : null),
        };

        request.authUser = authUser;
      } catch {
        await reply.code(401).send('Invalid authentication token.');
      }
    },
  );
}
