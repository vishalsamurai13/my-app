import {
  createJobResponseSchema,
  generationJobSchema,
  historyResponseSchema,
  meResponseSchema,
  uploadResponseSchema,
  type ShapeType,
  type StyleType,
} from '@ai-clipart/shared';
import { API_BASE_URL } from '@/constants/config';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

function redactHeaders(headers?: HeadersInit) {
  if (!headers) return headers;

  if (headers instanceof Headers) {
    return Object.fromEntries(
      Array.from(headers.entries()).map(([key, value]) => [key, key.toLowerCase() === 'authorization' ? 'Bearer [redacted]' : value]),
    );
  }

  if (Array.isArray(headers)) {
    return headers.map(([key, value]) => [key, key.toLowerCase() === 'authorization' ? 'Bearer [redacted]' : value]);
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, key.toLowerCase() === 'authorization' ? 'Bearer [redacted]' : value]),
  );
}

function withAuthHeaders(token?: string | null, headers?: HeadersInit) {
  return {
    ...(headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit) {
  const url = `${API_BASE_URL}${path}`;

  if (isDev) {
    console.log('[api:request]', {
      url,
      method: init?.method ?? 'GET',
      headers: redactHeaders(init?.headers),
      bodyType:
        init?.body instanceof FormData
          ? 'FormData'
          : typeof init?.body === 'string'
            ? 'JSON'
            : typeof init?.body,
    });
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (isDev) {
      console.log('[api:network-error]', {
        url,
        message: error instanceof Error ? error.message : 'Unknown network failure',
      });
    }
    throw error;
  }

  if (!response.ok) {
    const message = await response.text();
    if (isDev) {
      console.log('[api:response-error]', {
        url,
        status: response.status,
        message,
      });
    }
    throw new Error(message || 'Request failed');
  }

  const data = (await response.json()) as T;

  if (isDev) {
    console.log('[api:response-ok]', {
      url,
      status: response.status,
      data,
    });
  }

  return data;
}

export async function uploadImage(file: {
  uri: string;
  fileName: string;
  mimeType: string;
  token: string;
}) {
  const formData = new FormData();
  formData.append('image', {
    uri: file.uri,
    name: file.fileName,
    type: file.mimeType,
  } as unknown as Blob);

  const data = await request('/uploads', {
    method: 'POST',
    headers: withAuthHeaders(file.token),
    body: formData,
  });

  return uploadResponseSchema.parse(data);
}

export async function createJob(input: {
  uploadId: string;
  styles: StyleType[];
  token: string;
  prompt?: string;
  shape?: ShapeType;
}) {
  const data = await request('/jobs', {
    method: 'POST',
    headers: withAuthHeaders(input.token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      uploadId: input.uploadId,
      styles: input.styles,
      prompt: input.prompt,
      shape: input.shape,
    }),
  });

  return createJobResponseSchema.parse(data);
}

export async function getJob(jobId: string, token: string) {
  const data = await request(`/jobs/${jobId}`, {
    headers: withAuthHeaders(token),
  });
  return generationJobSchema.parse(data);
}

export async function retryStyle(jobId: string, style: StyleType, token: string) {
  const data = await request(`/jobs/${jobId}/styles/${style}/retry`, {
    method: 'POST',
    headers: withAuthHeaders(token),
  });

  return generationJobSchema.parse(data);
}

export async function getHistory(token: string) {
  const data = await request('/history', {
    headers: withAuthHeaders(token),
  });
  return historyResponseSchema.parse(data);
}

export async function getMe(token: string) {
  const data = await request('/me', {
    headers: withAuthHeaders(token),
  });
  return meResponseSchema.parse(data);
}
