// region imports
import {
  verifyToken,
  sendResponse,
  STATUS_CODE,
  RESPONSE_STATUS,
  ROLE,
} from "../../utils/index.js";
// endregion

// region auth middleware
const auth = (...allowedRoles) => {
  return (req = {}, res = {}, next) => {
    try {
      //get token
      const token = req?.cookies?.token || "";
      if (!token) {
        return sendResponse(
          res,
          STATUS_CODE?.UNAUTHORIZED || 401,
          RESPONSE_STATUS?.FAILURE || "FAILURE",
          "Unauthorized access",
        );
      }

      //verify token
      const decoded = verifyToken(token);
      if (!decoded?.User_Id) {
        return sendResponse(
          res,
          STATUS_CODE?.UNAUTHORIZED || 401,
          RESPONSE_STATUS?.FAILURE || "FAILURE",
          "Unauthorized access",
        );
      }

      //attach user to request
      req.user = decoded || {};

      //role authorization
      if (allowedRoles?.length > 0 && !allowedRoles.includes(decoded?.role)) {
        return sendResponse(
          res,
          STATUS_CODE?.FORBIDDEN || 403,
          RESPONSE_STATUS?.FAILURE || "FAILURE",
          "Access denied.",
        );
      }

      next();
    } catch (err) {
      return sendResponse(
        res,
        STATUS_CODE?.UNAUTHORIZED || 401,
        RESPONSE_STATUS?.FAILURE || "FAILURE",
        "Invalid or expired token",
      );
    }
  };
};
// endregion

// region exports
export { auth };
// endregion
