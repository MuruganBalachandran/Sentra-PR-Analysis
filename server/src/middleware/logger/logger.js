// region imports
import {
  getFormattedDateTime,
  verifyToken,
} from "../../utils/index.js";
import { createActivityLog } from "../../queries/index.js";
// endregion

// region logger middleware
const logger = (req = {}, res = {}, next) => {
  const startTime = Date.now();

  //extract user from token (non-blocking)
  const token = req?.cookies?.token || "";
  let tokenUser = null;

  if (token) {
    try {
      tokenUser = verifyToken(token) || null;
    } catch (err) {
      tokenUser = null;
    }
  }

  //keep original send
  const originalSend = res.send;

  res.send = function (body) {
    // Determine user identifier for tagging
    const userIdentifier =
      req?.user?.Email ||
      req?.user?.email ||
      tokenUser?.email ||
      tokenUser?.Email ||
      "Guest";

    // Reattach original send to avoid recursion
    res.send = originalSend;

    // Process logging asynchronously to not block response
    try {
      //extract activity message
      let activity = "";
      let emailFromBody = "";

      try {
        const parsed =
          typeof body === "string" ? JSON.parse(body) : body || {};
        activity = parsed?.message || parsed?.msg || "";
        emailFromBody = parsed?.user?.email || parsed?.email || "";
      } catch (e) {
        activity = typeof body === "string" ? body : "N/A";
      }

      //calculate duration
      const duration = Date.now() - startTime;

      //determine user info
      const userId = req?.user?.User_Id || tokenUser?.User_Id || null;

      const email =
        req?.user?.email ||
        req?.user?.Email ||
        tokenUser?.email ||
        tokenUser?.Email ||
        emailFromBody ||
        "Guest";

      //build log object
      const logData = {
        User_Id: userId,
        Email: email,
        Action: req?.method || "UNKNOWN",
        URL: req?.originalUrl || req?.url || "unknown-url",
        Status: res?.statusCode || 0,
        IP: req?.ip || req?.connection?.remoteAddress || "unknown-ip",
        Duration: `${duration}ms`,
        Created_At: getFormattedDateTime() || new Date().toISOString(),
        Activity: activity || "No activity message",
      };

      // Print to console for development visibility
      console.log(
        `[${logData.Created_At}] ${logData.Action} ${logData.URL} - Status: ${logData.Status} (${logData.Duration}) - User: ${userIdentifier}`,
      );

      // Save to database via query (non-blocking)
      createActivityLog(logData).catch((err) => {
        console.error("Failed to save activity log to DB:", err?.message);
      });
    } catch (err) {
      console.error("Logger processing error:", err?.message);
    }

    //send response
    return originalSend.call(this, body);
  };

  next();
};
// endregion

// region exports
export default logger;
// endregion
