// region imports
// utils imports
import { sendResponse } from "../../utils/index.js";
// constants imports
import {
  STATUS_CODE,
  VALIDATION_MESSAGES,
  RESPONSE_STATUS,
} from "../../utils/index.js";
// endregion

// region json validator middleware
const jsonValidator = (err, req, res, next) => {
  //SyntaxError-  built-in error class
  if (
    err instanceof SyntaxError && // Checks the type of error object.
    (err.status === 400 || err.statusCode === 400) &&
    "body" in err //  Error came from request body parsing
  ) {
    return sendResponse(
      res,
      STATUS_CODE?.BAD_REQUEST || 400,
      RESPONSE_STATUS?.FAILURE || "FAILURE",
      VALIDATION_MESSAGES?.INVALID_JSON_PAYLOAD || "Invalid JSON payload",
    );
  }
  next();
};
// endregion

// region exports
export default jsonValidator;
// endregion
