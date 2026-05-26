/**
 * Migration script to set analysis_type for existing PR analyses
 * 
 * This script updates all existing PR analyses that don't have an analysis_type set
 * to have the default value of "manual"
 * 
 * Usage: node src/scripts/migrateAnalysisType.js
 */

import mongoose from "mongoose";
import { env } from "../config/index.js";
import { PRAnalysis } from "../models/index.js";

const migrateAnalysisType = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = env?.MONGO_URI || "mongodb://localhost:27017/sentra";
    await mongoose.connect(mongoUri);
    console.log("[Migration] Connected to MongoDB");

    // Find all analyses without analysis_type or with empty analysis_type
    const result = await PRAnalysis.updateMany(
      {
        $or: [
          { analysis_type: { $exists: false } },
          { analysis_type: "" },
          { analysis_type: null }
        ]
      },
      {
        $set: { analysis_type: "manual" }
      }
    );

    console.log(`[Migration] Updated ${result.modifiedCount} analyses`);
    console.log(`[Migration] Matched ${result.matchedCount} analyses`);

    // Verify the update
    const totalAnalyses = await PRAnalysis.countDocuments({});
    const manualAnalyses = await PRAnalysis.countDocuments({ analysis_type: "manual" });
    const webhookAnalyses = await PRAnalysis.countDocuments({ analysis_type: "webhook" });

    console.log(`[Migration] Total analyses: ${totalAnalyses}`);
    console.log(`[Migration] Manual analyses: ${manualAnalyses}`);
    console.log(`[Migration] Webhook analyses: ${webhookAnalyses}`);

    console.log("[Migration] Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("[Migration] Error:", err?.message);
    process.exit(1);
  }
};

migrateAnalysisType();
