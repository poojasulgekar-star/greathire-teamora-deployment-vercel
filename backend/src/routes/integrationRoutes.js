import { Router } from "express";
import crypto from "node:crypto";
import { ApiError } from "../middleware/errorHandler.js";
import { Attendance } from "../models/Attendance.js";
   import { Employee } from "../models/Employee.js";

const router = Router();

function verifyIntegrationKey(req, res, next) {
  const expected = process.env.INTEGRATION_API_KEY;
  if (!expected) {
    return next(new ApiError(503, "Integration is not configured"));
  }
  const provided = Buffer.from(req.get("x-integration-key") || "");
  const wanted = Buffer.from(expected);
  if (provided.length !== wanted.length || !crypto.timingSafeEqual(provided, wanted)) {
    return next(new ApiError(401, "Invalid integration key"));
  }
  next();
}

router.post("/attendance", verifyIntegrationKey, async (req, res, next) => {
  try {
    const { employeeCode, date, checkIn, checkOut } = req.body || {};
    if (!employeeCode) throw new ApiError(400, "employeeCode is required");

    const { created, record } = await Attendance.recordFromVerification({
      employeeCode,
      date,
      checkIn,
      checkOut,
    });

    res.status(created ? 201 : 200).json({ success: true, created, data: record });
  } catch (err) {
    next(err);
  }
});

   // Called by the verification portal when an admin adds an employee there.
   // Safe to call twice: an existing email is returned, not duplicated.
   router.post("/employee", verifyIntegrationKey, async (req, res, next) => {
     try {
       const name = String(req.body?.name || "").trim();
       const email = String(req.body?.email || "").trim().toLowerCase();
       const phone = req.body?.phone ? String(req.body.phone).trim() : null;
       const department = String(req.body?.department || "").trim() || "Unassigned";

       if (!name || !email) throw new ApiError(400, "name and email are required");
       if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError(400, "email is not valid");

       const existing = Employee.getAll().find(
         (e) => String(e.email || "").trim().toLowerCase() === email
       );
       if (existing) {
         return res.status(200).json({
           success: true,
           created: false,
           data: { id: existing.id, employeeCode: existing.employeeCode },
         });
       }

       // Role is fixed on purpose so the caller can never create an administrator.
       const employee = await Employee.create({ name, email, phone, department, role: "Employee" });
       res.status(201).json({
         success: true,
         created: true,
         data: { id: employee.id, employeeCode: employee.employeeCode },
       });
     } catch (err) {
       next(err);
     }
   });
export default router;