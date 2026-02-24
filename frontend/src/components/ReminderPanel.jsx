import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import {
  getReminderSettings,
  setReminderSettings,
  shouldTriggerReminder,
  markReminderSent,
} from "../utils/storage";

function notificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export default function ReminderPanel() {
  const [settings, setSettings] = useState(getReminderSettings());
  const [permission, setPermission] = useState(
    notificationSupported() ? Notification.permission : "unsupported"
  );
  const [status, setStatus] = useState("");

  const saveSettings = () => {
    const saved = setReminderSettings(settings);
    setSettings(saved);
    setStatus("Reminder settings saved.");
  };

  const requestPermission = async () => {
    if (!notificationSupported()) {
      setStatus("Notifications are not supported in this browser.");
      return;
    }

    const next = await Notification.requestPermission();
    setPermission(next);
    setStatus(next === "granted" ? "Notification permission granted." : "Notification permission not granted.");
  };

  const sendReminder = useCallback(() => {
    if (!settings.enabled) return;

    if (notificationSupported() && Notification.permission === "granted") {
      new Notification("DevPulse Reminder", {
        body: settings.message,
      });
    }
  }, [settings.enabled, settings.message]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (shouldTriggerReminder(new Date())) {
        sendReminder();
        markReminderSent();
      }
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [sendReminder]);

  return (
    <div className="w-full mx-auto panel-card rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3 text-[var(--chrono-secondary)]">
        <Bell size={17} />
        <h3 className="section-title">Reminder System</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => setSettings(prev => ({ ...prev, enabled: event.target.checked }))}
            className="accent-[var(--chrono-primary)]"
          />
          Enable daily reminder
        </label>

        <label className="text-sm font-semibold text-gray-700">
          Time
          <input
            type="time"
            value={settings.time}
            onChange={(event) => setSettings(prev => ({ ...prev, time: event.target.value }))}
            className="field-input mt-1"
          />
        </label>

        <label className="text-sm font-semibold text-gray-700">
          Message
          <input
            type="text"
            value={settings.message}
            onChange={(event) => setSettings(prev => ({ ...prev, message: event.target.value }))}
            className="field-input mt-1"
            placeholder="Time for your development session"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={saveSettings}
          className="action-btn text-xs"
        >
          <Bell size={14} /> Save Reminder
        </button>

        <button
          onClick={requestPermission}
          className="action-btn-secondary text-xs"
        >
          <BellRing size={14} /> Allow Notifications
        </button>

        <button
          onClick={sendReminder}
          className="action-btn-secondary text-xs"
        >
          Test Reminder
        </button>

        <span className="text-xs text-gray-600">Permission: {permission}</span>
      </div>

      {status && <p className="text-sm text-[var(--chrono-secondary)] mt-3">{status}</p>}
    </div>
  );
}
