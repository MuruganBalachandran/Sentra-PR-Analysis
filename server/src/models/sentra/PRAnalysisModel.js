import mongoose from "mongoose";
import { getFormattedDateTime } from "../../utils/index.js";

const PRAnalysisSchema = new mongoose.Schema(
  {
    Analysis_Id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    Repo_Id: { type: mongoose.Schema.Types.ObjectId, ref: "Repository", required: true },
    User_Id: { type: String, default: "" }, // Track which user initiated this analysis
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    pr_number: { type: Number, required: true },
    title: { type: String, default: "" },
    risk_analysis: { type: String, default: "" },
    pr_comment: { type: String, default: "" },
    severity: { type: String, default: "" },
    analysis_type: { type: String, enum: ["manual", "webhook"], default: "manual" }, // Type of analysis
    Created_At: { type: String, default: () => getFormattedDateTime() },
    Updated_At: { type: String, default: () => getFormattedDateTime() },
  },
  { versionKey: false, timestamps: false }
);

PRAnalysisSchema.index({ Repo_Id: 1, pr_number: 1 }, { unique: true });
PRAnalysisSchema.pre("save", function () {
  this.Updated_At = getFormattedDateTime();
});
PRAnalysisSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};
  update.$set = update.$set || {};
  update.$set.Updated_At = getFormattedDateTime();
});

const PRAnalysis = mongoose.model("PRAnalysis", PRAnalysisSchema);
export default PRAnalysis;

