import mongoose from "mongoose";

// Schema for repositories monitored by users for automated PR analysis
const MonitoredRepositorySchema = new mongoose.Schema(
    {
        // Reference to the user who configured this monitoring
        User_Id: {
            type: String,
            required: true,
            index: true,
        },
        // GitHub repository ID
        github_repo_id: {
            type: Number,
            default: null,
        },
        // Repository owner (username or organization)
        owner: {
            type: String,
            required: true,
        },
        // Repository name
        repo: {
            type: String,
            required: true,
        },
        // Full repository name (owner/repo)
        full_name: {
            type: String,
            required: true,
            index: true,
        },
        // GitHub webhook ID created for this repo
        github_webhook_id: {
            type: Number,
            default: null,
        },
        // Whether monitoring is currently enabled
        enabled: {
            type: Boolean,
            default: true,
        },
        // Repository visibility (public/private)
        is_private: {
            type: Boolean,
            default: false,
        },
        // Repository URL for reference
        repository_url: {
            type: String,
            default: "",
        },
        // Monitoring settings for this repository
        settings: {
            // Auto-add labels based on risk analysis
            auto_label: {
                type: Boolean,
                default: true,
            },
            // Auto-request reviewers based on code owners
            auto_assign_reviewers: {
                type: Boolean,
                default: true,
            },
            // Auto-create issues for critical findings
            create_issues: {
                type: Boolean,
                default: true,
            },
            // Severity threshold for actions (low, medium, high, critical)
            severity_threshold: {
                type: String,
                enum: ["low", "medium", "high", "critical"],
                default: "medium",
            },
            // Notify external services (future feature)
            notify_external: {
                type: Boolean,
                default: false,
            },
        },
        // Track last analysis run on this repo
        last_analysis_at: {
            type: Date,
            default: null,
        },
        // Count of PRs analyzed
        pr_count: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: {
            createdAt: "Created_At",
            updatedAt: "Updated_At",
        },
    }
);

// A user can monitor a repository once, while different users can monitor the same repo.
MonitoredRepositorySchema.index({ User_Id: 1, full_name: 1 }, { unique: true });

const MonitoredRepository = mongoose.model(
    "MonitoredRepository",
    MonitoredRepositorySchema
);

export { MonitoredRepository };
