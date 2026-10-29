import {
  channels,
  directConversations,
  messages,
  getReadStateFor,
  avatarFor,
  persistNewMessage,
  persistReadState,
  persistMessageDeletion,
  persistNewChannel,
  persistChannelMembers,
} from "../data/messagesStore.js";
import { Employee } from "./Employee.js";
import { SharedFile } from "./SharedFile.js";
import { generateId } from "../utils/id.js";
import { CURRENT_EMPLOYEE_ID } from "../data/employees.js";

function isMember(conversation, employeeId) {
  return conversation.memberIds ? conversation.memberIds.includes(employeeId) : conversation.participantIds.includes(employeeId);
}

function allConversationsFor(employeeId) {
  let chans = channels.filter((c) => isMember(c, employeeId)).map((c) => ({ ...c, type: "channel", label: c.name }));
  let dms = directConversations
    .filter((c) => isMember(c, employeeId))
    .map((c) => {
      let otherId = c.participantIds.find((id) => id !== employeeId);
      let other = Employee.getById(otherId);
      return { ...c, type: "dm", label: other?.name || "Unknown", otherEmployeeId: otherId };
    });
  return [...chans, ...dms];
}

function conversationMessages(conversationId) {
  return messages
    .filter((m) => m.conversationId === conversationId)
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function toMessageDto(m, employeeId = CURRENT_EMPLOYEE_ID) {
  const sender =
    m.senderId === "system" ? null : Employee.getById(m.senderId);

  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderName: sender?.name || "System",
    senderAvatar: sender ? avatarFor(m.senderId) : null,
    content: m.content,
    attachments: m.attachments || [],
    deletedFor: m.deletedFor || [],
    deletedForEveryone: m.deletedForEveryone || false,
    createdAt: m.createdAt,
    time: timeLabel(m.createdAt),
    isOwn: m.senderId === employeeId,
  };
}

