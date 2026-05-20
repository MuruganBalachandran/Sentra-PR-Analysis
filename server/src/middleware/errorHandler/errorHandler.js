// region imports
import chalk from "chalk";
import { sendResponse } from "../../utils/index.js";
//  constants imports
import {
  STATUS_CODE,
  RESPONSE_STATUS,
} from "../../utils/index.js";
// endregion

// region error handler middleware
const errorHandler = (err, req, res, next) => {
  try {
    console?.error?.(chalk?.red?.("[ERROR]"), err?.message || "Unknown error");
    console?.log?.("from global error handler");

    const statusCode =
      err?.statusCode ||
      err?.status ||
      STATUS_CODE?.INTERNAL_SERVER_ERROR ||
      500;

    const message = err?.message || "Internal server error";

    return sendResponse(
      res,
      statusCode || 500,
      RESPONSE_STATUS.FAILURE || "FAILURE",
      message || "Internal server error"
    );
  } catch (handlerErr) {
    return sendResponse(
      res,
      STATUS_CODE?.INTERNAL_SERVER_ERROR || 500,
      RESPONSE_STATUS.FAILURE || "FAILURE",
      "Something went wrong, please try again later",
    );
  }
};
// endregion

// region exports
export default errorHandler;
// endregion
