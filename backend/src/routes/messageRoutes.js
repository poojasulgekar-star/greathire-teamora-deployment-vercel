import { Router } from "express";
import { messageController } from "../controllers/messageController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/common.js";
import {
  messageListQuerySchema,
  messageParamsSchema,
  sendMessageSchema,
  createSharedFileUploadSchema,
  sharedFileParamsSchema,
  createChannelSchema,
  channelMemberBodySchema,
  channelMemberParamsSchema,
} from "../validators/messageValidators.js";

let router = Router();

router.use(requireAuth);

// Admin-only channel management (create channels, manage membership).
router.get("/channels", requireRole("admin"), asyncHandler(messageController.listAllChannels));
router.post("/channels", requireRole("admin"), validate(createChannelSchema), asyncHandler(messageController.createChannel));
router.post(
  "/channels/:id/members",
  requireRole("admin"),
  validate(idParamSchema, "params"),
  validate(channelMemberBodySchema),
  asyncHandler(messageController.addChannelMember)
);
router.delete(
  "/channels/:id/members/:employeeId",
  requireRole("admin"),
  validate(channelMemberParamsSchema, "params"),
  asyncHandler(messageController.removeChannelMember)
);

router.get("/conversations", asyncHandler(messageController.listConversations));
router.get("/conversations/:id", validate(idParamSchema, "params"), asyncHandler(messageController.getConversation));
router.post(
  "/conversations/:id/files/uploads",
  validate(idParamSchema, "params"),
  validate(createSharedFileUploadSchema),
  asyncHandler(messageController.createSharedFileUpload)
);
router.post(
  "/conversations/:id/files/:fileId/complete",
  validate(sharedFileParamsSchema, "params"),
  asyncHandler(messageController.completeSharedFileUpload)
);
router.delete(
  "/conversations/:id/files/:fileId",
  validate(sharedFileParamsSchema, "params"),
  asyncHandler(messageController.cancelSharedFileUpload)
);
router.get(
  "/conversations/:id/files/:fileId/download",
  validate(sharedFileParamsSchema, "params"),
  asyncHandler(messageController.getSharedFileDownloadUrl)
);


router.delete(
  "/conversations/:id/files/:fileId/delete-for-me",
  validate(sharedFileParamsSchema, "params"),
  asyncHandler(messageController.deleteSharedFileForMe)
);

router.delete(
  "/conversations/:id/files/:fileId/delete-for-everyone",
  validate(sharedFileParamsSchema, "params"),
  asyncHandler(messageController.deleteSharedFileForEveryone)
);

router.get(
  "/conversations/:id/messages",
  validate(idParamSchema, "params"),
  validate(messageListQuerySchema, "query"),
  asyncHandler(messageController.listMessages)
);

router.delete(
  "/conversations/:id/messages/:messageId/delete-for-me",
  validate(messageParamsSchema, "params"),
  asyncHandler(messageController.deleteMessageForMe)
);

router.delete(
  "/conversations/:id/messages/:messageId/delete-for-everyone",
  validate(messageParamsSchema, "params"),
  asyncHandler(messageController.deleteMessageForEveryone)
);
router.post(
  "/conversations/:id/messages",
  validate(idParamSchema, "params"),
  validate(sendMessageSchema),
  asyncHandler(messageController.sendMessage)
);
router.post("/conversations/:id/read", validate(idParamSchema, "params"), asyncHandler(messageController.markRead));

export default router;
