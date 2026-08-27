export function validateLinkedInUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw apiError(
      400,
      "INVALID_URL",
      "A LinkedIn profile URL is required."
    );
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw apiError(
      400,
      "INVALID_URL",
      "The supplied URL is not valid."
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname !== "linkedin.com" &&
    !hostname.endsWith(".linkedin.com")
  ) {
    throw apiError(
      400,
      "INVALID_URL",
      "URL must belong to linkedin.com."
    );
  }

  const match = parsed.pathname.match(
    /^\/in\/([^/?#]+)\/?$/i
  );

  if (!match) {
    throw apiError(
      400,
      "INVALID_PROFILE_URL",
      "Expected a LinkedIn profile URL."
    );
  }

  return {
    url: parsed.toString(),
    vanityName: decodeURIComponent(match[1])
  };
}

export function apiError(
  statusCode,
  code,
  publicMessage
) {
  const error = new Error(publicMessage);

  error.statusCode = statusCode;
  error.code = code;
  error.publicMessage = publicMessage;

  return error;
}