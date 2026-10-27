import bcrypt from "bcryptjs";
import {
  EmployeeModel,
  UserModel,
  ChannelModel,
  DirectConversationModel,
} from "./schemas.js";
import { logger } from "../config/logger.js";

// The one account this app ships with. Log in as this admin, then add real
// employees (and message channels) from the UI — nothing else is pre-seeded.
export const CURRENT_EMPLOYEE_ID = "emp_admin";

// ---------------------------------------------------------------------------
// Employees — just the one admin account.
// ---------------------------------------------------------------------------
function buildEmployees() {
  return [
    {
      id: CURRENT_EMPLOYEE_ID,
      name: "Admin",
      role: "Administrator",
      department: "Management",
      initials: "AD",
      joiningDate: new Date().toISOString().slice(0, 10),
      avatar: null,
      employeeCode: "GH-1000",
      email: "admin@greathire.com",
      phone: null,
      performanceScore: 0,
      taskLoadPercent: 0,
      leaveAllocation: { casual: 6, paid: 12, sick: 4 },
      leaveAccrual: 0,
      documents: [],
    },
  ];
}

// ---------------------------------------------------------------------------
// Messaging — one default "General" channel so there's somewhere for newly
// created employees to land (see data/messagesStore.js#addEmployeeToDefaultChannels,
// called from Employee.create()). No demo messages or DMs.
// ---------------------------------------------------------------------------
function buildDefaultChannel(adminId) {
  return [{ id: "chan_general", name: "General", memberIds: [adminId], isDefault: true, createdBy: adminId }];
}

function roleForEmployee() {
  // Only one seeded employee, and it's always the admin.
  return "admin";
}

/**
 * Ensures required seed data exists and that the administrator login
 * credentials match SEED_USER_PASSWORD (default: password123).
 * Always keeps admin login operational even if users/employees were altered.
 */
export async function seedDatabaseIfEmpty() {
  if (process.env.SEED_DEMO_DATA === "false") return;

  let demoPassword = process.env.SEED_USER_PASSWORD || "password123";
  let passwordHash = bcrypt.hashSync(demoPassword, 10);

  let employeeCount = await EmployeeModel.countDocuments();
  let employees;
  if (employeeCount === 0) {
    employees = buildEmployees();
    await EmployeeModel.insertMany(employees);
    logger.info(`[seed] inserted ${employees.length} employee (admin)`);
  } else {
    // Ensure admin employee GH-1000 exists
    let adminEmp = await EmployeeModel.findOne({ id: CURRENT_EMPLOYEE_ID });
    if (!adminEmp) {
      await EmployeeModel.create(buildEmployees()[0]);
      logger.info("[seed] restored missing admin employee profile");
    }
    employees = await EmployeeModel.find().lean();
  }

  // Ensure Admin user always exists and has valid password credentials
  let adminUser = await UserModel.findOne({
    $or: [{ id: "user_admin" }, { email: /^admin@greathire\.com$/i }, { employeeId: CURRENT_EMPLOYEE_ID }],
  });

  if (!adminUser) {
    await UserModel.create({
      id: "user_admin",
      employeeId: CURRENT_EMPLOYEE_ID,
      name: "Admin",
      email: "admin@greathire.com",
      passwordHash,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    logger.info(`[seed] created admin login (demo password: ${demoPassword})`);
  } else if (!bcrypt.compareSync(demoPassword, adminUser.passwordHash)) {
    await UserModel.updateOne({ _id: adminUser._id }, { $set: { passwordHash, role: "admin" } });
    logger.info("[seed] verified and synchronized admin password credentials");
  }

  // Also ensure workspace owner email if present has valid password credentials
  let sravanUser = await UserModel.findOne({ email: /^sravanpilla1809@gmail\.com$/i });
  if (sravanUser && !bcrypt.compareSync(demoPassword, sravanUser.passwordHash)) {
    await UserModel.updateOne({ _id: sravanUser._id }, { $set: { passwordHash, role: "admin" } });
    logger.info("[seed] verified and synchronized owner (sravan) credentials");
  }

  if ((await ChannelModel.countDocuments()) === 0 && (await DirectConversationModel.countDocuments()) === 0) {
    let channels = buildDefaultChannel(CURRENT_EMPLOYEE_ID);
    await ChannelModel.insertMany(channels);
    logger.info(`[seed] inserted ${channels.length} default channel`);
  }
}
