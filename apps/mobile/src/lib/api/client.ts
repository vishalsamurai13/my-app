import {
  createJobResponseSchema,
  generationJobSchema,
  historyResponseSchema,
  uploadResponseSchema,
  type StyleType,
} from '@ai-clipart/shared';
import { API_BASE_URL } from '@/constants/config';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

async function request<T>(path: string, init?: RequestInit) {
  const url = `${API_BASE_URL}${path}`;

  if (isDev) {
    console.log('[api:request]', {
      url,
      method: init?.method ?? 'GET',
      headers: init?.headers,
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
  deviceId: string;
}) {
  const formData = new FormData();
  formData.append('image', {
    uri: file.uri,
    name: file.fileName,
    type: file.mimeType,
  } as unknown as Blob);

  const data = await request('/uploads', {
    method: 'POST',
    headers: {
      'x-device-id': file.deviceId,
    },
    body: formData,
  });

  return uploadResponseSchema.parse(data);
}

export async function createJob(input: {
  uploadId: string;
  styles: StyleType[];
  deviceId: string;
}) {
  const data = await request('/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': input.deviceId,
    },
    body: JSON.stringify({
      uploadId: input.uploadId,
      styles: input.styles,
    }),
  });

  return createJobResponseSchema.parse(data);
}

export async function getJob(jobId: string, deviceId: string) {
  const data = await request(`/jobs/${jobId}`, {
    headers: {
      'x-device-id': deviceId,
    },
  });

  return generationJobSchema.parse(data);
}

export async function retryStyle(jobId: string, style: StyleType, deviceId: string) {
  const data = await request(`/jobs/${jobId}/styles/${style}/retry`, {
    method: 'POST',
    headers: {
      'x-device-id': deviceId,
    },
  });

  return generationJobSchema.parse(data);
}

export async function getHistory(deviceId: string) {
  const data = await request('/history', {
    headers: {
      'x-device-id': deviceId,
    },
  });

  return historyResponseSchema.parse(data);
}
