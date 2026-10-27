import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Building2,
  MessageSquare,
  ListChecks,
  BarChart3,
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  AtSign,
  Send,
  Bold,
  Italic,
  Folder,
  Link2,
  HelpCircle,
  Hash,
  Plus,
  Settings2,
  X,
  Menu,
  Upload,
  Download,
} from "lucide-react";
import { messagesApi } from "@/lib/api/messages";
import { useAuth } from "@/lib/AuthContext";
import ManageChannelModal from "@/components/employee/ManageChannelModal";
import ProfileAvatarButton from "@/components/layout/ProfileAvatarButton";

const navItems = [
  { label: "Organization", icon: Building2, to: "/dashboard" },
  { label: "Messages", icon: MessageSquare, active: true, to: "/messages" },
  { label: "Leaves", icon: ListChecks, to: "/leave" },
  { label: "Analytics", icon: BarChart3, to: "/reports" },
];

function ConversationSidebar({ conversations, activeId, onSelect, isAdmin, onNewChannel, onManageChannel ,onClose}) {
  const navigate = useNavigate();
  const channels = conversations.filter((c) => c.type === "channel");
  const dms = conversations.filter((c) => c.type === "dm");

  return (
<aside className="w-64 h-full max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col justify-between flex-shrink-0">      <div className="min-h-0 overflow-y-auto">
        
<div className="flex items-center gap-3 px-5 py-6">
  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
    <LayoutGrid className="w-5 h-5 text-white" />
  </div>

  <div className="leading-tight">
    <p className="text-white font-semibold text-sm">Teamora</p>
    <p className="text-slate-400 dark:text-slate-500 text-xs">
      Remote Engineering
    </p>
  </div>

  <button
    type="button"
    onClick={onClose}
    className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
    aria-label="Close sidebar"
  >
    <X className="h-5 w-5" />
  </button>
</div>


        <nav className="px-3 flex flex-col gap-1 mb-6">
          {navItems.map(({ label, icon: Icon, active, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                active ? "bg-slate-800 text-white" : "text-slate-400 dark:text-slate-500 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider">CHANNELS</p>
            {isAdmin && (
              <button onClick={onNewChannel} title="New channel" className="text-slate-400 hover:text-white">
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-0.5 mb-6">
            {channels.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeId === c.id ? "bg-slate-800 text-white" : "text-slate-400 dark:text-slate-500 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <button onClick={() => onSelect(c.id)} className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
                  <Hash className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{c.label}</span>
                </button>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {c.unread > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => onManageChannel(c)}
                      title="Manage channel access"
                      className="opacity-0 group-hover:opacity-100 hover:text-white"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-2">DIRECT MESSAGES</p>
          <div className="flex flex-col gap-0.5">
            {dms.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeId === c.id ? "bg-slate-800 text-white" : "text-slate-400 dark:text-slate-500 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <img src={c.avatar} alt={c.label} className="w-5 h-5 rounded-full object-cover" />
                {c.label}
                {c.unread > 0 && (
                  <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-5 pt-3 flex flex-col gap-3 border-t border-slate-800">
        <div className="flex items-center justify-around text-slate-400 dark:text-slate-500">
          <ProfileAvatarButton size="sm" />
          <button onClick={() => navigate("/support")} className="flex items-center gap-1.5 text-xs hover:text-white">
            <HelpCircle className="w-4 h-4" />
            Help
          </button>
        </div>
      </div>
    </aside>
  );
}

function ChatHeader({ conversation, searchOpen, onToggleSearch, searchValue, onSearchChange, onOpenSidebar, }) {
  const isDm = conversation?.type === "dm";
  return (
    <header className="flex flex-col gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
      <div className="flex items-center justify-between gap-2 px-3 py-4 sm:gap-4 sm:px-6">
  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
    <button
      type="button"
      onClick={onOpenSidebar}
      className="md:hidden flex-shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label="Open sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
          {isDm ? (
            <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
              <img src={conversation.contact?.avatar} alt={conversation.label} className="w-full h-full object-cover" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Hash className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              {conversation?.label || "Select a conversation"}
              {isDm && conversation?.contact?.role && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium px-2 py-0.5 rounded-md">
                  {conversation.contact.role}
                </span>
              )}
            </p>
            {isDm && <p className="text-xs text-emerald-500">{conversation.contact?.status}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
          <button disabled title="Calling isn't available in this demo" className="cursor-not-allowed opacity-50">
            <Phone className="w-4.5 h-4.5" />
          </button>
          <button disabled title="Video calling isn't available in this demo" className="cursor-not-allowed opacity-50">
            <Video className="w-4.5 h-4.5" />
          </button>
          <span className="w-px h-5 bg-slate-200" />
          <button onClick={onToggleSearch} className={searchOpen ? "text-blue-600" : "hover:text-slate-700 dark:hover:text-slate-200"}>
            <Search className="w-4.5 h-4.5" />
          </button>
          <button disabled title="No additional actions yet" className="cursor-not-allowed opacity-50">
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="px-6 pb-3">
          <input
            autoFocus
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search in this conversation..."
            className="w-full text-sm bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 outline-none placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
      )}
    </header>
  );
}

function MessageBubble({ message }) {
  return (
<div
  className={`flex items-start gap-3 mb-6 w-full max-w-full sm:max-w-xl ${
    message.isOwn ? "ml-auto flex-row-reverse" : ""
  }`}
>      {message.senderAvatar && (
        <img src={message.senderAvatar} alt={message.senderName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
      )}
      <div>
        <p className={`text-sm mb-1 ${message.isOwn ? "text-right" : ""}`}>
          {message.isOwn ? (
            <>
              <span className="text-xs text-slate-400 dark:text-slate-500 mr-2">{message.time}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{message.senderName}</span>
            </>
          ) : (
            <>
              <span className="font-semibold text-slate-900 dark:text-white">{message.senderName}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">{message.time}</span>
            </>
          )}
        </p>
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            message.isOwn ? "bg-blue-600 text-white rounded-tr-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm"
          }`}
        >
          {message.content}
        </div>
        {(message.attachments || []).length > 0 && (
          <div className="flex flex-col gap-1 mt-2">
            {message.attachments.map((a, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                {a.name || a.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageThread({ messages, filterQuery }) {
  const filtered = filterQuery
    ? messages.filter((m) => m.content?.toLowerCase().includes(filterQuery.toLowerCase()))
    : messages;
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
      {messages.length === 0 ? (
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-10">No messages yet — say hello!</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-10">No messages match "{filterQuery}".</p>
      ) : (
        filtered.map((m) => <MessageBubble key={m.id} message={m} />)
      )}
    </div>
  );
}

const EMOJI_OPTIONS = ["😀", "😂", "👍", "🎉", "❤️", "🙏", "👏", "🔥"];

function MessageInput({ conversationLabel, onSend, onUpload, uploadStatus, uploadError }) {
  const [value, setValue] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  function submit() {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  }

  function wrapSelection(marker) {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || "text";
    const next = value.slice(0, start) + marker + selected + marker + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => el.focus());
  }

  function insertAtCursor(text) {
    const el = inputRef.current;
    const pos = el?.selectionStart ?? value.length;
    const next = value.slice(0, pos) + text + value.slice(pos);
    setValue(next);
    requestAnimationFrame(() => el?.focus());
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
<div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 sm:px-6 sm:py-4 flex-shrink-0">      <div className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5">
  <textarea
          ref={inputRef}
    rows={1}
          placeholder={`Message ${conversationLabel || "..."}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
    onKeyDown={handleKeyDown}
    className="min-h-9 max-h-32 w-full resize-y bg-transparent text-sm outline-none placeholder-slate-400 dark:placeholder-slate-500"
    aria-label={`Message ${conversationLabel || "conversation"}`}
  />
  {(uploadStatus || uploadError) && (
    <div className={`mt-2 rounded-md px-2.5 py-1.5 text-xs ${uploadError ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"}`}>
      {uploadError || uploadStatus}
    </div>
  )}
  <div className="flex items-center justify-between">
    <div className="relative flex items-center gap-3 text-slate-400 dark:text-slate-500">
            <button title="Bold" onClick={() => wrapSelection("**")} className="hover:text-slate-600 dark:hover:text-slate-300">
              <Bold className="w-4 h-4" />
            </button>
            <button title="Italic" onClick={() => wrapSelection("_")} className="hover:text-slate-600 dark:hover:text-slate-300">
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Share files to this conversation"
              aria-label="Share files to this conversation"
              disabled={Boolean(uploadStatus) || !conversationLabel}
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-slate-600 disabled:cursor-wait disabled:opacity-50 dark:hover:text-slate-300"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                onUpload(Array.from(event.target.files || []));
                event.target.value = "";
              }}
            />
            <button title="Emoji" onClick={() => setEmojiOpen((v) => !v)} className="hover:text-slate-600 dark:hover:text-slate-300">
              <Smile className="w-4 h-4" />
            </button>
            <button title="Mention someone" onClick={() => insertAtCursor("@")} className="hover:text-slate-600 dark:hover:text-slate-300">
              <AtSign className="w-4 h-4" />
            </button>
            {emojiOpen && (
              <div className="absolute bottom-6 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 flex gap-1 z-10">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      insertAtCursor(emoji);
                      setEmojiOpen(false);
                    }}
                    className="text-lg hover:scale-110 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={submit} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg">
            Send
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) return "";
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function ProfilePanel({ conversation, onUpload, onDownload, uploadStatus }) {
  const fileInputRef = React.useRef(null);
  if (!conversation) return <aside className="w-72 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 flex-shrink-0" />;
  const isDm = conversation.type === "dm";

  return (
    <aside className="w-72 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-y-auto p-6">
      {isDm && conversation.contact && (
        <div className="flex flex-col items-center text-center mb-6">
          <img src={conversation.contact.avatar} alt={conversation.contact.name} className="w-20 h-20 rounded-full object-cover mb-3" />
          <p className="text-base font-bold text-slate-900 dark:text-white">{conversation.contact.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{conversation.contact.role}</p>
        </div>
      )}

      <div className="mb-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Shared Files
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={Boolean(uploadStatus)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60 dark:text-blue-400 dark:hover:bg-slate-800"
          >
            <Upload className="h-3.5 w-3.5" />
            Add files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              onUpload(Array.from(event.target.files || []));
              event.target.value = "";
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          {(conversation.sharedFiles || []).length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500">No files shared yet.</p>}
          {(conversation.sharedFiles || []).map((f, i) => (
            <div key={f.id || `${f.name}-${i}`} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 text-red-500">
                <Folder className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{f.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {f.size ? `${formatFileSize(f.size)}${f.uploaderName ? ` · ${f.uploaderName}` : ""}` : f.note}
                </p>
              </div>
              {f.id && (
                <button
                  type="button"
                  onClick={() => onDownload(f.id)}
                  title={`Download ${f.name}`}
                  className="ml-auto rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-3">
          <Link2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          Shared Links
        </p>
        <div className="flex flex-col gap-2">
          {(conversation.sharedLinks || []).length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500">No links shared yet.</p>}
          {(conversation.sharedLinks || []).map((l, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Link2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-blue-600 truncate">{l.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{l.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function MessagesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [channelModal, setChannelModal] = useState(null); // null | { mode: "create" } | { mode: "manage", channel }
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");

  function isVideo(file) {
    return file.type.toLowerCase().startsWith("video/") || /\.(mp4|m4v|mov|webm|mkv|avi)$/i.test(file.name);
  }

  function videoContentType(file) {
    if (file.type.toLowerCase().startsWith("video/")) return file.type;
    let extension = file.name.split(".").pop()?.toLowerCase();
    return {
      mov: "video/quicktime",
      webm: "video/webm",
      mkv: "video/x-matroska",
      avi: "video/x-msvideo",
      m4v: "video/x-m4v",
    }[extension] || "video/mp4";
  }

  function getSharedFileError(error, message = error?.message) {
    if (error?.status === 404 && error.message?.startsWith("Route not found:")) {
      return "The backend does not have the shared-file upload route yet. Restart the local backend from the backend folder, or deploy the latest backend changes to Vercel.";
    }
    if (error?.status === 404) {
      return "This conversation or file is no longer available to your account. Refresh the conversation and try again.";
    }
    if (error?.status === 503 && error.message?.includes("File sharing storage is not configured")) {
      return "File sharing storage is not configured on the backend. Add S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY to the backend environment, then restart or redeploy it.";
    }
    return message || "The file operation failed. Please try again.";
  }

  function readVideoDuration(file) {
    return new Promise((resolve, reject) => {
      let video = document.createElement("video");
      let url = URL.createObjectURL(file);
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        let duration = video.duration;
        URL.revokeObjectURL(url);
        if (!Number.isFinite(duration)) {
          reject(new Error(`Could not read the duration of "${file.name}".`));
          return;
        }
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Could not read the video "${file.name}".`));
      };
      video.src = url;
    });
  }

  function uploadToStorage(url, headers, file, onProgress) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          return;
        }
        if (xhr.status === 413) {
          reject(new Error("File upload failed: File exceeds the serverless payload limit (4.5 MB on Vercel). To upload larger files, configure S3 storage."));
          return;
        }
        reject(new Error(`Storage upload failed (${xhr.status}). Check server connection or storage configuration.`));
      };
      xhr.onerror = () => reject(new Error("Storage upload failed. Ensure the backend server is reachable, or check if the file exceeds the server upload limit."));
      xhr.onabort = () => reject(new Error("Upload was cancelled."));
      xhr.send(file);
    });
  }

  async function handleUploadFiles(files) {
    if (!activeId || files.length === 0) return;
    setUploadError("");
    setUploadStatus("Checking selected files…");

    for (let index = 0; index < files.length; index += 1) {
      let file = files[index];
      let video = isVideo(file);
      if (file.size > 2 * 1024 * 1024 * 1024) {
        setUploadError(`"${file.name}" is larger than the 2 GB file limit.`);
        setUploadStatus("");
        return;
      }
      if (video && file.size > 16 * 1024 * 1024) {
        setUploadError(`"${file.name}" is a video larger than the 16 MB video limit.`);
        setUploadStatus("");
        return;
      }

      let fileId;
      try {
        let durationSeconds;
        let contentType = file.type || "application/octet-stream";
        if (video) {
          durationSeconds = await readVideoDuration(file);
          if (durationSeconds > 90) {
            setUploadError(`"${file.name}" is longer than the 90-second video limit.`);
            setUploadStatus("");
            return;
          }
          contentType = videoContentType(file);
        }

        setUploadStatus(`Preparing ${index + 1}/${files.length}: ${file.name}`);
        let { file: sharedFile, upload } = await messagesApi.createSharedFileUpload(activeId, {
          name: file.name,
          contentType,
          size: file.size,
          ...(durationSeconds !== undefined ? { durationSeconds } : {}),
        });
        fileId = sharedFile.id;
        await uploadToStorage(upload.url, upload.headers, file, (percent) => {
          setUploadStatus(`Uploading ${index + 1}/${files.length}: ${file.name} (${percent}%)`);
        });
        await messagesApi.completeSharedFileUpload(activeId, sharedFile.id);
        setUploadStatus(`Shared ${index + 1}/${files.length}: ${file.name}`);
        try {
          let details = await messagesApi.getConversation(activeId);
          setConversation(details);
        } catch (refreshError) {
          setUploadError(refreshError.message || "File uploaded but the Shared Files panel could not be refreshed.");
        }
      } catch (error) {
        let message = error.message || `Could not upload "${file.name}".`;
        if (fileId) {
          try {
            await messagesApi.cancelSharedFileUpload(activeId, fileId);
          } catch (cleanupError) {
            message += ` Cleanup failed: ${cleanupError.message}`;
          }
        }
        setUploadError(getSharedFileError(error, message));
        setUploadStatus("");
        return;
      }
    }

    window.setTimeout(() => setUploadStatus(""), 3000);
  }

  async function handleDownloadFile(fileId) {
    setUploadError("");
    try {
      let { url } = await messagesApi.getSharedFileDownloadUrl(activeId, fileId);
      window.location.assign(url);
    } catch (error) {
      setUploadError(getSharedFileError(error));
    }
  }

  function refreshConversations() {
    messagesApi.listConversations().then((list) => {
      setConversations(list);
      if (list.length && !activeId) setActiveId(list[0].id);
    });
  }

  useEffect(() => {
    refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleManageChannel(sidebarChannel) {
    let all = await messagesApi.listAllChannels();
    let full = all.find((c) => c.id === sidebarChannel.id) || sidebarChannel;
    setChannelModal({ mode: "manage", channel: full });
  }

  function handleChannelModalChanged() {
    setChannelModal(null);
    refreshConversations();
  }

  const loadConversation = useCallback(async (id) => {
    if (!id) return;
    let [details, msgs] = await Promise.all([messagesApi.getConversation(id), messagesApi.listMessages(id)]);
    setConversation(details);
    setMessages(msgs);
    await messagesApi.markRead(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }, []);

  useEffect(() => {
    loadConversation(activeId);
    setSearchOpen(false);
    setSearchValue("");
  }, [activeId, loadConversation]);

  async function handleSend(content, attachments) {
    if (!activeId) return;
    let message = await messagesApi.sendMessage(activeId, content, attachments);
    setMessages((prev) => [...prev, message]);
  }

  return (
    
<div className="relative w-full h-[100dvh] overflow-hidden flex bg-slate-50 dark:bg-slate-950">

      
{/* Mobile Sidebar */}
<div
  className={`fixed inset-0 z-40 md:hidden ${
    sidebarOpen ? "" : "pointer-events-none invisible"
  }`}
>
  <div
    className={`absolute inset-0 bg-black/50 ${
      sidebarOpen ? "opacity-100" : "opacity-0"
    }`}
    onClick={() => setSidebarOpen(false)}
  />

  <div
    className={`absolute inset-y-0 left-0 transition-transform duration-300 ${
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <ConversationSidebar
      conversations={conversations}
      activeId={activeId}
      onSelect={(id) => {
        setActiveId(id);
        setSidebarOpen(false);
      }}
      isAdmin={isAdmin}
      onNewChannel={() => {
        setChannelModal({ mode: "create" });
        setSidebarOpen(false);
      }}
      onManageChannel={handleManageChannel}
      onClose={() => setSidebarOpen(false)}
    />
  </div>
</div>

{/* Desktop Sidebar */}
<div className="hidden md:block h-full">
  <ConversationSidebar
    conversations={conversations}
    activeId={activeId}
    onSelect={setActiveId}
    isAdmin={isAdmin}
    onNewChannel={() => setChannelModal({ mode: "create" })}
    onManageChannel={handleManageChannel}
    onClose={() => setSidebarOpen(false)}
  />
</div>

      <div className="flex-1 flex flex-col min-w-0 h-full">
       
<ChatHeader
  conversation={conversation}
  searchOpen={searchOpen}
  onToggleSearch={() => setSearchOpen((v) => !v)}
  searchValue={searchValue}
  onSearchChange={setSearchValue}
  onOpenSidebar={() => setSidebarOpen(true)}
/>

        <MessageThread messages={messages} filterQuery={searchOpen ? searchValue : ""} />
        <MessageInput
          conversationLabel={conversation?.label}
          onSend={handleSend}
          onUpload={handleUploadFiles}
          uploadStatus={uploadStatus}
          uploadError={uploadError}
        />
      </div>
      <div className="hidden xl:block h-full">
  <ProfilePanel
    conversation={conversation}
    onUpload={handleUploadFiles}
    onDownload={handleDownloadFile}
    uploadStatus={uploadStatus}
  />
</div>
      {channelModal && (
        <ManageChannelModal
          channel={channelModal.mode === "manage" ? channelModal.channel : null}
          onClose={() => setChannelModal(null)}
          onChanged={handleChannelModalChanged}
        />
      )}
    </div>
  );
}
