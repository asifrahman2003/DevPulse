import { getTodayDate } from "./time";

// Legacy keys are intentionally retained to preserve existing user data.
const LEGACY_LOGS_KEY = "codechrono-logs";
const SESSIONS_KEY = "devpulse-sessions-v1";
const GOAL_KEY = "codechrono-daily-goal";
const BADGES_KEY = "codechrono-badges";
const NOTES_KEY = "codechrono-notes";
const REMINDER_KEY = "devpulse-reminder-settings";
const LAST_REMINDER_KEY = "devpulse-last-reminder-date";

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function getLocalDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map(tag => String(tag).trim()).filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeDate(date) {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  return getTodayDate();
}

function normalizeMode(mode) {
  return mode === "pomodoro" ? "pomodoro" : "timer";
}

function normalizeSession(raw, index = 0) {
  const minutesValue = Math.round(Number(raw?.minutes ?? 0));
  const minutes = Number.isFinite(minutesValue) && minutesValue > 0 ? minutesValue : 1;
  const createdAt =
    typeof raw?.createdAt === "string" && !Number.isNaN(Date.parse(raw.createdAt))
      ? raw.createdAt
      : new Date(Date.now() + index).toISOString();
  const updatedAt =
    typeof raw?.updatedAt === "string" && !Number.isNaN(Date.parse(raw.updatedAt))
      ? raw.updatedAt
      : createdAt;

  return {
    id: typeof raw?.id === "string" && raw.id.trim() ? raw.id : generateId(),
    date: normalizeDate(raw?.date),
    minutes,
    project: typeof raw?.project === "string" && raw.project.trim() ? raw.project.trim() : "General",
    tags: normalizeTags(raw?.tags),
    mode: normalizeMode(raw?.mode),
    createdAt,
    updatedAt,
  };
}

function sortSessionsDescending(sessions) {
  return [...sessions].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function toLegacyLogsMap(sessions) {
  return sessions.reduce((acc, session) => {
    if (!acc[session.date]) acc[session.date] = [];
    acc[session.date].push(session.minutes);
    return acc;
  }, {});
}

function persistSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function migrateLegacyLogsIfNeeded() {
  const existing = safeParse(localStorage.getItem(SESSIONS_KEY), null);

  if (Array.isArray(existing)) {
    const normalized = existing.map((session, idx) => normalizeSession(session, idx));
    if (JSON.stringify(existing) !== JSON.stringify(normalized)) {
      persistSessions(normalized);
    }
    return normalized;
  }

  // Handle accidental object-shaped storage by converting to sessions.
  if (existing && typeof existing === "object") {
    const converted = [];
    Object.entries(existing).forEach(([date, minutesArray]) => {
      if (!Array.isArray(minutesArray)) return;
      minutesArray.forEach((minutes, idx) => {
        const numericMinutes = Math.round(Number(minutes));
        if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) return;
        converted.push(
          normalizeSession(
            {
              id: `${date}-converted-${idx}`,
              date,
              minutes: numericMinutes,
              project: "General",
              tags: [],
              mode: "timer",
              createdAt: new Date().toISOString(),
            },
            idx
          )
        );
      });
    });
    persistSessions(converted);
    return converted;
  }

  const legacy = safeParse(localStorage.getItem(LEGACY_LOGS_KEY), {});
  if (!legacy || typeof legacy !== "object") {
    persistSessions([]);
    return [];
  }

  const migrated = [];
  Object.entries(legacy).forEach(([date, sessions]) => {
    if (!Array.isArray(sessions)) return;
    sessions.forEach((minutes, idx) => {
      const numericMinutes = Math.round(Number(minutes));
      if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) return;
      migrated.push(
        normalizeSession(
          {
            id: `${date}-legacy-${idx}`,
            date,
            minutes: numericMinutes,
            project: "General",
            tags: [],
            mode: "timer",
            createdAt: new Date().toISOString(),
          },
          idx
        )
      );
    });
  });

  persistSessions(migrated);
  return migrated;
}

