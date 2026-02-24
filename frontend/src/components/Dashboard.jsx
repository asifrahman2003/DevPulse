import { useEffect, useState } from "react";
import { getTodayDate } from "../utils/time";
import SessionNotes from "./SessionNotes";
import {
  addSessionEntry,
  calculateStreak,
  clearAllData,
  deleteSession,
  exportLogsAsCSV,
  exportLogsAsJSON,
  exportNotesAsJSON,
  getAllLogs,
  getAllSessions,
  getAnalyticsSummary,
  getDailyGoal,
  getProjectBreakdown,
  getTagBreakdown,
  getTodayTotal,
  getTotalInRange,
  setDailyGoal,
  updateSession,
} from "../utils/storage";
import { motivationalQuotes } from "../utils/quotes";
import { motion } from "framer-motion";
import StreakChart from "./StreakChart";
import BadgesPanel from "./BadgesPanel";
import SessionHistoryPanel from "./SessionHistoryPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import CloudSyncPanel from "./CloudSyncPanel";
import ReminderPanel from "./ReminderPanel";
import {
  Quote,
  Flame,
  CalendarDays,
  CalendarCheck,
  Timer as TimerIcon,
  Target,
  Trash2,
  FileDown,
} from "lucide-react";

import Timer from "./Timer";

const EMPTY_ANALYTICS = {
  totalMinutes: 0,
  activeDays: 0,
  activeDays30: 0,
  goalHitDays30: 0,
  goalHitRate30: 0,
  rolling7Average: 0,
  bestDay: { date: null, minutes: 0 },
  topProject: null,
  topTag: null,
  bestHour: null,
  streakAtRisk: false,
  riskStreakDays: 0,
  currentStreak: 0,
};

