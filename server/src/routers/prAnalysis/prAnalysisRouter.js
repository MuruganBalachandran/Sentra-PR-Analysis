import express from "express";
import { listPRAnalyses, deletePRAnalysis } from "../../controllers/prAnalysis/prAnalysisController.js";
import { analyzePullRequest } from "../../controllers/pr/prController.js";
import { auth } from "../../middleware/index.js";

const router = express.Router();

router.get("/", auth(), listPRAnalyses);
router.post("/analyze", auth(), analyzePullRequest);
router.delete("/:id", auth(), deletePRAnalysis);

export default router;

