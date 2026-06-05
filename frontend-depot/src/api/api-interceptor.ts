import type { AxiosError, AxiosInstance } from 'axios';

export const QUOTA_FORBIDDEN_EVENT = 'gestock:quota-forbidden';

export type PlanType =
  | 'FREE'
  | 'BASIC'
  | 'PREMIUM'
  | 'ENTERPRISE'
  | 'SOLO'
  | 'PME'
  | 'TRIAL'
  | 'UNLIMITED';

export type QuotaErrorMetadata = {
  resource?: string;
  currentPlan?: PlanType;
  suggestedPlan?: PlanType | null;
  current?: number;
  limit?: number;
};

export type QuotaForbiddenDetail = {
  status: number;
  message: string;
  metadata?: QuotaErrorMetadata;
};

let quotaInterceptorId: number | null = null;

function extractErrorMessage(error: AxiosError): string {
  const data = error.response?.data;

  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return 'Quota atteint : veuillez mettre a niveau votre plan';
}

function extractQuotaMetadata(error: AxiosError): QuotaErrorMetadata | undefined {
  const data = error.response?.data;

  if (typeof data === 'object' && data !== null && 'metadata' in data) {
    const metadata = (data as { metadata?: unknown }).metadata;
    if (typeof metadata === 'object' && metadata !== null) {
      return metadata as QuotaErrorMetadata;
    }
  }

  return undefined;
}

export function registerQuotaForbiddenInterceptor(api: AxiosInstance): void {
  if (quotaInterceptorId !== null) {
    api.interceptors.response.eject(quotaInterceptorId);
  }

  quotaInterceptorId = api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 403) {
        window.dispatchEvent(
          new CustomEvent<QuotaForbiddenDetail>(QUOTA_FORBIDDEN_EVENT, {
            detail: {
              status: 403,
              message: extractErrorMessage(error),
              metadata: extractQuotaMetadata(error),
            },
          }),
        );
      }

      return Promise.reject(error);
    },
  );
}
