interface ApiErrorPayload {
  message?: string;
  detail?: string;
  maxBooks?: number | string;
  max_books?: number | string;
  maxBooksPerMember?: number | string;
  errors?: Record<string, string[] | string>;
}

interface ApiErrorLike {
  response?: {
    data?: ApiErrorPayload;
  };
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  const payload = (error as ApiErrorLike)?.response?.data;
  const rawMessage = payload?.detail ?? payload?.message;
  const limit = getBorrowLimit(payload, rawMessage);

  if (limit !== null && rawMessage?.toLowerCase().includes('cannot borrow more than')) {
    return formatBorrowLimitMessage(limit);
  }

  if (rawMessage) return rawMessage;

  const firstError = payload?.errors ? Object.values(payload.errors)[0] : undefined;
  if (Array.isArray(firstError)) return firstError[0] ?? fallback;
  if (typeof firstError === 'string') return firstError;

  return fallback;
}

export function formatBorrowLimitMessage(limit: number | string) {
  return `Member cannot borrow more than ${limit}. Return books first or contact librarian`;
}

function getBorrowLimit(payload?: ApiErrorPayload, message?: string) {
  const fromPayload = payload?.maxBooks ?? payload?.max_books ?? payload?.maxBooksPerMember;
  if (fromPayload !== undefined && fromPayload !== null && fromPayload !== '') {
    const parsed = Number(fromPayload);
    if (Number.isFinite(parsed)) return parsed;
  }

  const match = message?.match(/more than\s+(\d+)/i);
  if (match?.[1]) return Number(match[1]);

  return null;
}
