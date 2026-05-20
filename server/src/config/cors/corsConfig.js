// region imports
import { env } from "../env/envConfig.js";
// endregion

// region normalize CORS_ORIGIN
const allowedOrigins = Array.isArray(env?.CORS_ORIGIN)
  ? env?.CORS_ORIGIN
  : [env?.CORS_ORIGIN || ''].filter(Boolean);
// endregion

// region CORS Options
const corsConfig = {
  origin: (origin = '', callback = () => {}) => {
    // allow requests with no origin (e.g., Postman)
    if (!origin) return callback?.(null, true);

    // allow if origin is in allowedOrigins
    if (allowedOrigins?.includes(origin)) return callback?.(null, true);

    // block otherwise
    return callback?.(new Error('Not allowed by CORS'));
  },

  // allow cookies to be sent in requests
  credentials: true, 
};
// endregion

// region exports
export { corsConfig };
// endregion
