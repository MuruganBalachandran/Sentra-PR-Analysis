import express from "express";
import { upsertRepository, upsertOwnership, upsertDependencyGraph, upsertFragileModules } from "../../controllers/context/contextController.js";
import { auth } from "../../middleware/index.js";

const router = express.Router();

router.use(auth("ADMIN"));
router.post("/repository", upsertRepository);
router.post("/ownership", upsertOwnership);
router.post("/dependency-graph", upsertDependencyGraph);
router.post("/fragile-modules", upsertFragileModules);

export default router;
