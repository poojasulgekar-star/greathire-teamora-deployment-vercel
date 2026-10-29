import { api } from "../apiClient.js";

export const messagesApi = {
  listConversations: () => api.get("/messages/conversations"),
  getConversation: (id) => api.get(`/messages/conversations/${id}`),
  listMessages: (id) => api.get(`/messages/conversations/${id}/messages`),
  sendMessage: (id, content, attachments) => api.post(`/messages/conversations/${id}/messages`, { content, attachments }),
  deleteMessageForMe: (conversationId, messageId) =>api.delete(`/messages/conversations/${conversationId}/messages/${messageId}/delete-for-me`),
  deleteMessageForEveryone: (conversationId, messageId) =>api.delete(`/messages/conversations/${conversationId}/messages/${messageId}/delete-for-everyone`),
  createSharedFileUpload: (id, file) => api.post(`/messages/conversations/${id}/files/uploads`, file),
  completeSharedFileUpload: (id, fileId) => api.post(`/messages/conversations/${id}/files/${fileId}/complete`, {}),
  cancelSharedFileUpload: (id, fileId) => api.delete(`/messages/conversations/${id}/files/${fileId}`),
  
  deleteSharedFileForMe: (conversationId, fileId) =>
    api.delete(
      `/messages/conversations/${conversationId}/files/${fileId}/delete-for-me`
    ),

  deleteSharedFileForEveryone: (conversationId, fileId) =>
    api.delete(
      `/messages/conversations/${conversationId}/files/${fileId}/delete-for-everyone`
    ),

  getSharedFileDownloadUrl: (id, fileId) => api.get(`/messages/conversations/${id}/files/${fileId}/download`),
  markRead: (id) => api.post(`/messages/conversations/${id}/read`),

  // Admin-only channel management.
  listAllChannels: () => api.get("/messages/channels"),
  createChannel: (name, memberIds, isDefault) => api.post("/messages/channels", { name, memberIds, isDefault }),
  addChannelMember: (channelId, employeeId) => api.post(`/messages/channels/${channelId}/members`, { employeeId }),
  removeChannelMember: (channelId, employeeId) => api.delete(`/messages/channels/${channelId}/members/${employeeId}`),
};
