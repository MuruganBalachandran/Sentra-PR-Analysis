import mongoose from "mongoose";
import { getFormattedDateTime } from "../../utils/index.js";

const ModuleOwnershipSchema = new mongoose.Schema(
  {
    Ownership_Id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    Repo_Id: { type: mongoose.Schema.Types.ObjectId, ref: "Repository", required: true },
    ownership_map: { type: Object, default: {} },
    Created_At: { type: String, default: () => getFormattedDateTime() },
    Updated_At: { type: String, default: () => getFormattedDateTime() },
  },
  { versionKey: false, timestamps: false }
);

ModuleOwnershipSchema.index({ Repo_Id: 1 }, { unique: true });
ModuleOwnershipSchema.pre("save", function () {
  this.Updated_At = getFormattedDateTime();
});
ModuleOwnershipSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};
  update.$set = update.$set || {};
  update.$set.Updated_At = getFormattedDateTime();
});

const ModuleOwnership = mongoose.model("ModuleOwnership", ModuleOwnershipSchema);
export default ModuleOwnership;

