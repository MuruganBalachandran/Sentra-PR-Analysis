// region package imports
import rateLimit from "express-rate-limit";
import { ipKeyGenerator } from "express-rate-limit";
import { RESPONSE_STATUS } from "../../utils/constants/constants.js";
// endregion

// region helper - build key
const buildKey = (req) => {
  const ip = ipKeyGenerator(req);
  const email = req.body?.Email?.toLowerCase();

  // If email exists, still attach IP so combos are tracked
  return email ? `${ip}|${email}` : ip;
};

// endregion

// region factory
const rateLimiter = (type = "Login") => {
  const config = {
    Login: {
      max: 5,
      message: "Too many login attempts. Try again later.",
    },
    Register: {
      max: 3,
      message: "Too many register attempts. Try again later.",
    },
  };

  const selected = config[type] || config.Login;

  return rateLimit({
    windowMs: 10 * 60 * 1000,
    max: selected.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildKey,
    message: {
      status: RESPONSE_STATUS?.FAILURE || "FAILURE",
      message: selected.message,
    },
  });
};
// endregion

// region exports
export default rateLimiter;
// endregion
