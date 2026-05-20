// region imports
import express from "express";
import {
  login,
  logout,
  getProfile,
  signup,
  resendOtp,
  forgotPassword,
  resetPassword,
} from "../../controllers/auth/authController.js";
import {
  initiateSignup,
  verifySignupEmail,
  setupProfile,
  setupPhone2FASignup,
  verifyPhone2FASignup,
  setupAuthenticator2FASignup,
  verifyAuthenticator2FASignup,
  generateBackupCodesSignup,
  completeSignup,
  getSignupProgress,
  resendEmailVerificationOtp,
  resendPhone2FAOtp,
} from "../../controllers/auth/signupController.js";
import { auth, rateLimiter } from "../../middleware/index.js";
// endregion

// region router
const router = express.Router();
// endregion

// region routes
// Legacy endpoints (kept for backward compatibility)
router.post("/login", rateLimiter("Login"), login);
router.post("/signup", signup);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", rateLimiter("ForgotPassword"), forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", auth(), logout);
router.get("/profile", auth(), getProfile);

// New multi-stage signup flow
router.post("/signup/initiate", rateLimiter("Signup"), initiateSignup);
router.post("/signup/verify-email", verifySignupEmail);
router.post("/signup/resend-email-otp", resendEmailVerificationOtp);
router.post("/signup/setup-profile", setupProfile);
router.post("/signup/setup-phone-2fa", setupPhone2FASignup);
router.post("/signup/verify-phone-2fa", verifyPhone2FASignup);
router.post("/signup/resend-phone-2fa-otp", resendPhone2FAOtp);
router.post("/signup/setup-authenticator-2fa", setupAuthenticator2FASignup);
router.post("/signup/verify-authenticator-2fa", verifyAuthenticator2FASignup);
router.post("/signup/generate-backup-codes", generateBackupCodesSignup);
router.post("/signup/complete", completeSignup);
router.post("/signup/progress", getSignupProgress);
// endregion

// region exports
export default router;
// endregion
