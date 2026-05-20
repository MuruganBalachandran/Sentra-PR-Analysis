// region imports
import mongoose from "mongoose";
import { getFormattedDateTime } from "../../utils/index.js";
// endregion


// region schema
const ActivityLogSchema = new mongoose.Schema(
  {
    Log_Id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },

    User_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    Email: {
      type: String,
      default: "Guest",
    },

    Action: {
      type: String,
    },

    URL: {
      type: String,
      default: "",
    },

    Status: {
      type: Number,
      default: 0,
    },

    IP: {
      type: String,
      default: "",
    },

    Is_Deleted: {
      type: Number,
      default: 0,
    },

    Duration: {
      type: String,
      default: "",
    },

    Activity: {
      type: String,
      default: "",
    },

    Created_At: {
      type: String,
      default: () => getFormattedDateTime(),
    },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);
// endregion


// region indexes
ActivityLogSchema.index({ Log_Id: 1 }, { unique: true });
ActivityLogSchema.index({ User_Id: 1, Is_Deleted: 1 });
ActivityLogSchema.index({ Email: 1, Is_Deleted: 1 });
ActivityLogSchema.index({ Action: 1, Is_Deleted: 1 });
ActivityLogSchema.index({ URL: 1, Is_Deleted: 1 });
ActivityLogSchema.index({ Created_At: -1, Is_Deleted: 1 });
// endregion


// region middleware
ActivityLogSchema.pre("save", function (next) {
  this.Created_At = getFormattedDateTime();
});
// endregion


// region transforms
ActivityLogSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

ActivityLogSchema.set("toObject", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});
// endregion


// region model
const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);
// endregion


// region exports
export default ActivityLog;
// endregion
