// region imports
// utils imports
import { sendResponse } from "../../utils/common/commonFunctions.js";
// constants imports
import {
  STATUS_CODE,
  RESPONSE_STATUS,
} from "../../utils/constants/constants.js";
// endregion

// region not found middleware
const notFound = (req, res, next) => {
  return sendResponse(
    res, 
    STATUS_CODE?.NOT_FOUND || 404, 
    RESPONSE_STATUS?.FAILURE || "FAILURE", 
    "Route not found", 
  );
};
// endregion

// region exports
export default notFound;
// endregion
