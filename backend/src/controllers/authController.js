import { UsersStore } from "../data/usersStore.js";
import { RefreshTokenStore } from "../data/refreshTokenStore.js";
import { Employee } from "../models/Employee.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import { ApiError } from "../middleware/errorHandler.js";
import { sendPasswordResetEmail } from "../config/email.js";
import { getPrimaryClientOrigin } from "../config/clientOrigins.js";

function toPublicUser(user) {
  let employee = user.employeeId ? Employee.getById(user.employeeId) : null;
  return {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: employee?.avatar || null,
    department: employee?.department || null,
    employeeCode: employee?.employeeCode || null,
  };
}

export let authController = {
  // POST /api/auth/register
  register: async (req, res) => {
    let { name, email, password } = req.body;
    if (await UsersStore.findByEmail(email)) {
      throw new ApiError(409, "An account with this email already exists");
    }

    let passwordHash = await hashPassword(password);
    let user = await UsersStore.create({ name, email, passwordHash, role: "employee" });
    let token = signAccessToken({ sub: user.id, role: user.role });
    let refreshToken = await RefreshTokenStore.issue(user.id, { rememberMe: false });

    res.status(201).json({ success: true, data: { user: toPublicUser(user), token, refreshToken } });
  },

  // POST /api/auth/login
  login: async (req, res) => {
    let { email, password, rememberMe } = req.body;

    let user = await UsersStore.findByEmail(email);
    let valid = user ? await comparePassword(password, user.passwordHash) : false;
    if (!user || !valid) throw new ApiError(401, "Invalid email or password");

    let token = signAccessToken({ sub: user.id, role: user.role }, { rememberMe: !!rememberMe });
    let refreshToken = await RefreshTokenStore.issue(user.id, { rememberMe: !!rememberMe });
    res.json({ success: true, data: { user: toPublicUser(user), token, refreshToken } });
  },

  // POST /api/auth/refresh — exchanges a valid refresh token for a new access
  // token + a rotated refresh token. The old refresh token is revoked the
  // instant it's used, so it can't be replayed.
  refresh: async (req, res) => {
    let { refreshToken } = req.body;

    let rotated = await RefreshTokenStore.rotate(refreshToken);
    if (!rotated) throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");

    let user = await UsersStore.findById(rotated.userId);
    if (!user) throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");

    let token = signAccessToken({ sub: user.id, role: user.role });
    res.json({ success: true, data: { user: toPublicUser(user), token, refreshToken: rotated.rawToken } });
  },

  // POST /api/auth/logout — revokes the refresh token that's presented (if any),
  // so it can't be used to mint new access tokens after the user signs out.
  // The short-lived access token itself is stateless and just expires naturally.
  logout: async (req, res) => {
    let { refreshToken } = req.body;
    if (refreshToken) await RefreshTokenStore.revoke(refreshToken);
    res.json({ success: true, message: "Logged out" });
  },

  // GET /api/auth/me
  getMe: async (req, res) => {
    let user = await UsersStore.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found");
    res.json({ success: true, data: toPublicUser(user) });
  },

  // POST /api/auth/forgot-password
  // Shared by both Admin and Employee logins — the account is looked up by
  // email alone, so there's no separate admin/employee reset flow.
  forgotPassword: async (req, res) => {
    let { email } = req.body;

    let user = await UsersStore.findByEmail(email);
    // Always respond the same way whether or not the account exists, and do
    // the same amount of work either way, to avoid leaking which emails are
    // registered (timing- and response-based enumeration).
    if (user) {
      let rawToken = await UsersStore.createPasswordResetToken(user.id);
      let clientOrigin = getPrimaryClientOrigin(req);
      let resetUrl = `${clientOrigin}/reset-password?token=${encodeURIComponent(rawToken)}`;
      await sendPasswordResetEmail({ to: user.email, resetUrl });
    }
    res.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  },

  // POST /api/auth/reset-password
  resetPassword: async (req, res) => {
    let { token, password } = req.body;

    let entry = await UsersStore.consumePasswordResetToken(token);
    if (!entry) throw new ApiError(400, "This reset link is invalid or has expired. Please request a new one.");

    let passwordHash = await hashPassword(password);
    await UsersStore.updatePassword(entry.userId, passwordHash);
    await RefreshTokenStore.revokeAllForUser(entry.userId);
    res.json({ success: true, message: "Password has been reset. You can now sign in." });
  },

  // Called by the Google/Microsoft OAuth callback routes once passport has verified the profile.
  issueOAuthToken: async (profileEmail, profileName) => {
    let user = await UsersStore.findByEmail(profileEmail);
    if (!user) {
      user = await UsersStore.create({
        name: profileName || profileEmail,
        email: profileEmail,
        passwordHash: null,
        role: "employee",
      });
    }
    let token = signAccessToken({ sub: user.id, role: user.role });
    return { user: toPublicUser(user), token };
  },
};