export default function Dashboard() {
  const [todayTotal, setTodayTotal] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [streak, setStreak] = useState(0);
  const [dailyGoal, setGoal] = useState(getDailyGoal());
  const [goalMessage, setGoalMessage] = useState("");
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
  const [projectBreakdown, setProjectBreakdown] = useState([]);
  const [tagBreakdown, setTagBreakdown] = useState([]);

  const progressPercent = dailyGoal > 0 ? Math.min((todayTotal / dailyGoal) * 100, 100) : 0;

  const quoteOfTheDay = motivationalQuotes[new Date().getDate() % motivationalQuotes.length];

  const refreshData = () => {
    const date = getTodayDate();
    const logsData = getAllLogs();
    const sessionsData = getAllSessions();
    const currentGoal = getDailyGoal();

    setTodayTotal(getTodayTotal(date));
    setSessions(sessionsData);
    setStreak(calculateStreak(logsData));
    setWeeklyTotal(getTotalInRange(logsData, 7));
    setMonthlyTotal(getTotalInRange(logsData, 30));
    setGoal(currentGoal);
    setAnalytics(getAnalyticsSummary(currentGoal));
    setProjectBreakdown(getProjectBreakdown(30));
    setTagBreakdown(getTagBreakdown(30));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleGoalUpdate = (event) => {
    event.preventDefault();
    const newGoal = parseInt(event.target.goal.value, 10);
    if (!Number.isNaN(newGoal) && newGoal > 0) {
      setDailyGoal(newGoal);
      setGoalMessage("Goal updated!");
      setTimeout(() => setGoalMessage(""), 2000);
      refreshData();
    }
  };

  const handleAddSession = (data) => {
    addSessionEntry(data);
    refreshData();
  };

  const handleUpdateSession = (sessionId, updates) => {
    updateSession(sessionId, updates);
    refreshData();
  };

  const handleDeleteSession = (sessionId) => {
    deleteSession(sessionId);
    refreshData();
  };

  const glow =
    "hover:shadow-[0_0_0_1px_rgba(255,178,44,0.45)] hover:shadow-[0_0_16px_1px_rgba(255,178,44,0.25)] transition duration-300";

  return (
    <div className="w-full max-w-5xl mx-auto mt-10">
      <section id="focus" className="section-anchor">
        <Timer onSessionComplete={refreshData} />
      </section>

      <motion.div
        className={`panel-card rounded-2xl p-5 mb-6 ${glow} mt-6`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2 text-[var(--chrono-secondary)]">
          <Quote size={18} />
          <h3 className="section-title">Daily Quote</h3>
        </div>
        <blockquote className="italic text-[var(--chrono-secondary)] leading-relaxed">
          “{quoteOfTheDay.text}”
          <footer className="mt-2 text-right text-sm text-gray-600">— {quoteOfTheDay.author}</footer>
        </blockquote>
      </motion.div>

      <ReminderPanel />

      <SessionNotes />

      <motion.div
        className={`panel-card rounded-2xl p-5 text-center mb-6 ${glow}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-center items-center gap-2 mb-1">
          <Flame className="text-[var(--chrono-primary)]" />
          <h3 className="text-2xl font-bold text-[var(--chrono-primary)]">
            {streak} day{streak === 1 ? "" : "s"} streak!
          </h3>
        </div>
        <p className="text-sm text-gray-600">Keep the momentum going!</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`panel-card rounded-2xl p-5 ${glow}`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-1">
            <CalendarDays size={16} />
            <span>This Week</span>
          </div>
          <p className="text-xl font-bold text-[var(--chrono-primary)]">{weeklyTotal} mins</p>
        </div>
        <div className={`panel-card rounded-2xl p-5 ${glow}`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-1">
            <CalendarCheck size={16} />
            <span>This Month</span>
          </div>
          <p className="text-xl font-bold text-[var(--chrono-primary)]">{monthlyTotal} mins</p>
        </div>
      </div>

      <div className={`panel-card rounded-2xl p-5 mb-6 ${glow}`}>
        <div className="flex items-center gap-2 text-lg font-medium mb-1">
          <TimerIcon size={18} />
          <span>
            Today: <span className="text-[var(--chrono-primary)]">{todayTotal} minutes</span>
          </span>
        </div>
      </div>

      <div className={`panel-card rounded-2xl p-5 mb-6 ${glow}`}>
        <div className="flex items-center gap-2 text-md font-bold text-gray-600 mb-2">
          <Target size={18} />
          <h3 className="section-title">Daily Goal Progress</h3>
        </div>

        <form onSubmit={handleGoalUpdate} className="mb-4 flex items-center gap-2 text-sm">
          <label htmlFor="goal" className="font-semibold">Set Goal:</label>
          <input
            id="goal"
            name="goal"
            type="number"
            min={1}
            defaultValue={dailyGoal}
            className="field-input max-w-24"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="action-btn ml-1"
          >
            Update
          </motion.button>
          {goalMessage && <span className="text-green-600 text-xs">{goalMessage}</span>}
        </form>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <motion.div
            className="bg-[var(--chrono-primary)] h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <p className="text-sm mt-2 text-gray-600">
          {todayTotal} / {dailyGoal} minutes
        </p>
      </div>

      <section id="analytics" className="section-anchor">
        <AnalyticsPanel analytics={analytics} projects={projectBreakdown} tags={tagBreakdown} />
      </section>

      <StreakChart />

      <section id="sessions" className="section-anchor">
        <SessionHistoryPanel
          sessions={sessions}
          onAddSession={handleAddSession}
          onUpdateSession={handleUpdateSession}
          onDeleteSession={handleDeleteSession}
        />
      </section>

      <BadgesPanel totalMinutes={analytics.totalMinutes} streak={streak} />

      <section id="cloud" className="section-anchor">
        <CloudSyncPanel onDataImported={refreshData} />
      </section>

      <motion.div
        className="mt-8 flex justify-center flex-wrap gap-4 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!window.confirm("This will remove all local data. Continue?")) return;
            clearAllData();
            refreshData();
          }}
          className="action-btn-danger"
        >
          <Trash2 size={16} />
          Clear All Data
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportLogsAsJSON}
          className="action-btn-secondary"
        >
          <FileDown size={16} />
          Export JSON
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportLogsAsCSV}
          className="action-btn-secondary"
        >
          <FileDown size={16} />
          Export CSV
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportNotesAsJSON}
          className="action-btn-secondary"
        >
          <FileDown size={16} />
          Export Notes
        </motion.button>
      </motion.div>
    </div>
  );
}
