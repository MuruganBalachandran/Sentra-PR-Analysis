import mongoose from "mongoose";
import { getFormattedDateTime } from "../../utils/index.js";

const RepositorySchema = new mongoose.Schema(
  {
    Repo_Id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    owner: { type: String, required: true },
    name: { type: String, required: true },
    full_name: { type: String, required: true, unique: true },
    github_id: { type: Number },
    default_branch: { type: String, default: "main" },
    summary: { type: String, default: "" },
    installation_id: { type: Number },
    is_active: { type: Boolean, default: true },
    Created_At: { type: String, default: () => getFormattedDateTime() },
    Updated_At: { type: String, default: () => getFormattedDateTime() },
  },
  { versionKey: false, timestamps: false }
);

RepositorySchema.index({ full_name: 1 }, { unique: true });
RepositorySchema.pre("save", function () {
  this.Updated_At = getFormattedDateTime();
});
RepositorySchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};
  update.$set = update.$set || {};
  update.$set.Updated_At = getFormattedDateTime();
});

const Repository = mongoose.model("Repository", RepositorySchema);
export default Repository;

