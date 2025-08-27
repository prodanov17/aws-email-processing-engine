// functions/auth-callback/utils/response.js

/**
 * Generates a 302 Redirect response for API Gateway.
 * @param {string} url - The URL to redirect to.
 * @returns {object} The API Gateway response object.
 */
export function redirect(url) {
  return {
    statusCode: 302,
    headers: {
      Location: url,
    },
  };
}

/**
 * Generates a 400 Bad Request response.
 * @param {object} body - The JSON body of the response.
 * @returns {object} The API Gateway response object.
 */
export function badRequest(body) {
  return {
    statusCode: 400,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

/**
 * Generates a 500 Internal Server Error response.
 * @param {object} body - The JSON body of the response.
 * @returns {object} The API Gateway response object.
 */
export function serverError(body) {
  return {
    statusCode: 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function ok(body) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
