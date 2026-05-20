// region imports
import express from "express";
import {
  start2FASetup,
  setupPhone2FA,
  verifyPhone2FA,
  setupAuthenticator2FA,
  verifyAuthenticator2FA,
  generateBackupCodes2FA,
  complete2FASetup,
  get2FAStatus,
  verify2FALogin,
  send2FALoginCode,
} from "../../controllers/twofa/twoFAController.js";
import { auth, rateLimiter } from "../../middleware/index.js";
// endregion

// region router
const router = express.Router();
// endregion

// region routes
// Setup routes (require authentication)
router.post("/setup/start", auth(), start2FASetup);
router.post("/setup/phone", auth(), setupPhone2FA);
router.post("/setup/phone/verify", auth(), verifyPhone2FA);
router.post("/setup/authenticator", auth(), setupAuthenticator2FA);
router.post("/setup/authenticator/verify", auth(), verifyAuthenticator2FA);
router.post("/setup/backup-codes", auth(), generateBackupCodes2FA);
router.post("/setup/complete", auth(), complete2FASetup);

// Status route (require authentication)
router.get("/status", auth(), get2FAStatus);

// Login routes (no authentication required)
router.post("/login/send-code", send2FALoginCode);
router.post("/login/verify", verify2FALogin);
// endregion

// region exports
export default router;
// endregion
