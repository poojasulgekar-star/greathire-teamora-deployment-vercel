import mongoose from "mongoose";

let { Schema, model } = mongoose;

/** Shared options: use our own string `id` as the public primary key (keeps every
 * existing controller/model untouched — none of them know Mongo's `_id` exists),
 * and drop __v since nothing here uses optimistic concurrency. */
let base = { versionKey: false };

let EmployeeSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    name: String,
    role: String,
    department: String,
    initials: String,
    joiningDate: String,
    avatar: { type: String, default: null },
    employeeCode: String,
    email: { type: String, index: true },
    phone: String,
    performanceScore: Number,
    taskLoadPercent: Number,
    leaveAllocation: {
      casual: Number,
      paid: Number,
      sick: Number,
    },
    // Running total of ± adjustments to leave balance driven by attendance events
    // (+0.5 per check-in, -0.5 per correction to "Absent", +0.5 reversing it).
    // Folded into EmployeeProfile.getStatCards()'s Leave Balance figure.
    leaveAccrual: { type: Number, default: 0 },
    documents: [{ name: String, note: String, type: { type: String } }],
  },
  base
);


let UserSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    employeeId: { type: String, default: null },
    name: String,
    email: { type: String, index: true },
    passwordHash: { type: String, default: null },
    role: { type: String, default: "employee" },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  base
);

let PasswordResetTokenSchema = new Schema(
  {
    // SHA-256 hash of the raw token — mirrors RefreshTokenSchema below. Only
    // the raw value is ever emailed to the user; a DB leak alone can't be
    // replayed to reset someone's password.
    tokenHash: { type: String, unique: true, index: true },
    userId: { type: String, index: true },
    expiresAt: String,
    used: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  base
);

let RefreshTokenSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    userId: { type: String, index: true },
    // SHA-256 hash of the raw token — the raw value is only ever sent to the
    // client, never stored, so a DB leak alone can't be used to log in.
    tokenHash: { type: String, unique: true, index: true },
    rememberMe: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    // When a token is rotated, this points at its replacement. If a revoked
    // token is ever presented again, that's a reuse signal (likely theft) and
    // every token in the user's chain gets revoked.
    replacedByTokenHash: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  base
);

let AttendanceSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    employeeId: { type: String, index: true },
    date: { type: String, index: true },
    status: String,
    liveStatus: { type: String, default: null },
    checkIn: { type: String, default: null },
    checkOut: { type: String, default: null },
    late: { type: Boolean, default: false },
    hoursWorked: { type: Number, default: 0 },
  },
  base
);

let ActivitySchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    type: String,
    employeeId: String,
    text: String,
    timestamp: String,
  },
  base
);


let LeaveRequestSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    employeeId: { type: String, index: true },
    leaveType: String,
    startDate: String,
    endDate: String,
    durationDays: Number,
    status: { type: String, default: "Pending" },
    reason: String,
    appliedOn: String,
    decidedOn: { type: String, default: null },

    // Leave cancellation tracking
    cancellationStatus: { type: String, default: null },
    cancellationRequestedOn: { type: String, default: null },
    cancellationDecidedOn: { type: String, default: null },
  },
  base
);

let NotificationSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    type: String,
    category: String,
    title: String,
    description: String,
    priority: { type: String, default: "low" },
    read: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
    relatedEmployeeId: { type: String, default: null },
    avatar: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
    recipientEmployeeId: { type: String, index: true },
  },
  base
);

let NotificationPreferenceSchema = new Schema(
  {
    employeeId: { type: String, unique: true, index: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    attendanceAlerts: { type: Boolean, default: true },
    leaveAlerts: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: false },
  },
  base
);

let ChannelSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    name: String,
    memberIds: [String],
    // Default channels (e.g. "General") auto-enroll every newly created
    // employee — see data/messagesStore.js#addEmployeeToDefaultChannels.
    isDefault: { type: Boolean, default: false },
    createdBy: String,
  },
  base
);

let DirectConversationSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    participantIds: [String],
  },
  base
);


let MessageSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    conversationId: { type: String, index: true },
    senderId: String,
    content: String,
    createdAt: { type: String, default: () => new Date().toISOString() },
    attachments: [{ type: { type: String }, name: String, note: String, label: String }],
    deletedFor: { type: [String], default: [] },
    deletedForEveryone: { type: Boolean, default: false },
    deletedForEveryoneAt: { type: String, default: null },
  },
  base
);


let SharedFileSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    conversationId: { type: String, index: true },
    key: { type: String, unique: true },
    name: String,
    contentType: String,
    size: Number,
    kind: String,
    durationSeconds: { type: Number, default: null },
    uploaderId: { type: String, index: true },
    uploaderName: String,
    status: { type: String, default: "pending", index: true },
    deletedFor: { type: [String], default: [] },
    deletedForEveryone: { type: Boolean, default: false },
    deletedForEveryoneAt: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  base
);
SharedFileSchema.index({ conversationId: 1, status: 1, createdAt: -1 });

let ReadStateSchema = new Schema(
  {
    employeeId: { type: String, index: true },
    conversationId: { type: String, index: true },
    lastReadISO: String,
  },
  base
);
ReadStateSchema.index({ employeeId: 1, conversationId: 1 }, { unique: true });

let ReportSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    title: String,
    range: String,
    department: String,
    status: String,
    createdAt: { type: String, default: () => new Date().toISOString() },
    stats: Schema.Types.Mixed,
  },
  base
);

let AnnouncementSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    eyebrow: String,
    title: String,
    body: String,
    ctaLabel: String,
    postedOn: String,
  },
  base
);

let ProjectSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    name: String,
    description: { type: String, default: "" },
    teamMemberIds: [String],
    projectManagerId: { type: String, index: true },
    endDate: String,
    importance: { type: String, default: "Medium" }, // Low | Medium | High
    status: { type: String, default: "Active", index: true }, // Active | Working | Completed | On Hold | Cancelled
    createdBy: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  base
);

let HolidaySchema = new Schema(
  {
    date: String,
    name: String,
    type: String,
  },
  base
);

let ScheduleSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    employeeId: { type: String, index: true },
    type: { type: String, default: "task" }, // task | meeting
    title: String,
    description: { type: String, default: "" },
    date: { type: String, index: true },
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
    location: { type: String, default: "" },
    participantIds: { type: [String], default: [] },
    projectId: { type: String, default: null, index: true },
    status: { type: String, default: "scheduled" }, // scheduled | completed | cancelled
    createdBy: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  base
);

export let EmployeeModel = model("Employee", EmployeeSchema);
export let UserModel = model("User", UserSchema);
export let PasswordResetTokenModel = model("PasswordResetToken", PasswordResetTokenSchema);
export let RefreshTokenModel = model("RefreshToken", RefreshTokenSchema);
export let AttendanceModel = model("Attendance", AttendanceSchema);
export let ActivityModel = model("Activity", ActivitySchema);
export let LeaveRequestModel = model("LeaveRequest", LeaveRequestSchema);
export let NotificationModel = model("Notification", NotificationSchema);
export let NotificationPreferenceModel = model("NotificationPreference", NotificationPreferenceSchema);
export let ChannelModel = model("Channel", ChannelSchema);
export let DirectConversationModel = model("DirectConversation", DirectConversationSchema);
export let MessageModel = model("Message", MessageSchema);
export let SharedFileModel = model("SharedFile", SharedFileSchema);
export let ReadStateModel = model("ReadState", ReadStateSchema);
export let ReportModel = model("Report", ReportSchema);
export let AnnouncementModel = model("Announcement", AnnouncementSchema);
export let HolidayModel = model("Holiday", HolidaySchema);
export let ProjectModel = model("Project", ProjectSchema);
export let ScheduleModel = model("Schedule", ScheduleSchema);
