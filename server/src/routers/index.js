// region imports
import express from "express";

import activityLogRouter from "./activitylog/activityLogRouter.js";
import healthRouter from "./health/healthRouter.js";
import authRouter from "./auth/authRouter.js";
import twoFARouter from "./twofa/twoFARouter.js";
import githubRouter from "./webhooks/githubRouter.js";
import contextRouter from "./context/contextRouter.js";
import usersRouter from "./users/usersRouter.js";
import prAnalysisRouter from "./prAnalysis/prAnalysisRouter.js";

const routers = express.Router();

// region API routes
routers.use("/health", healthRouter);
routers.use("/auth", authRouter);
routers.use("/2fa", twoFARouter);
routers.use("/activity-log", activityLogRouter);
routers.use("/webhooks/github", githubRouter);
routers.use("/context", contextRouter);
routers.use("/users", usersRouter);
routers.use("/pr-analyses", prAnalysisRouter);
// endregion

export default routers;
