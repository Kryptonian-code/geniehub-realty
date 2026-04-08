export function getUserFacingErrorMessage(status?: number): string {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "The requested record could not be found.";
  if (status === 409) return "This action conflicts with existing saved data.";
  if (status === 419) return "Your secure session expired. Refresh and try again.";
  if (status === 422) return "Please review the information provided and try again.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  return "Something went wrong. Please try again.";
}

export function reportClientError(_context: string, _error: unknown): void {
  // Intentionally quiet in production-facing flows.
}
