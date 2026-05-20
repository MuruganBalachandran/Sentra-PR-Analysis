import mongoose from "mongoose";
import { getFormattedDateTime } from "../../utils/index.js";

const DependencyGraphSchema = new mongoose.Schema(
  {
    Graph_Id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    Repo_Id: { type: mongoose.Schema.Types.ObjectId, ref: "Repository", required: true },
    dependency_graph: { type: Object, default: {} },
    Created_At: { type: String, default: () => getFormattedDateTime() },
    Updated_At: { type: String, default: () => getFormattedDateTime() },
  },
  { versionKey: false, timestamps: false }
);

DependencyGraphSchema.index({ Repo_Id: 1 }, { unique: true });
DependencyGraphSchema.pre("save", function () {
  this.Updated_At = getFormattedDateTime();
});
DependencyGraphSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};
  update.$set = update.$set || {};
  update.$set.Updated_At = getFormattedDateTime();
});

const DependencyGraph = mongoose.model("DependencyGraph", DependencyGraphSchema);
export default DependencyGraph;

