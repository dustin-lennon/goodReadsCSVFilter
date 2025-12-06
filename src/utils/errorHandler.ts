/**
 * Utility function for consistent error handling across the application
 */
export function handleError(
  error: unknown,
  options?: {
    progressCallback?: (message: string) => void;
    exitOnError?: boolean;
    logStack?: boolean;
  },
): never {
  const { progressCallback, exitOnError = false, logStack = true } = options || {};

  if (error instanceof Error) {
    if (progressCallback) {
      progressCallback(`❌ An unexpected error occurred: ${error.message}`);
    } else {
      console.error('❌ An unexpected error occurred:', error.message);
      if (logStack && error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
  } else {
    if (progressCallback) {
      progressCallback(`❌ An unexpected error occurred: ${String(error)}`);
    } else {
      console.error('❌ An unexpected error occurred:', error);
    }
  }

  if (exitOnError) {
    process.exit(1);
  }

  throw error;
}
