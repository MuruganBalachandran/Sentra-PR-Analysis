// region imports
import express from "express";
import { fetchActivityLogs, removeActivityLog } from "../../controllers/activityLog/activityLogController.js";
import { auth } from "../../middleware/index.js";
// endregion

// region router initialization
const router = express.Router();
// endregion

router.use(auth("ADMIN"));
// region routes
router.get("/", fetchActivityLogs);
router.delete("/:id", removeActivityLog);
// endregion

// region exports
export default router;
// endregion
