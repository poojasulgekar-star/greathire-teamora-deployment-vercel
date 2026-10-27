import rateLimit from "express-rate-limit";

// Shared response shape matches the rest of the API's error format.
function limitHandler(req, res) {
  res.status(429).json({
    success: false,
    error: "Too many login attempts. Please wait a minute and try again.",
  });
}

// Login/register: generous for genuine users and retries, while still defending against brute force.
// skipSuccessfulRequests ensures legitimate logins never count against the retry allowance.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "test" ? 100 : 60,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
});

// Forgot-password: each hit can trigger an outbound email.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === "test" ? 100 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
});
