type ApiEnvelope<T> = {
  data?: T;
};

export const unwrapData = <T>(response: unknown, fallback: T): T => {
  if (response && typeof response === "object" && "data" in response) {
    const envelope = response as ApiEnvelope<T>;
    return envelope.data ?? fallback;
  }

  return (response as T) ?? fallback;
};
