import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
const db = mongoose.connection.db;
const users = db.collection("users");
const employees = db.collection("employees");

const passwordHash = bcrypt.hashSync("password123", 10);

// 1. Ensure admin@greathire.com is admin with password123
await users.updateOne(
  { email: /^admin@greathire\.com$/i },
  {
    $set: {
      name: "Admin",
      email: "admin@greathire.com",
      passwordHash,
      role: "admin",
      employeeId: "emp_admin"
    }
  },
  { upsert: true }
);

// 2. Ensure sravanpilla1809@gmail.com has password123 and admin privileges
await users.updateOne(
  { email: /^sravanpilla1809@gmail\.com$/i },
  {
    $set: {
      passwordHash,
      role: "admin"
    }
  }
);
await employees.updateOne(
  { email: /^sravanpilla1809@gmail\.com$/i },
  {
    $set: {
      role: "Administrator"
    }
  }
);

// 3. Ensure greathire849@gmail.com also exists as an admin user with password123
const existingGreathire = await users.findOne({ email: /^greathire849@gmail\.com$/i });
if (!existingGreathire) {
  await users.insertOne({
    id: "user_greathire849",
    employeeId: "emp_admin",
    name: "GreatHire Admin",
    email: "greathire849@gmail.com",
    passwordHash,
    role: "admin",
    createdAt: new Date().toISOString()
  });
} else {
  await users.updateOne(
    { email: /^greathire849@gmail\.com$/i },
    { $set: { passwordHash, role: "admin" } }
  );
}

// 4. Ensure poojasulgekar20@gmail.com also has password123
await users.updateOne(
  { email: /^poojasulgekar20@gmail\.com$/i },
  { $set: { passwordHash } }
);

console.log("Successfully synced passwords and admin roles for all accounts in MongoDB Atlas.");
const allUsers = await users.find({}).toArray();
for (const u of allUsers) {
  console.log(`- ${u.email} (${u.name}, role: ${u.role}) -> matches password123? ${bcrypt.compareSync("password123", u.passwordHash)}`);
}

await mongoose.disconnect();
