// region imports
// package imports
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
//  config imports
import { corsConfig } from "./config/index.js";

//  middleware imports
import {
  jsonValidator,
  logger,
  errorHandler,
  notFound,
} from "./middleware/index.js";

//  router imports
import routers from "./routers/index.js";
// endregion

//  server initialization
const app = express();
// endregion

// region  middleware

// parse JSON body
app.use(express.json());

// validate JSON format
app.use(jsonValidator);

// apply CORS rules globally
app.use(cors(corsConfig));
// endregion

// apply cookie parser
app.use(cookieParser());

// log all requests (moved to top for better observability)
app.use(logger);

// region API routes
app.use("/api", routers);
// endregion

//  404 handler
app.use(notFound);
// endregion

//  error handler
app.use(errorHandler);
// endregion

// region exports
export default app;
// endregion
