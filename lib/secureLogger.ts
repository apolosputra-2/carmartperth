
import "server-only";

type SafeLogContext = {
  operation: string;
  error: unknown;
};

export function logServerError({
  operation,
  error,
}: SafeLogContext): void {
  // Never print the raw error object or its message.
  const errorType =
    error instanceof Error
      ? error.name
      : "UnknownError";

  // Restrict the type to a known, safe label.
  const safeErrorType = [
    "Error",
    "TypeError",
    "RangeError",
    "SyntaxError",
  ].includes(errorType)
    ? errorType
    : "ApplicationError";

  console.error("[SERVER_ERROR]", {
    operation,
    errorType: safeErrorType,
    timestamp: new Date().toISOString(),
  });
}
