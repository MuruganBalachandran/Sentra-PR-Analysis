import mongoose from "mongoose";

const MonitoredRepositorySchema = new mongoose.Schema(
  {
    User_Id: { type: String, required: true, index: true },
    github_repo_id: { type: Number, default: null },
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    full_name: { type: String, required: true, index: true },
    github_webhook_id: { type: Number, default: null },
    enabled: { type: Boolean, default: true },
    is_private: { type: Boolean, default: false },
    repository_url: { type: String, default: "" },
    settings: {
      // Post AI analysis as a comment on the PR (from owner's GitHub account)
      post_comment: { type: Boolean, default: true },
      // Send email notification when a PR is analyzed
      send_email: { type: Boolean, default: true },
      // Delete Sentra comment from GitHub when PR is merged
      delete_comment_on_merge: { type: Boolean, default: true },
      // Severity threshold — only notify/comment if severity meets or exceeds this
      severity_threshold: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "low",
      },
    },
    last_analysis_at: { type: Date, default: null },
    pr_count: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "Created_At", updatedAt: "Updated_At" },
  }
);

MonitoredRepositorySchema.index({ User_Id: 1, full_name: 1 }, { unique: true });

const MonitoredRepository = mongoose.model("MonitoredRepository", MonitoredRepositorySchema);

export { MonitoredRepository };