function getSessionsInternal() {
  return migrateLegacyLogsIfNeeded();
}

function normalizeSessionInput(input = {}) {
  return {
    date: normalizeDate(input.date),
    minutes: Math.max(1, Math.round(Number(input.minutes))),
    project: typeof input.project === "string" && input.project.trim() ? input.project.trim() : "General",
    tags: normalizeTags(input.tags),
    mode: normalizeMode(input.mode),
  };
}

function buildDailyTotalsFromLogs(logs) {
  const totals = {};
  Object.entries(logs || {}).forEach(([date, sessions]) => {
    if (!Array.isArray(sessions)) return;
    totals[date] = sessions.reduce((sum, value) => sum + Number(value || 0), 0);
  });
  return totals;
}

function calculateStreakFromDate(logs, startDate) {
  let streak = 0;
  const dateCursor = new Date(startDate);

  while (true) {
    const currentKey = getLocalDateString(dateCursor);
    const sessions = logs[currentKey];
    if (!Array.isArray(sessions) || sessions.length === 0) break;
    streak += 1;
    dateCursor.setDate(dateCursor.getDate() - 1);
  }

  return streak;
}

// Sessions API
export function getAllSessions() {
  return sortSessionsDescending(getSessionsInternal());
}

export function saveSession(date, durationMs, metadata = {}) {
  const minutes = Math.round(Number(durationMs) / 60000);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;

  const next = normalizeSessionInput({
    date,
    minutes,
    project: metadata.project,
    tags: metadata.tags,
    mode: metadata.mode,
  });

  const all = getSessionsInternal();
  const createdAt = new Date().toISOString();
  const entry = {
    id: generateId(),
    ...next,
    createdAt,
    updatedAt: createdAt,
  };
  all.push(entry);
  persistSessions(all);

  // Keep legacy structure current for backwards compatibility with existing exports/tools.
  localStorage.setItem(LEGACY_LOGS_KEY, JSON.stringify(toLegacyLogsMap(all)));

  return entry;
}

export function addSessionEntry(input = {}) {
  const normalized = normalizeSessionInput(input);
  if (!Number.isFinite(normalized.minutes) || normalized.minutes <= 0) return null;

  const all = getSessionsInternal();
  const createdAt = new Date().toISOString();
  const entry = {
    id: generateId(),
    ...normalized,
    createdAt,
    updatedAt: createdAt,
  };

  all.push(entry);
  persistSessions(all);
  localStorage.setItem(LEGACY_LOGS_KEY, JSON.stringify(toLegacyLogsMap(all)));
  return entry;
}

export function updateSession(sessionId, updates = {}) {
  const all = getSessionsInternal();
  let updatedEntry = null;

  const updated = all.map(session => {
    if (session.id !== sessionId) return session;

    const nextMinutes = updates.minutes !== undefined ? Math.round(Number(updates.minutes)) : session.minutes;
    const merged = {
      ...session,
      date: updates.date !== undefined ? normalizeDate(updates.date) : session.date,
      minutes: Number.isFinite(nextMinutes) && nextMinutes > 0 ? nextMinutes : session.minutes,
      project:
        updates.project !== undefined
          ? typeof updates.project === "string" && updates.project.trim()
            ? updates.project.trim()
            : "General"
          : session.project,
      tags: updates.tags !== undefined ? normalizeTags(updates.tags) : session.tags,
      mode: updates.mode !== undefined ? normalizeMode(updates.mode) : session.mode,
      updatedAt: new Date().toISOString(),
    };

    updatedEntry = merged;
    return merged;
  });

  if (!updatedEntry) return null;

  persistSessions(updated);
  localStorage.setItem(LEGACY_LOGS_KEY, JSON.stringify(toLegacyLogsMap(updated)));
  return updatedEntry;
}

export function deleteSession(sessionId) {
  const all = getSessionsInternal();
  const filtered = all.filter(session => session.id !== sessionId);
  const changed = filtered.length !== all.length;

  if (!changed) return false;

  persistSessions(filtered);
  localStorage.setItem(LEGACY_LOGS_KEY, JSON.stringify(toLegacyLogsMap(filtered)));
  return true;
}

