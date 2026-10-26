import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import passport, { googleEnabled, microsoftEnabled } from "../config/passport.js";
import { authLimiter, forgotPasswordLimiter } from "../config/rateLimiters.js";
import { getPrimaryClientOrigin } from "../config/clientOrigins.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/authValidators.js";

let router = Router();

router.post("/register", authLimiter, validate(registerSchema), asyncHandler(authController.register));
router.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post("/refresh", authLimiter, validate(refreshSchema), asyncHandler(authController.refresh));
router.post("/logout", validate(logoutSchema), asyncHandler(authController.logout));
router.get("/me", requireAuth, asyncHandler(authController.getMe));
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);
router.post("/reset-password", validate(resetPasswordSchema), asyncHandler(authController.resetPassword));

// --- OAuth (only mounted when GOOGLE_CLIENT_ID/SECRET are set in .env) ---
if (googleEnabled) {
  router.get("/oauth/google", passport.authenticate("google", { session: false, scope: ["profile", "email"] }));
  router.get(
    "/oauth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/api/auth/oauth/failure" }),
    asyncHandler(async (req, res) => {
      let { token } = await authController.issueOAuthToken(req.user.email, req.user.name);
      let clientUrl = getPrimaryClientOrigin(req);
      res.redirect(`${clientUrl}/dashboard?token=${token}`);
    })
  );
} else {
  router.get("/oauth/google", (req, res) => {
    res.status(501).json({
      success: false,
      error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.",
    });
  });
}

// --- OAuth (only mounted when MICROSOFT_CLIENT_ID/SECRET are set in .env) ---
if (microsoftEnabled) {
  router.get("/oauth/microsoft", passport.authenticate("microsoft", { session: false }));
  router.get(
    "/oauth/microsoft/callback",
    passport.authenticate("microsoft", { session: false, failureRedirect: "/api/auth/oauth/failure" }),
    asyncHandler(async (req, res) => {
      let { token } = await authController.issueOAuthToken(req.user.email, req.user.name);
      let clientUrl = getPrimaryClientOrigin(req);
      res.redirect(`${clientUrl}/dashboard?token=${token}`);
    })
  );
} else {
  router.get("/oauth/microsoft", (req, res) => {
    res.status(501).json({
      success: false,
      error: "Microsoft OAuth is not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in .env.",
    });
  });
}

router.get("/oauth/failure", (req, res) => {
  let clientUrl = getPrimaryClientOrigin(req);
  res.redirect(`${clientUrl}/login?error=oauth_failed`);
});

export default router;
