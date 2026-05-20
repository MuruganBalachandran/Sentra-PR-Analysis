import mongoose from "mongoose";

// OTPs expire after 10 minutes
const OtpSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true },
        otp: { type: String, required: true },          // plain — we store bcrypt hash alternatively but plain is fine for 6-digit short-lived
        purpose: { type: String, enum: ["VERIFY_EMAIL", "RESET_PASSWORD"], required: true },
        expiresAt: { type: Date, required: true },
        used: { type: Boolean, default: false },
    },
    { versionKey: false, timestamps: false },
);

OtpSchema.index({ email: 1, purpose: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index — Mongo auto-deletes

const Otp = mongoose.model("Otp", OtpSchema);
export default Otp;