// Legacy-compatible logs APIs
export function getAllLogs() {
  const sessions = getSessionsInternal();
  return toLegacyLogsMap(sessions);
}

export function getTodayTotal(date) {
  const logs = getAllLogs();
  const todayLogs = logs[normalizeDate(date)] || [];
  return todayLogs.reduce((a, b) => a + b, 0);
}

export function calculateStreak(logs = getAllLogs()) {
  const today = getLocalDateString(new Date());
  return calculateStreakFromDate(logs, today);
}

// Daily goal management
export function getDailyGoal() {
  const goal = Math.round(Number(localStorage.getItem(GOAL_KEY)));
  return Number.isFinite(goal) && goal > 0 ? goal : 60;
}

export function setDailyGoal(minutes) {
  const normalized = Math.max(1, Math.round(Number(minutes)));
  localStorage.setItem(GOAL_KEY, String(normalized));
}

// Export logs to JSON
export function exportLogsAsJSON() {
  const sessions = getAllSessions();
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    sessions,
    logsByDate: toLegacyLogsMap(sessions),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "devpulse_logs.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Export logs to CSV
export function exportLogsAsCSV() {
  const sessions = getAllSessions();
  const rows = [["Date", "Session ID", "Minutes", "Project", "Tags", "Mode"]];

  sessions.forEach(session => {
    rows.push([
      session.date,
      session.id,
      session.minutes,
      session.project,
      session.tags.join("|"),
      session.mode,
    ]);
  });

  const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "devpulse_logs.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Weekly/Monthly total summary
export function getTotalInRange(logs, daysBack) {
  const source = logs && typeof logs === "object" && !Array.isArray(logs) ? logs : getAllLogs();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysBack - 1));

  return Object.entries(source)
    .filter(([dateStr]) => {
      const logDate = new Date(dateStr);
      if (Number.isNaN(logDate.getTime())) return false;
      return logDate >= start && logDate <= now;
    })
    .reduce((total, [, sessions]) => {
      return total + (Array.isArray(sessions) ? sessions.reduce((a, b) => a + Number(b || 0), 0) : 0);
    }, 0);
}

const DEFAULT_REMINDER_SETTINGS = {
  enabled: false,
  time: "20:00",
  message: "Time for your development session in DevPulse.",
};

// Reminder management
export function getReminderSettings() {
  const stored = safeParse(localStorage.getItem(REMINDER_KEY), null);
  if (!stored || typeof stored !== "object") return { ...DEFAULT_REMINDER_SETTINGS };

  const enabled = Boolean(stored.enabled);
  const time = typeof stored.time === "string" && /^\d{2}:\d{2}$/.test(stored.time) ? stored.time : DEFAULT_REMINDER_SETTINGS.time;
  const message =
    typeof stored.message === "string" && stored.message.trim()
      ? stored.message.trim()
      : DEFAULT_REMINDER_SETTINGS.message;

  return { enabled, time, message };
}

export function setReminderSettings(settings = {}) {
  const current = getReminderSettings();
  const next = {
    enabled: typeof settings.enabled === "boolean" ? settings.enabled : current.enabled,
    time:
      typeof settings.time === "string" && /^\d{2}:\d{2}$/.test(settings.time)
        ? settings.time
        : current.time,
    message:
      typeof settings.message === "string" && settings.message.trim()
        ? settings.message.trim()
        : current.message,
  };
  localStorage.setItem(REMINDER_KEY, JSON.stringify(next));
  return next;
}

export function shouldTriggerReminder(now = new Date()) {
  const settings = getReminderSettings();
  if (!settings.enabled) return false;

  const timeNow = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  if (timeNow !== settings.time) return false;

  const today = getLocalDateString(now);
  return localStorage.getItem(LAST_REMINDER_KEY) !== today;
}

export function markReminderSent(date = getLocalDateString(new Date())) {
  localStorage.setItem(LAST_REMINDER_KEY, date);
}

