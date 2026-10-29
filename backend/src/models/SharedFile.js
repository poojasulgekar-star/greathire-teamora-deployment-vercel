import { SharedFileModel } from "../db/schemas.js";

export const SharedFile = {
  createPending(file) {
    return SharedFileModel.create(file);
  },

  findById(conversationId, id) {
    return SharedFileModel.findOne({ conversationId, id });
  },

 
  listForConversation(conversationId, employeeId) {
    return SharedFileModel.find({
      conversationId,
      status: "ready",
      deletedForEveryone: false,
      deletedFor: { $ne: employeeId },
    })
      .sort({ createdAt: -1 })
      .lean();
  },


  markReady(id) {
    return SharedFileModel.findOneAndUpdate(
      { id, status: "pending" },
      { $set: { status: "ready" } },
      { new: true }
    );
  },

  deletePending(id) {
    return SharedFileModel.deleteOne({ id, status: "pending" });
  },

  deletePendingById(conversationId, id) {
    return SharedFileModel.findOneAndDelete({ conversationId, id, status: "pending" });
  },
  deleteForMe(conversationId, id, employeeId) {
    return SharedFileModel.findOneAndUpdate(
      {
        conversationId,
        id,
        status: "ready",
        deletedForEveryone: false,
      },
      { $addToSet: { deletedFor: employeeId } },
      { new: true }
    );
  },
  deleteForEveryone(conversationId, id) {
    return SharedFileModel.findOneAndUpdate(
      {
        conversationId,
        id,
        status: "ready",
        deletedForEveryone: false,
      },
      {
        $set: {
          deletedForEveryone: true,
          deletedForEveryoneAt: new Date().toISOString(),
        },
      },
      { new: true }
    );
  },

};
