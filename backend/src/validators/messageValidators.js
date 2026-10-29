import { z } from "zod";

export const messageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(100),
});

const attachmentSchema = z.object({
  type: z.enum(["file", "link"]),
  name: z.string().trim().min(1).optional(),
  url: z.string().trim().min(1).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "content is required").max(4000),
  attachments: z.array(attachmentSchema).max(10).optional().default([]),
});

export const createSharedFileUploadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(2 * 1024 * 1024 * 1024),
  durationSeconds: z.number().finite().positive().max(90).optional(),
}).superRefine((file, ctx) => {
  let isVideo = file.contentType.toLowerCase().startsWith("video/") ||
    /\.(mp4|m4v|mov|webm|mkv|avi)$/i.test(file.name);
  if (isVideo && file.size > 16 * 1024 * 1024) {
    ctx.addIssue({
      code: "custom",
      path: ["size"],
      message: "Videos must be 16 MB or smaller.",
    });
  }
  if (isVideo && file.durationSeconds === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["durationSeconds"],
      message: "Video duration is required and must not exceed 90 seconds.",
    });
  }
});

export const sharedFileParamsSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
  fileId: z.string().trim().min(1, "fileId is required"),
});


export const messageParamsSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
  messageId: z.string().trim().min(1, "messageId is required"),
});


export const createChannelSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(80),
  memberIds: z.array(z.string().trim().min(1)).max(500).optional().default([]),
  isDefault: z.boolean().optional().default(false),
});

export const channelMemberBodySchema = z.object({
  employeeId: z.string().trim().min(1, "employeeId is required"),
});

export const channelMemberParamsSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
  employeeId: z.string().trim().min(1, "employeeId is required"),
});
