import mongoose from "mongoose";
import { getFormattedDateTime } from "../../utils/index.js";

const FragileModuleSchema = new mongoose.Schema(
  {
    Fragile_Id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    Repo_Id: { type: mongoose.Schema.Types.ObjectId, ref: "Repository", required: true },
    modules: { type: [String], default: [] },
    notes: { type: String, default: "" },
    Created_At: { type: String, default: () => getFormattedDateTime() },
    Updated_At: { type: String, default: () => getFormattedDateTime() },
  },
  { versionKey: false, timestamps: false }
);

FragileModuleSchema.index({ Repo_Id: 1 }, { unique: true });
FragileModuleSchema.pre("save", function () {
  this.Updated_At = getFormattedDateTime();
});
FragileModuleSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};
  update.$set = update.$set || {};
  update.$set.Updated_At = getFormattedDateTime();
});

const FragileModule = mongoose.model("FragileModule", FragileModuleSchema);
export default FragileModule;

