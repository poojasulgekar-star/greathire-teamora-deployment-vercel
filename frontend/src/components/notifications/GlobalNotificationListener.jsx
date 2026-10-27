
import { useEffect, useRef, useState } from "react";
import { BellRing, X } from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuth } from "@/lib/AuthContext";

const getId = (item) =>
  item?.id ?? item?._id ?? item?.notificationId ?? null;

const STORAGE_KEY = "gh_teamora_notification_sound";

export default function GlobalNotificationListener() {
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );

  const previousIds = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!user) {
      previousIds.current = null;
      setToast(null);
      return;
    }

    let active = true;

    async function poll() {
      try {
        const response = await notificationsApi.list({
          filter: "all",
          search: "",
        });
        const items = Array.isArray(response) ? response : response?.data || [];

        if (!active) return;

        const currentIds = new Set(
          items.map(getId).filter((id) => id != null).map(String)
        );

        // First poll records existing notifications without showing old popups.
        if (previousIds.current === null) {
          previousIds.current = currentIds;
          return;
        }

        const newItem = items.find((item) => {
          const id = getId(item);
          return id != null && !previousIds.current.has(String(id));
        });

        previousIds.current = currentIds;

        if (newItem) {
          setToast(newItem);

          if (soundEnabledRef.current) {
            try {
              const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

              if (AudioContextClass) {
                const context = new AudioContextClass();

                if (context.state === "running") {
                  const oscillator = context.createOscillator();
                  const gain = context.createGain();

                  oscillator.type = "sine";
                  oscillator.frequency.value = 880;
                  gain.gain.setValueAtTime(0.12, context.currentTime);
                  gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    context.currentTime + 0.25
                  );

                  oscillator.connect(gain);
                  gain.connect(context.destination);
                  oscillator.onended = () => context.close();
                  oscillator.start();
                  oscillator.stop(context.currentTime + 0.25);
                } else {
                  await context.close();
                }
              }
            } catch (error) {
              console.error("Notification sound failed:", error);
            }
          }
        }
      } catch (error) {
        console.error("Global notification polling failed:", error);
      }
    }

    poll();
    const timer = window.setInterval(poll, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user]);

  function enableSound() {
    // Browser audio must be enabled through a user interaction.
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        alert("This browser does not support notification sound.");
        return;
      }

      const context = new AudioContextClass();

      context.resume().then(() => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.frequency.value = 880;
        gain.gain.value = 0.1;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => context.close();
        oscillator.start();
        oscillator.stop(context.currentTime + 0.15);

        localStorage.setItem(STORAGE_KEY, "true");
        soundEnabledRef.current = true;
        setSoundEnabled(true);
      }).catch((error) => {
        console.error("Could not enable notification sound:", error);
      });
    } catch (error) {
      console.error("Could not enable notification sound:", error);
    }
  }

  if (!user) return null;

  return (
    <>
      {toast && (
        <div className="fixed right-6 top-6 z-[200] w-[360px] max-w-[calc(100vw-2rem)]">
          <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <BellRing className="mt-1 h-5 w-5 shrink-0 text-blue-600" />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-blue-600">
                  New Notification
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {toast.title || "New update"}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {toast.description || toast.message || ""}
                </p>
              </div>

              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!soundEnabled && (
        <button
          type="button"
          onClick={enableSound}
          className="fixed right-6 top-6 z-[190] rounded-lg border bg-white px-3 py-2 text-sm shadow-md dark:bg-slate-900"
        >
          Enable Notification Sound
        </button>
      )}
    </>
  );
}
