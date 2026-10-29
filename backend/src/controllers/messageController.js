import { Message } from "../models/Message.js";
import { SharedFile } from "../models/SharedFile.js";
import { CURRENT_EMPLOYEE_ID } from "../data/employees.js";
import { ApiError } from "../middleware/errorHandler.js";
import { generateId } from "../utils/id.js";
import {
  createUploadUrl,
  createDownloadUrl,
  deleteStoredObject,
  getStoredObjectMetadata,
} from "../services/objectStorage.js";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
const MAX_VIDEO_SIZE = 16 * 1024 * 1024;
const VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|webm|mkv|avi)$/i;

function sharedFileDto(file) {
  return {
    id: file.id,
    name: file.name,
    contentType: file.contentType,
    size: file.size,
    kind: file.kind,
    durationSeconds: file.durationSeconds,
    createdAt: file.createdAt,
    uploaderName: file.uploaderName,
  };
}

function sanitizeFileName(name) {
  return name
    .replace(/[\\/]/g, "_")
    .split("")
    .filter((character) => {
      let code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim()
    .slice(0, 255);
}

function isVideoFile(name, contentType) {
  return contentType.toLowerCase().startsWith("video/") || VIDEO_EXTENSIONS.test(name);
}

function resolveEmployeeId(req) {
  return req.user?.employeeId || CURRENT_EMPLOYEE_ID;
}

export let messageController = {
  listConversations: (req, res) => {
    res.json({ success: true, data: Message.listConversations(resolveEmployeeId(req)) });
  },

  getConversation: async (req, res) => {
    let data = await Message.getConversation(req.params.id, resolveEmployeeId(req));
    if (!data) throw new ApiError(404, "Conversation not found");
    res.json({ success: true, data });
  },

  listMessages: (req, res) => {
    let { page, pageSize } = req.query;
    let result = Message.listMessages(req.params.id, resolveEmployeeId(req), { page, pageSize });
    if (!result) throw new ApiError(404, "Conversation not found");
    res.json({ success: true, ...result });
  },

  sendMessage: async (req, res) => {
    let { content, attachments } = req.body;
    let data = await Message.sendMessage(req.params.id, { content, attachments }, resolveEmployeeId(req));
    if (!data) throw new ApiError(404, "Conversation not found");
    res.status(201).json({ success: true, data });
  },
  deleteMessageForMe: async (req, res) => {
    let data = await Message.deleteForMe(
      req.params.id,
      req.params.messageId,
      resolveEmployeeId(req)
    );
    if (!data) throw new ApiError(404, "Message not found");
    res.json({ success: true, data });
  },
  deleteMessageForEveryone: async (req, res) => {
    let data = await Message.deleteForEveryone(
      req.params.id,
      req.params.messageId,
      resolveEmployeeId(req)
    );
if (!data) throw new ApiError(404, "Message not found");
    res.json({ success: true, data });
  },
 createSharedFileUpload: async (req, res) => {
    let employeeId = resolveEmployeeId(req);
    let conversationId = req.params.id;
    if (!Message.hasConversationAccess(conversationId, employeeId)) {
      throw new ApiError(404, "Conversation not found");
    }
    let name = sanitizeFileName(req.body.name);
    if (!name) throw new ApiError(400, "File name is invalid.");
    let video = isVideoFile(name, req.body.contentType);
    let maxSizeBytes = video ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
    if (req.body.size > maxSizeBytes) {
      throw new ApiError(400, video ? "Videos must be 16 MB or smaller." : "Files must be 2 GB or smaller.");
    }
    if (video && (req.body.durationSeconds === undefined || req.body.durationSeconds > 90)) {
      throw new ApiError(400, "Videos must be 90 seconds or shorter.");
    }

    let id = generateId("file");
    let file = await SharedFile.createPending({
      id,
      conversationId,
      key: `shared-files/${conversationId}/${id}`,
      name,
      contentType: req.body.contentType,
      size: req.body.size,
      kind: video ? "video" : "file",
      durationSeconds: video ? req.body.durationSeconds : null,
      uploaderId: employeeId,
      uploaderName: req.user.name,
      status: "pending",
    });

    try {
      let upload = await createUploadUrl({
        key: file.key,
        contentType: file.contentType,
        size: file.size,
        req,
      });
      res.status(201).json({
        success: true,
        data: { file: sharedFileDto(file), upload },
      });
    } catch (error) {
      await SharedFile.deletePending(file.id);
      throw error;
    }
  },

  completeSharedFileUpload: async (req, res) => {
    let employeeId = resolveEmployeeId(req);
    let conversationId = req.params.id;
    if (!Message.hasConversationAccess(conversationId, employeeId)) {
      throw new ApiError(404, "Conversation not found");
    }

    let file = await SharedFile.findById(conversationId, req.params.fileId);
    if (!file) throw new ApiError(404, "Shared file not found");
    if (file.uploaderId !== employeeId) throw new ApiError(403, "Only the uploader can complete this upload.");
    if (file.status === "ready") {
      res.json({ success: true, data: sharedFileDto(file) });
      return;
    }

    let storedObject;
    try {
      storedObject = await getStoredObjectMetadata(file.key);
    } catch (error) {
      if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") {
        throw new ApiError(400, "The file has not finished uploading to storage.");
      }
      throw error;
    }
    if (storedObject.ContentLength !== file.size || storedObject.ContentType !== file.contentType) {
      await deleteStoredObject(file.key);
      await SharedFile.deletePending(file.id);
      throw new ApiError(400, "Uploaded file metadata did not match the requested upload.");
    }

    let readyFile = await SharedFile.markReady(file.id);
    if (!readyFile) throw new ApiError(409, "Upload is no longer pending.");

    // Also share as a message in the chat thread
    try {
      await Message.sendMessage(
        conversationId,
        {
          content: `Shared file: ${file.name}`,
          attachments: [{ type: "file", name: file.name, label: file.name, note: file.name }],
        },
        employeeId
      );
    } catch (_) {
      // non-fatal
    }

    res.json({ success: true, data: sharedFileDto(readyFile) });
  },

  getSharedFileDownloadUrl: async (req, res) => {
    let employeeId = resolveEmployeeId(req);
    let conversationId = req.params.id;
    if (!Message.hasConversationAccess(conversationId, employeeId)) {
      throw new ApiError(404, "Conversation not found");
    }

    let file = await SharedFile.findById(conversationId, req.params.fileId);
    if (!file || file.status !== "ready") throw new ApiError(404, "Shared file not found");
    let url = await createDownloadUrl(file.key, file.name, req);
    res.json({ success: true, data: { url } });
  },
  
  deleteSharedFileForMe: async (req, res) => {
    const employeeId = resolveEmployeeId(req);
    const conversationId = req.params.id;

    if (!Message.hasConversationAccess(conversationId, employeeId)) {
      throw new ApiError(404, "Conversation not found");
    }

    const file = await SharedFile.findById(
      conversationId,
      req.params.fileId
    );

    if (
      !file ||
      file.status !== "ready" ||
      file.deletedForEveryone ||
      (file.deletedFor || []).includes(employeeId)
    ) {
      throw new ApiError(404, "Shared file not found");
    }

    const updated = await SharedFile.deleteForMe(
      conversationId,
      req.params.fileId,
      employeeId
    );

    if (!updated) throw new ApiError(404, "Shared file not found");

    res.json({ success: true, data: { id: updated.id } });
  },

  deleteSharedFileForEveryone: async (req, res) => {
    const employeeId = resolveEmployeeId(req);
    const conversationId = req.params.id;

    if (!Message.hasConversationAccess(conversationId, employeeId)) {
      throw new ApiError(404, "Conversation not found");
    }

    const file = await SharedFile.findById(
      conversationId,
      req.params.fileId
    );

    if (!file || file.status !== "ready" || file.deletedForEveryone) {
      throw new ApiError(404, "Shared file not found");
    }

    if (file.uploaderId !== employeeId) {
      throw new ApiError(403, "Only the uploader can delete this file for everyone.");
    }

    const updated = await SharedFile.deleteForEveryone(
      conversationId,
      req.params.fileId
    );

    if (!updated) throw new ApiError(404, "Shared file not found");

    res.json({ success: true, data: { id: updated.id } });
  },
  cancelSharedFileUpload: async (req, res) => {
    let employeeId = resolveEmployeeId(req);
    let conversationId = req.params.id;
    if (!Message.hasConversationAccess(conversationId, employeeId)) {
      throw new ApiError(404, "Conversation not found");
    }

    let file = await SharedFile.findById(conversationId, req.params.fileId);
    if (!file || file.status !== "pending") throw new ApiError(404, "Pending upload not found");
    if (file.uploaderId !== employeeId) throw new ApiError(403, "Only the uploader can cancel this upload.");

    await deleteStoredObject(file.key);
    await SharedFile.deletePendingById(conversationId, file.id);
    res.status(204).end();
  },

  markRead: async (req, res) => {
    let data = await Message.markConversationRead(req.params.id, resolveEmployeeId(req));
    res.json({ success: true, data });
  },

  // Admin-only channel management — create/list channels, add or remove members.
  listAllChannels: (req, res) => {
    res.json({ success: true, data: Message.listAllChannels() });
  },

  createChannel: async (req, res) => {
    let data = await Message.createChannel(req.body, resolveEmployeeId(req));
    res.status(201).json({ success: true, data });
  },

  addChannelMember: async (req, res) => {
    let data = await Message.addChannelMember(req.params.id, req.body.employeeId);
    if (!data) throw new ApiError(404, "Channel not found");
    res.status(201).json({ success: true, data });
  },

  removeChannelMember: async (req, res) => {
    let data = await Message.removeChannelMember(req.params.id, req.params.employeeId);
    if (!data) throw new ApiError(404, "Channel not found");
    res.json({ success: true, data });
  },
};