// Analytics helpers
export function getProjectBreakdown(daysBack = 30) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysBack - 1));

  const aggregate = {};
  getAllSessions().forEach(session => {
    const sessionDate = new Date(session.date);
    if (Number.isNaN(sessionDate.getTime()) || sessionDate < start || sessionDate > now) return;

    if (!aggregate[session.project]) {
      aggregate[session.project] = { project: session.project, minutes: 0, sessions: 0 };
    }
    aggregate[session.project].minutes += session.minutes;
    aggregate[session.project].sessions += 1;
  });

  return Object.values(aggregate).sort((a, b) => b.minutes - a.minutes);
}

export function getTagBreakdown(daysBack = 30) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysBack - 1));
  const aggregate = {};

  getAllSessions().forEach(session => {
    const sessionDate = new Date(session.date);
    if (Number.isNaN(sessionDate.getTime()) || sessionDate < start || sessionDate > now) return;

    session.tags.forEach(tag => {
      if (!aggregate[tag]) aggregate[tag] = { tag, minutes: 0, sessions: 0 };
      aggregate[tag].minutes += session.minutes;
      aggregate[tag].sessions += 1;
    });
  });

  return Object.values(aggregate).sort((a, b) => b.minutes - a.minutes);
}

export function getAnalyticsSummary(goal = getDailyGoal()) {
  const sessions = getAllSessions();
  const logs = getAllLogs();
  const dailyTotals = buildDailyTotalsFromLogs(logs);

  const totalMinutes = sessions.reduce((sum, session) => sum + session.minutes, 0);
  const activeDays = Object.keys(dailyTotals).length;

  const now = new Date();
  const last30Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

  let activeDays30 = 0;
  let goalHitDays30 = 0;

  Object.entries(dailyTotals).forEach(([date, total]) => {
    const day = new Date(date);
    if (Number.isNaN(day.getTime()) || day < last30Start || day > now) return;
    if (total > 0) activeDays30 += 1;
    if (total >= goal) goalHitDays30 += 1;
  });

  const rolling7Average = Math.round((getTotalInRange(logs, 7) / 7) * 10) / 10;

  const bestDay = Object.entries(dailyTotals).reduce(
    (best, [date, total]) => (total > best.minutes ? { date, minutes: total } : best),
    { date: null, minutes: 0 }
  );

  const projectBreakdown = getProjectBreakdown(30);
  const tagBreakdown = getTagBreakdown(30);

  const hourAggregate = {};
  sessions.forEach(session => {
    const dateObj = new Date(session.createdAt);
    if (Number.isNaN(dateObj.getTime())) return;
    const hour = dateObj.getHours();
    hourAggregate[hour] = (hourAggregate[hour] || 0) + session.minutes;
  });

  const bestHourEntry = Object.entries(hourAggregate).sort((a, b) => b[1] - a[1])[0] || null;
  const bestHour = bestHourEntry
    ? { hour: Number(bestHourEntry[0]), minutes: bestHourEntry[1] }
    : null;

  const today = getLocalDateString(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalDateString(yesterdayDate);

  const hasTodaySession = Array.isArray(logs[today]) && logs[today].length > 0;
  const streakAtRisk = !hasTodaySession && Array.isArray(logs[yesterday]) && logs[yesterday].length > 0;
  const riskStreakDays = streakAtRisk ? calculateStreakFromDate(logs, yesterday) : 0;

  return {
    totalMinutes,
    activeDays,
    activeDays30,
    goalHitDays30,
    goalHitRate30: Math.round((goalHitDays30 / 30) * 100),
    rolling7Average,
    bestDay,
    topProject: projectBreakdown[0] || null,
    topTag: tagBreakdown[0] || null,
    bestHour,
    streakAtRisk,
    riskStreakDays,
    currentStreak: calculateStreak(logs),
  };
}

// Badge management
export function unlockBadge(id) {
  const current = getUnlockedBadges();
  if (!current.some(badge => badge.id === id)) {
    current.push({ id, unlockedAt: new Date().toISOString() });
    localStorage.setItem(BADGES_KEY, JSON.stringify(current));
  }
}

export function getUnlockedBadges() {
  return safeParse(localStorage.getItem(BADGES_KEY), []);
}

// Notes management
export function saveNoteForToday(note) {
  const today = getTodayDate();
  const notes = safeParse(localStorage.getItem(NOTES_KEY), {});
  notes[today] = note;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function getNoteForToday() {
  const today = getTodayDate();
  const notes = safeParse(localStorage.getItem(NOTES_KEY), {});
  return notes[today] || "";
}

export function clearNoteForToday() {
  const today = getTodayDate();
  const notes = safeParse(localStorage.getItem(NOTES_KEY), {});
  delete notes[today];
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function exportNotesAsJSON() {
  const notes = getAllNotes();
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "devpulse_notes.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function getAllNotes() {
  return safeParse(localStorage.getItem(NOTES_KEY), {});
}

// Cloud payload management
export function getCloudPayload() {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    sessions: getAllSessions(),
    notes: getAllNotes(),
    badges: getUnlockedBadges(),
    dailyGoal: getDailyGoal(),
    reminderSettings: getReminderSettings(),
  };
}

export function importCloudPayload(payload, options = {}) {
  const merge = options.merge !== false;

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload.");
  }

  const incomingSessions = Array.isArray(payload.sessions)
    ? payload.sessions.map((session, idx) => normalizeSession(session, idx))
    : [];

  const existingSessions = getSessionsInternal();
  let nextSessions = [];

  if (merge) {
    const byId = new Map();
    existingSessions.forEach(session => byId.set(session.id, session));

    incomingSessions.forEach(session => {
      const current = byId.get(session.id);
      if (!current) {
        byId.set(session.id, session);
        return;
      }

      const currentTime = new Date(current.updatedAt).getTime();
      const incomingTime = new Date(session.updatedAt).getTime();
      byId.set(session.id, incomingTime >= currentTime ? session : current);
    });

    nextSessions = [...byId.values()];
  } else {
    nextSessions = incomingSessions;
  }

  persistSessions(nextSessions);
  localStorage.setItem(LEGACY_LOGS_KEY, JSON.stringify(toLegacyLogsMap(nextSessions)));

  const existingNotes = getAllNotes();
  const incomingNotes = payload.notes && typeof payload.notes === "object" ? payload.notes : {};
  const mergedNotes = merge ? { ...existingNotes, ...incomingNotes } : incomingNotes;
  localStorage.setItem(NOTES_KEY, JSON.stringify(mergedNotes));

  const existingBadges = getUnlockedBadges();
  const incomingBadges = Array.isArray(payload.badges) ? payload.badges : [];
  const mergedBadges = merge
    ? [...existingBadges, ...incomingBadges].reduce((acc, badge) => {
        if (!badge?.id) return acc;
        if (!acc.some(entry => entry.id === badge.id)) {
          acc.push({ id: badge.id, unlockedAt: badge.unlockedAt || new Date().toISOString() });
        }
        return acc;
      }, [])
    : incomingBadges;
  localStorage.setItem(BADGES_KEY, JSON.stringify(mergedBadges));

  if (Number.isFinite(Number(payload.dailyGoal)) && Number(payload.dailyGoal) > 0) {
    setDailyGoal(payload.dailyGoal);
  }

  if (payload.reminderSettings && typeof payload.reminderSettings === "object") {
    setReminderSettings(payload.reminderSettings);
  }

  return {
    sessionsImported: incomingSessions.length,
    totalSessions: nextSessions.length,
    notesImported: Object.keys(incomingNotes).length,
  };
}

// Global app reset
export function clearAllData() {
  localStorage.removeItem(LEGACY_LOGS_KEY);
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(GOAL_KEY);
  localStorage.removeItem(BADGES_KEY);
  localStorage.removeItem(NOTES_KEY);
  localStorage.removeItem(REMINDER_KEY);
  localStorage.removeItem(LAST_REMINDER_KEY);
}
