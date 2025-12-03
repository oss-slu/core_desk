export const getErrorMessage = (
  error,
  fallback = "An unexpected error occurred."
) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error.message === "string") {
    return error.message;
  }

  if (typeof error.error === "string") {
    return error.error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
};

