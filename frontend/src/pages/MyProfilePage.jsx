import { useAuth } from "@/lib/AuthContext";
import React, { useEffect, useState } from "react";
import { notificationsApi } from "@/lib/api/notifications";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  FileBarChart2,
  Search,
  Bell,
  MessageSquare,
  Grid3x3,
  Pencil,
  Mail,
  Phone,
  User,
  ChevronRight,
  ShieldCheck,
  Gauge,
  FileText,
  Download,
  Clock3,
  Camera,
} from "lucide-react";
import PageLoading from "@/components/routing/PageLoading";
import { employeeProfileApi } from "@/lib/api/employeeProfile";
import { useTheme } from "@/lib/ThemeContext";
import MasterSidebar from "@/components/layout/MasterSidebar";
import ProfileAvatarButton from "@/components/layout/ProfileAvatarButton";

// Backend sends stat labels like "Percent"/"Clock" as plain strings — map to icons client-side.
let ICON_BY_NAME = { Percent: Gauge, Clock: Clock3, CalendarCheck2: CalendarCheck, CalendarX2: FileBarChart2 };

function TopBar() {
  const navigate = useNavigate();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    let active = true;

    const checkNotifications = async () => {
      try {
        const response = await notificationsApi.list({
          filter: "all",
          search: "",
        });

        if (!active) return;

        const items = Array.isArray(response)
          ? response
          : response?.data?.notifications ??
            response?.notifications ??
            response?.data ??
            [];

        if (Array.isArray(items)) {
          setHasUnreadNotifications(
            items.some(
              (item) =>
                item.unread === true ||
                item.isRead === false ||
                item.read === false
            )
          );
        }
      } catch (error) {
        console.error("Failed to check notifications:", error);
      }
    };

    checkNotifications();

    const intervalId = setInterval(checkNotifications, 5000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
      <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-72">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-sm text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 w-full"
        />
      </div>

      <div className="flex items-center gap-5 flex-shrink-0 ml-auto">
        <button
          onClick={() => navigate("/notifications")}
          className="relative text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />

          {hasUnreadNotifications && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        <Link to="/messages">
          <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <MessageSquare className="w-5 h-5" />
          </button>
        </Link>

        <button
          onClick={() => navigate("/dashboard")}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <Grid3x3 className="w-5 h-5" />
        </button>

        <ProfileAvatarButton />
      </div>
    </header>
  );
}


function ProfileHeader({ profile, contact, onEdit, onAvatarChange, savingAvatar }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-500 dark:text-slate-400">
              {profile.avatar ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" /> : profile.name?.[0]}
            </div>
            {onAvatarChange && (
              <label
                title={savingAvatar ? "Saving profile picture" : "Change profile picture"}
                className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ${
                  savingAvatar ? "cursor-wait opacity-70" : "cursor-pointer hover:bg-blue-700"
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={savingAvatar}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) onAvatarChange(file);
                  }}
                />
              </label>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {profile.role} • ID: {profile.id}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
              {contact?.value && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {contact.value}
                </span>
              )}
              {contact?.secondary && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {contact.secondary}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full mt-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {profile.status || "Active"}
            </span>
          </div>
        </div>

        <button onClick={onEdit} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950">
          <Pencil className="w-3.5 h-3.5" />
          Edit Profile
        </button>
      </div>
    </div>
  );
}

function EditProfileForm({ initial, onCancel, onSave, saving }) {
  let [name, setName] = useState(initial.name || "");
  let [email, setEmail] = useState(initial.email || "");
  let [phone, setPhone] = useState(initial.phone || "");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-5">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Profile</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={() => onSave({ name, email, phone })}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button onClick={onCancel} className="text-sm font-medium text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950">
          Cancel
        </button>
      </div>
    </div>
  );
}

