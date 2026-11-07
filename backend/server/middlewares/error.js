import { envMode } from "../lib/env.js";
import HttpError from "../utils/errorHandler.js";

const isClientOrServerError = (status) =>
  typeof status === "number" && status >= 400 && status <= 599;

// Express 5 passes errors thrown inside route handlers, and promises they
// reject, to this middleware by itself: handlers need no try/catch wrapper.
// Throw `new HttpError(404, "User not found")` to choose the status and message.
export const errorMiddleware = (err, req, res, next) => {
  // The response has already started, so it is too late for a JSON error.
  if (res.headersSent) return next(err);

  // Anything unexpected is a 500 whose details stay in the server log.
  let statusCode = 500;
  let message =
    envMode === "development" && err instanceof Error
      ? err.message
      : "Internal Server Error";

  // An HttpError was thrown on purpose. `expose` marks the client errors that
  // Express raises itself, such as a malformed JSON body.
  if (
    (err instanceof HttpError || err?.expose === true) &&
    isClientOrServerError(err.statusCode)
  ) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err?.status === 400 && err instanceof URIError) {
    // A URL that Express could not decode is the client's mistake as well.
    statusCode = 400;
    message = "Bad Request";
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({ success: false, message });
};