export let Message = {
  /** GET /api/messages/conversations — channels + DMs, sidebar shape. */
  listConversations(employeeId = CURRENT_EMPLOYEE_ID) {
    let read = getReadStateFor(employeeId);
    return allConversationsFor(employeeId).map((c) => {
      let all = conversationMessages(c.id);
      let last = all[all.length - 1];
      let lastReadISO = read[c.id];
      let unread = all.filter((m) => m.senderId !== employeeId && (!lastReadISO || new Date(m.createdAt) > new Date(lastReadISO))).length;

      return {
        id: c.id,
        type: c.type,
        label: c.label,
        avatar: c.type === "dm" ? avatarFor(c.otherEmployeeId) : null,
        lastMessage: last ? last.content : null,
        lastMessageAt: last ? last.createdAt : null,
        unread,
      };
    });
  },

  /** GET /api/messages/conversations/:id — header info + activity + shared files/links. */
  async getConversation(conversationId, employeeId = CURRENT_EMPLOYEE_ID) {
    let conversation = allConversationsFor(employeeId).find((c) => c.id === conversationId);
    if (!conversation) return null;

    let all = conversationMessages(conversationId);
    let uploadedFiles = await SharedFile.listForConversation(conversationId,employeeId);
    let sharedFiles = [
      ...uploadedFiles.map((file) => ({
        id: file.id,
        name: file.name,
        contentType: file.contentType,
        size: file.size,
        kind: file.kind,
        createdAt: file.createdAt,
        uploaderName: file.uploaderName,
      })),
      ...all.flatMap((m) => (m.attachments || []).filter((a) => a.type === "file").map((a) => ({ ...a, from: m.senderId, at: m.createdAt }))),
    ];
    let sharedLinks = all.flatMap((m) => (m.attachments || []).filter((a) => a.type === "link").map((a) => ({ ...a, from: m.senderId, at: m.createdAt })));

    let contact = null;
    if (conversation.type === "dm") {
      let other = Employee.getById(conversation.otherEmployeeId);
      contact = { id: other.id, name: other.name, role: other.role, avatar: avatarFor(other.id), status: "Active now" };
    }

    return {
      id: conversation.id,
      type: conversation.type,
      label: conversation.label,
      contact,
      sharedFiles,
      sharedLinks,
    };
  },

  hasConversationAccess(conversationId, employeeId) {
    return allConversationsFor(employeeId).some((conversation) => conversation.id === conversationId);
  },

  /** GET /api/messages/conversations/:id/messages — paginated from the newest
   * message backwards (page 1 = most recent window), each page itself kept in
   * chronological order so it renders top-to-bottom like a normal chat log. */
  listMessages(conversationId, employeeId = CURRENT_EMPLOYEE_ID, { page = 1, pageSize = 100 } = {}) {
    let conversation = allConversationsFor(employeeId).find((c) => c.id === conversationId);
    if (!conversation) return null;

    let all = conversationMessages(conversationId).filter((m) =>!(m.deletedFor || []).includes(employeeId) && !m.deletedForEveryone );
    let total = all.length;
    let totalPages = Math.max(1, Math.ceil(total / pageSize));
    let end = total - (page - 1) * pageSize;
    let start = Math.max(0, end - pageSize);
    let data = all.slice(Math.max(0, start), Math.max(0, end)).map((message) => toMessageDto(message, employeeId));
    return { data, page, pageSize, total, totalPages };
  },

  /** POST /api/messages/conversations/:id/messages */
  async sendMessage(conversationId, { content, attachments = [] }, employeeId = CURRENT_EMPLOYEE_ID) {
    let conversation = allConversationsFor(employeeId).find((c) => c.id === conversationId);
    if (!conversation) return null;

    let message = {
      id: generateId("msg"),
      conversationId,
      senderId: employeeId,
      content,
      attachments,
      createdAt: new Date().toISOString(),
    };
    await persistNewMessage(message);

    let read = getReadStateFor(employeeId);
    read[conversationId] = message.createdAt;
    await persistReadState(employeeId, conversationId, message.createdAt);

    return toMessageDto(message);
  },
 /** Delete a message only for the current employee. */
  async deleteForMe(conversationId, messageId, employeeId = CURRENT_EMPLOYEE_ID) {
    let conversation = allConversationsFor(employeeId).find(
      (c) => c.id === conversationId
    );
    if (!conversation) return null;

    let message = messages.find(
      (m) => m.id === messageId && m.conversationId === conversationId
    );
    if (!message) return null;

    let deletedFor = message.deletedFor || [];
    if (!deletedFor.includes(employeeId)) {
      deletedFor = [...deletedFor, employeeId];
    }

    return persistMessageDeletion(messageId, { deletedFor });
  },

  /** Delete a message for everyone; only its sender can do this. */
  async deleteForEveryone(conversationId, messageId, employeeId = CURRENT_EMPLOYEE_ID) {
    let conversation = allConversationsFor(employeeId).find(
      (c) => c.id === conversationId
    );
    if (!conversation) return null;

    let message = messages.find(
      (m) => m.id === messageId && m.conversationId === conversationId
    );
    if (!message) return null;

    if (message.senderId !== employeeId) {
      let error = new Error("Only the sender can delete this message for everyone");
      error.status = 403;
      throw error;
    }

    return persistMessageDeletion(messageId, {
      deletedForEveryone: true,
      deletedForEveryoneAt: new Date().toISOString(),
      content: "",
      attachments: [],
    });
  },
/** POST /api/messages/conversations/:id/read */
  async markConversationRead(conversationId, employeeId = CURRENT_EMPLOYEE_ID) {
    let read = getReadStateFor(employeeId);
    let lastReadISO = new Date().toISOString();
    read[conversationId] = lastReadISO;
    await persistReadState(employeeId, conversationId, lastReadISO);
    return { conversationId, readAt: lastReadISO };
  },

  /** GET /api/messages/channels — admin-only directory of EVERY channel
   * (not just ones the caller happens to be a member of), for the
   * channel-management UI's create/membership controls. */
  listAllChannels() {
    return channels.map((c) => ({
      id: c.id,
      name: c.name,
      isDefault: !!c.isDefault,
      memberIds: c.memberIds,
      memberCount: c.memberIds.length,
    }));
  },

  /** POST /api/messages/channels — admin-only. The creator is always
   * included as a member so they land in a channel they just made. */
  async createChannel({ name, memberIds = [], isDefault = false }, creatorId) {
    let allMembers = Array.from(new Set([...memberIds, creatorId].filter(Boolean)));
    let channel = { id: generateId("chan"), name, memberIds: allMembers, isDefault, createdBy: creatorId };
    await persistNewChannel(channel);
    return channel;
  },

  /** POST /api/messages/channels/:id/members — admin-only, grant one
   * employee access to a channel. */
  async addChannelMember(channelId, employeeId) {
    let channel = channels.find((c) => c.id === channelId);
    if (!channel) return null;
    if (!channel.memberIds.includes(employeeId)) {
      await persistChannelMembers(channelId, [...channel.memberIds, employeeId]);
    }
    return channel;
  },

  /** DELETE /api/messages/channels/:id/members/:employeeId — admin-only,
   * revoke one employee's access to a channel. */
  async removeChannelMember(channelId, employeeId) {
    let channel = channels.find((c) => c.id === channelId);
    if (!channel) return null;
    await persistChannelMembers(channelId, channel.memberIds.filter((id) => id !== employeeId));
    return channel;
  },
};