function PersonalInfoCard({ personalInfo, className = "" }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-5">
        <User className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {personalInfo.map(({ label, value, secondary }) => (
          <div key={label}>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{value}</p>
            {secondary && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{secondary}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountSettingsCard({ className = "" }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const handleChangePassword = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      navigate("/", { replace: true });
    }
  };
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-5">
        <ShieldCheck className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Settings</h3>
      </div>
      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
        <button
          onClick={handleChangePassword}
          className="flex items-center justify-between py-3 text-left"
        >
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Change Password</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Use "Forgot Password" from the login page</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between py-3 text-left"
        >
          <p className="text-sm font-medium text-slate-900 dark:text-white">Theme</p>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">
            {isDark ? "Dark Mode" : "Light Mode"}
          </span>
        </button>
        <div className="flex items-center justify-between py-3">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Language</p>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">English (US)</span>
        </div>
      </div>
    </div>
  );
}

function WorkSummaryCard({ statCards }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-5">
        <FileBarChart2 className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Work Summary</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon }) => {
          let Icon = ICON_BY_NAME[icon] || Gauge;
          return (
            <div key={label} className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                {label}
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocumentsCard({ documents }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Documents</h3>
      </div>
      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
        {documents.map(({ name, note }) => (
          <div key={name} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{note}</p>
              </div>
            </div>
            <button
              disabled
              title="Document preview is not available in this demo"
              className="text-slate-400 dark:text-slate-500 flex-shrink-0 cursor-not-allowed opacity-60"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

async function compressProfileImage(file) {
  // The profile API stores images as data URLs, so keep uploads small enough for JSON.
  const maxFileSize = 10 * 1024 * 1024;
  const maxDataUrlLength = 90_000;

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > maxFileSize) {
    throw new Error("Please choose an image smaller than 10MB.");
  }

  // Decode the selected file so the browser can resize it before uploading.
  const imageUrl = URL.createObjectURL(file);
  let image;
  try {
    image = await new Promise((resolve, reject) => {
      const loadedImage = new Image();
      loadedImage.onload = () => resolve(loadedImage);
      loadedImage.onerror = () => reject(new Error("Couldn't read this image. Please try another file."));
      loadedImage.src = imageUrl;
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser couldn't process this image.");

  // Try progressively smaller JPEGs until the encoded image fits the API field limit.
  let scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
  for (let attempt = 0; attempt < 12; attempt += 1) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (let quality = 0.85; quality >= 0.45; quality -= 0.1) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= maxDataUrlLength) return dataUrl;
    }

    scale *= 0.8;
  }

  throw new Error("Couldn't reduce this image enough. Please choose a smaller image.");
}

export default function MyProfilePage() {
  let [bundle, setBundle] = useState(null);
  let [editing, setEditing] = useState(false);
  let [saving, setSaving] = useState(false);
  let [savingAvatar, setSavingAvatar] = useState(false);
  let [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    employeeProfileApi.getBundle().then(setBundle).catch((err) => console.error(err));
  }, []);

  if (!bundle) {
    return <PageLoading label="Loading profile…" />;
  }

  let { profile, statCards, documents, personalInfo } = bundle;
  let contact = personalInfo.find((p) => p.label === "Contact");

  async function handleSave(updates) {
    setSaving(true);
    try {
      let refreshedPersonalInfo = await employeeProfileApi.updatePersonalInfo(updates);
      setBundle((prev) => ({ ...prev, personalInfo: refreshedPersonalInfo, profile: { ...prev.profile, name: updates.name || prev.profile.name } }));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(file) {
    setAvatarError("");
    setSavingAvatar(true);
    try {
      let dataUrl = await compressProfileImage(file);
      // Update the profile on the server before showing the new image in the UI.
      await employeeProfileApi.updatePersonalInfo({ avatar: dataUrl });
      setBundle((prev) => ({ ...prev, profile: { ...prev.profile, avatar: dataUrl } }));
    } catch (err) {
      const validationDetails = err.body?.details
        ?.map(({ field, message }) => `${field}: ${message}`)
        .join(" ");
      setAvatarError(validationDetails || err.message || "Couldn't update your photo.");
    } finally {
      setSavingAvatar(false);
    }
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex bg-background dark:bg-slate-950">
      <MasterSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <ProfileHeader
            profile={profile}
            contact={contact}
            onEdit={() => setEditing((v) => !v)}
            onAvatarChange={handleAvatarChange}
            savingAvatar={savingAvatar}
          />
          {savingAvatar && <p className="mb-4 -mt-3 text-sm text-slate-500">Saving profile photo…</p>}
          {avatarError && <p className="mb-4 -mt-3 text-sm text-red-600">{avatarError}</p>}
          {editing && (
            <EditProfileForm
              initial={{ name: profile.name, email: contact?.value, phone: contact?.secondary }}
              onCancel={() => setEditing(false)}
              onSave={handleSave}
              saving={saving}
            />
          )}
          <div className="grid grid-cols-1 gap-5">
            <div className="grid gap-5 lg:grid-cols-[2fr_1fr] lg:items-stretch">
              <PersonalInfoCard className="h-full" personalInfo={personalInfo} />
              <AccountSettingsCard className="h-full" />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <WorkSummaryCard statCards={statCards} />
              <DocumentsCard documents={documents} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
