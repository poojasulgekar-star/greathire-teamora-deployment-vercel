import { UserModel, PasswordResetTokenModel } from "../db/schemas.js";
import { generateId } from "../utils/id.js";
import { generateRawToken, hashToken } from "../utils/refreshToken.js";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Demo credentials — every seeded employee can sign in with this password.
// Change SEED_USER_PASSWORD in your .env before using this anywhere but local dev.
export const DEMO_PASSWORD_PLAIN = process.env.SEED_USER_PASSWORD || "password123";

function strip(doc) {
  if (!doc) return null;
  let { _id, ...rest } = doc;
  return rest;
}

/** All reads/writes go straight to MongoDB — auth data is small and low-traffic
 * enough that an in-memory cache isn't worth the staleness risk. */
export const UsersStore = {
  async findByEmail(email) {
    if (!email) return null;
    let cleanEmail = String(email).trim().toLowerCase();
    let escaped = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let doc = await UserModel.findOne({ email: new RegExp(`^${escaped}$`, "i") }).lean();

    // Fallback support for admin alias (admin@greathire.com and greathire849@gmail.com)
    if (!doc && (cleanEmail === "greathire849@gmail.com" || cleanEmail === "admin@greathire.com")) {
      doc = await UserModel.findOne({
        email: { $in: [/^admin@greathire\.com$/i, /^greathire849@gmail\.com$/i] },
      }).lean();
    }

    return strip(doc);
  },
  async findById(id) {
    return strip(await UserModel.findOne({ id }).lean());
  },
  async findByEmployeeId(employeeId) {
    return strip(await UserModel.findOne({ employeeId }).lean());
  },
  async create({ name, email, passwordHash, employeeId, role = "employee" }) {
    let user = {
      id: generateId("user"),
      employeeId: employeeId || null,
      name,
      email: String(email).trim().toLowerCase(),
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };
    await UserModel.create(user);
    return user;
  },
  /** Generates a high-entropy raw token, persists only its hash + a 30-minute
   * expiry, and returns the raw value — that's the only place it ever exists
   * outside the user's inbox. */
  async createPasswordResetToken(userId) {
    let rawToken = generateRawToken();
    let tokenHash = hashToken(rawToken);
    let expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    // A user can only have one live reset link at a time — old ones are
    // superseded so an inbox full of stale links can't be replayed.
    await PasswordResetTokenModel.deleteMany({ userId, used: false });
    await PasswordResetTokenModel.create({ tokenHash, userId, expiresAt, used: false });
    return rawToken;
  },
  /** Hashes the raw token from the reset link, and only returns a match if
   * it exists, hasn't expired, and hasn't already been used. Marks it used
   * atomically so the same link can't be replayed (e.g. two tabs racing). */
  async consumePasswordResetToken(rawToken) {
    if (!rawToken) return null;
    let tokenHash = hashToken(rawToken);
    let entry = await PasswordResetTokenModel.findOneAndUpdate(
      { tokenHash, used: false },
      { $set: { used: true } },
      { new: false }
    ).lean();
    if (!entry) return null;
    if (new Date(entry.expiresAt).getTime() < Date.now()) return null;
    return entry;
  },
  async updatePassword(userId, passwordHash) {
    let user = await UserModel.findOneAndUpdate({ id: userId }, { $set: { passwordHash } }, { new: true }).lean();
    return strip(user);
  },
  /** Removes the login account tied to a deleted employee, so it can no
   * longer be used to sign in. */
  async deleteByEmployeeId(employeeId) {
    await UserModel.deleteOne({ employeeId });
  },
};

/** Handy for local testing / seed logs — resolved lazily since it needs a DB round trip. */
export async function getDefaultUserEmail(currentEmployeeId) {
  let user = await UsersStore.findByEmployeeId(currentEmployeeId);
  return user?.email;
}
