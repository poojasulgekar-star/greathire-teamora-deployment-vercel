import { ChannelModel, DirectConversationModel, MessageModel, ReadStateModel } from "../db/schemas.js";
import { employees } from "./employees.js";

function empIdx(id) {
  return employees.findIndex((e) => e.id === id);
}
function avatarFor(employeeId) {
  let employee = employees.find((item) => item.id === employeeId);
  if (employee?.avatar) return employee.avatar;
  return `https://i.pravatar.cc/64?img=${10 + Math.max(empIdx(employeeId), 0)}`;
}

export let channels = [];
export let directConversations = [];
export let messages = [];

/** { [employeeId]: { [conversationId]: lastReadISO } } */
let readState = {};

export async function loadMessaging() {
  let [channelDocs, dmDocs, messageDocs, readDocs] = await Promise.all([
    ChannelModel.find().lean(),
    DirectConversationModel.find().lean(),
    MessageModel.find().lean(),
    ReadStateModel.find().lean(),
  ]);

  channels.length = 0;
  channels.push(...channelDocs.map(({ _id, ...rest }) => rest));

  directConversations.length = 0;
  directConversations.push(...dmDocs.map(({ _id, ...rest }) => rest));

  messages.length = 0;
  messages.push(...messageDocs.map(({ _id, ...rest }) => rest));

  readState = {};
  readDocs.forEach((doc) => {
    if (!readState[doc.employeeId]) readState[doc.employeeId] = {};
    readState[doc.employeeId][doc.conversationId] = doc.lastReadISO;
  });

  return { channels, directConversations, messages, readState };
}

export function getReadStateFor(employeeId) {
  if (!readState[employeeId]) readState[employeeId] = {};
  return readState[employeeId];
}

export async function persistNewMessage(message) {
  messages.push(message);
  await MessageModel.create(message);
  return message;
}

export async function persistMessageDeletion(messageId, updates) {
  const message = messages.find((m) => m.id === messageId);

  if (!message) {
    return null;
  }

  await MessageModel.updateOne(
    { id: messageId },
    { $set: updates }
  );

  Object.assign(message, updates);

  return message;
}

export async function persistReadState(employeeId, conversationId, lastReadISO) {
  await ReadStateModel.updateOne(
    { employeeId, conversationId },
    { $set: { lastReadISO } },
    { upsert: true }
  );
}

export async function persistNewChannel(channel) {
  channels.push(channel);
  await ChannelModel.create(channel);
  return channel;
}

export async function persistChannelMembers(channelId, memberIds) {
  let channel = channels.find((c) => c.id === channelId);
  if (!channel) return null;
  channel.memberIds = memberIds;
  await ChannelModel.updateOne({ id: channelId }, { $set: { memberIds } });
  return channel;
}

/** Auto-enrolls a newly created employee into every channel marked
 * isDefault (e.g. "General"), so they land with messaging access instead of
 * needing to be added by hand. Called from Employee.create(). */
export async function addEmployeeToDefaultChannels(employeeId) {
  let joined = [];
  for (let channel of channels) {
    if (channel.isDefault && !channel.memberIds.includes(employeeId)) {
      channel.memberIds.push(employeeId);
      await ChannelModel.updateOne({ id: channel.id }, { $set: { memberIds: channel.memberIds } });
      joined.push(channel.id);
    }
  }
  return joined;
}

/** Removes a deleted employee from every channel's member list, mirroring
 * the attendance/leave-history cleanup already done in deleteEmployee(). */
export async function removeEmployeeFromAllChannels(employeeId) {
  for (let channel of channels) {
    if (channel.memberIds.includes(employeeId)) {
      channel.memberIds = channel.memberIds.filter((id) => id !== employeeId);
      await ChannelModel.updateOne({ id: channel.id }, { $set: { memberIds: channel.memberIds } });
    }
  }
}

export { avatarFor };
