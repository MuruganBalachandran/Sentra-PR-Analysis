// region imports
import mongoose from "mongoose";
import { getFormattedDateTime } from "../../utils/common/commonFunctions.js";
// endregion

// region schema
const SignupProgressSchema = new mongoose.Schema(
  {
    Progress_Id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },

    Email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    Stage: {
      type: String,
      enum: ["EMAIL_VERIFICATION", "PROFILE_SETUP", "TWO_FA_SETUP", "COMPLETED"],
      default: "EMAIL_VERIFICATION",
    },

    Email_Verified: {
      type: Boolean,
      default: false,
    },

    Email_Verified_At: Date,

    Profile_Data: {
      name: String,
      password: String, // Will be hashed before saving to User
    },

    Profile_Completed: {
      type: Boolean,
      default: false,
    },

    Profile_Completed_At: Date,

    TwoFA_Setup_Data: {
      phone_number: String,
      phone_verified: { type: Boolean, default: false },
      authenticator_secret: String,
      authenticator_verified: { type: Boolean, default: false },
      backup_codes: [
        {
          code: String,
          used: { type: Boolean, default: false },
          used_at: Date,
        },
      ],
      backup_codes_generated: { type: Boolean, default: false },
    },

    TwoFA_Completed: {
      type: Boolean,
      default: false,
    },

    TwoFA_Completed_At: Date,

    User_Id: mongoose.Schema.Types.ObjectId, // Reference to created user

    Is_Deleted: {
      type: Number,
      default: 0,
    },

    Created_At: {
      type: String,
      default: () => getFormattedDateTime(),
    },

    Updated_At: {
      type: String,
      default: () => getFormattedDateTime(),
    },

    Expires_At: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expireAfterSeconds: 0 }, // TTL index
    },
  },
  {
    versionKey: false,
    timestamps: false,
  },
);
// endregion

// region indexes
SignupProgressSchema.index(
  { Email: 1 },
  { unique: true, partialFilterExpression: { Is_Deleted: 0 } },
);

SignupProgressSchema.index({ Stage: 1, Is_Deleted: 1 });
SignupProgressSchema.index({ Created_At: -1, Is_Deleted: 1 });
SignupProgressSchema.index({ Expires_At: 1 }, { expireAfterSeconds: 0 });
// endregion

// region middleware
SignupProgressSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() || {};

  if (!update.$set) {
    update.$set = {};
  }
  update.$set.Updated_At = getFormattedDateTime();
});
// endregion

// region model
const SignupProgress = mongoose.model("SignupProgress", SignupProgressSchema);
// endregion

// region exports
export default SignupProgress;
// endregion
