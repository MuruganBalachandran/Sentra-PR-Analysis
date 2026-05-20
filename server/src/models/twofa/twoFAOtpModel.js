// region imports
import mongoose from "mongoose";
// endregion

// region schema
const TwoFAOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },

    otp: {
      type: String,
      required: true,
    },

    method: {
      type: String,
      enum: ["PHONE", "AUTHENTICATOR"],
      required: true,
    },

    purpose: {
      type: String,
      enum: ["SETUP_2FA", "LOGIN_2FA", "VERIFY_PHONE"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    used: {
      type: Boolean,
      default: false,
    },

    used_at: Date,

    attempts: {
      type: Number,
      default: 0,
    },

    max_attempts: {
      type: Number,
      default: 5,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
// endregion

// region indexes
TwoFAOtpSchema.index({ email: 1, method: 1, purpose: 1 });
TwoFAOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// endregion

// region model
const TwoFAOtp = mongoose.model("TwoFAOtp", TwoFAOtpSchema);
// endregion

// region exports
export default TwoFAOtp;
// endregion
