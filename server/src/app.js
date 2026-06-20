// region imports
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsConfig } from "./config/index.js";
import { jsonValidator, logger, errorHandler, notFound } from "./middleware/index.js";
import routers from "./routers/index.js";
// endregion

const app = express();

// region middleware

// CRITICAL: Webhook route needs raw body for HMAC — must be captured BEFORE any JSON parsing
// Use express.raw() globally for webhook path, express.json() for everything else
app.use((req, res, next) => {
  const isWebhook = req.path.startsWith("/api/webhooks/github");
  if (isWebhook) {
    // Capture exact bytes — do NOT parse JSON here
    express.raw({ type: "*/*", limit: "10mb" })(req, res, next);
  } else {
    express.json({ limit: "10mb" })(req, res, next);
  }
});

app.use(jsonValidator);
app.use(cors(corsConfig));
app.use(cookieParser());
app.use(logger);
// endregion

app.use("/api", routers);

app.use(notFound);
app.use(errorHandler);

export default app;
