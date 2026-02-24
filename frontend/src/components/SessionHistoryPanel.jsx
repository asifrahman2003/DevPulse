import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Pencil, Trash2, PlusCircle } from "lucide-react";

function inRange(dateString, filter) {
  if (filter === "all") return true;

  const days = filter === "week" ? 7 : 30;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  const target = new Date(`${dateString}T00:00:00`);

  return !Number.isNaN(target.getTime()) && target >= start && target <= now;
}

function normalizeTags(tagsInput) {
  return tagsInput
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

export default function SessionHistoryPanel({
  sessions,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
}) {
  const [filter, setFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    date: "",
    minutes: 0,
    project: "",
    tags: "",
    mode: "timer",
  });

  const [newForm, setNewForm] = useState({
    date: new Date().toISOString().split("T")[0],
    minutes: 25,
    project: "General",
    tags: "",
    mode: "timer",
  });

  const filteredSessions = useMemo(() => {
    const search = projectFilter.trim().toLowerCase();

    return sessions.filter(session => {
      if (!inRange(session.date, filter)) return false;
      if (!search) return true;
      return session.project.toLowerCase().includes(search);
    });
  }, [sessions, filter, projectFilter]);

  const startEdit = (session) => {
    setEditingId(session.id);
    setEditForm({
      date: session.date,
      minutes: session.minutes,
      project: session.project,
      tags: session.tags.join(", "),
      mode: session.mode,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdateSession(editingId, {
      date: editForm.date,
      minutes: Number(editForm.minutes),
      project: editForm.project,
      tags: normalizeTags(editForm.tags),
      mode: editForm.mode,
    });
    setEditingId(null);
  };

  const submitNewSession = (event) => {
    event.preventDefault();
    onAddSession({
      date: newForm.date,
      minutes: Number(newForm.minutes),
      project: newForm.project,
      tags: normalizeTags(newForm.tags),
      mode: newForm.mode,
    });
  };

  return (
    <div className="w-full mx-auto panel-card rounded-2xl p-5 mb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center gap-2 text-[var(--chrono-secondary)]">
          <ClipboardList size={17} />
          <h3 className="section-title">Session Management</h3>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="field-input max-w-28"
          >
            <option value="all">All</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <input
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            placeholder="Filter by project"
            className="field-input max-w-44"
          />
        </div>
      </div>

      <form onSubmit={submitNewSession} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-5">
        <input
          type="date"
          value={newForm.date}
          onChange={(event) => setNewForm((prev) => ({ ...prev, date: event.target.value }))}
          className="field-input"
          required
        />
        <input
          type="number"
          min={1}
          value={newForm.minutes}
          onChange={(event) => setNewForm((prev) => ({ ...prev, minutes: event.target.value }))}
          className="field-input"
          placeholder="Minutes"
          required
        />
        <input
          type="text"
          value={newForm.project}
          onChange={(event) => setNewForm((prev) => ({ ...prev, project: event.target.value }))}
          className="field-input"
          placeholder="Project"
        />
        <input
          type="text"
          value={newForm.tags}
          onChange={(event) => setNewForm((prev) => ({ ...prev, tags: event.target.value }))}
          className="field-input"
          placeholder="Tags"
        />
        <select
          value={newForm.mode}
          onChange={(event) => setNewForm((prev) => ({ ...prev, mode: event.target.value }))}
          className="field-input"
        >
          <option value="timer">Timer</option>
          <option value="pomodoro">Pomodoro</option>
        </select>
        <button
          type="submit"
          className="action-btn"
        >
          <PlusCircle size={16} />
          Add
        </button>
      </form>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {filteredSessions.length === 0 && (
          <p className="text-sm text-gray-500">No sessions in this range.</p>
        )}

        {filteredSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="panel-soft rounded-xl p-3"
          >
            {editingId === session.id ? (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, date: event.target.value }))}
                  className="field-input"
                />
                <input
                  type="number"
                  min={1}
                  value={editForm.minutes}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, minutes: event.target.value }))}
                  className="field-input"
                />
                <input
                  type="text"
                  value={editForm.project}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, project: event.target.value }))}
                  className="field-input"
                />
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, tags: event.target.value }))}
                  className="field-input"
                />
                <select
                  value={editForm.mode}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, mode: event.target.value }))}
                  className="field-input"
                >
                  <option value="timer">Timer</option>
                  <option value="pomodoro">Pomodoro</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    type="button"
                    className="action-btn-secondary text-xs px-2 py-1"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    type="button"
                    className="action-btn-secondary text-xs px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">{session.date}</span>
                  {" · "}
                  <span>{session.minutes} min</span>
                  {" · "}
                  <span>{session.project}</span>
                  {" · "}
                  <span className="uppercase text-xs font-semibold">{session.mode}</span>
                  {session.tags.length > 0 && (
                    <span>
                      {" · "}
                      {session.tags.join(", ")}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(session)}
                    type="button"
                    className="action-btn-secondary text-xs px-2 py-1"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteSession(session.id)}
                    type="button"
                    className="action-btn-danger text-xs px-2 py-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
