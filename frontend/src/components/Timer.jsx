import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDuration, getTodayDate } from "../utils/time";
import { saveSession } from "../utils/storage";
import { motion, AnimatePresence } from "framer-motion";

function formatCountdown(seconds) {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function parseTags(input) {
  return input
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

export default function Timer({ onSessionComplete }) {
  const [mode, setMode] = useState("timer");

  // Standard timer state
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // Metadata state
  const [project, setProject] = useState("General");
  const [tagsInput, setTagsInput] = useState("");

  // Pomodoro state
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [cycles, setCycles] = useState(4);
  const [phase, setPhase] = useState("work");
  const [currentCycle, setCurrentCycle] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [statusMessage, setStatusMessage] = useState("");

  const tags = useMemo(() => parseTags(tagsInput), [tagsInput]);

  const notifySessionSaved = useCallback(() => {
    if (typeof onSessionComplete === "function") {
      onSessionComplete();
    }
  }, [onSessionComplete]);

  const saveDevelopmentSession = useCallback((durationMs, entryMode = mode) => {
    const created = saveSession(getTodayDate(), durationMs, {
      project,
      tags,
      mode: entryMode,
    });

    if (created) {
      notifySessionSaved();
    }
  }, [mode, notifySessionSaved, project, tags]);

  const resetPomodoroState = () => {
    setPhase("work");
    setCurrentCycle(1);
    setSecondsLeft(Math.max(1, workMinutes) * 60);
  };

  const handleStart = () => {
    setStatusMessage("");
    if (mode === "timer") {
      setIsRunning(true);
      setStartTime(Date.now());
      return;
    }

    setIsRunning(true);
    if (secondsLeft <= 0) {
      setSecondsLeft(Math.max(1, workMinutes) * 60);
      setPhase("work");
      setCurrentCycle(1);
    }
  };

  const handleStop = () => {
    if (mode === "timer") {
      setIsRunning(false);
      saveDevelopmentSession(elapsed, "timer");
      setElapsed(0);
      setStartTime(null);
      return;
    }

    if (phase === "work") {
      const elapsedWorkSeconds = Math.max(0, Math.max(1, workMinutes) * 60 - secondsLeft);
      if (elapsedWorkSeconds > 0) {
        saveDevelopmentSession(elapsedWorkSeconds * 1000, "pomodoro");
      }
    }

    setIsRunning(false);
    resetPomodoroState();
    setStatusMessage("Pomodoro stopped.");
  };

  useEffect(() => {
    if (!isRunning) return;

    if (mode === "timer") {
      const interval = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
      return () => clearInterval(interval);
    }

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (phase === "work") {
            saveDevelopmentSession(Math.max(1, workMinutes) * 60000, "pomodoro");

            if (currentCycle >= Math.max(1, cycles)) {
              setIsRunning(false);
              setStatusMessage("Pomodoro complete. Excellent consistency.");
              setPhase("work");
              setCurrentCycle(1);
              return Math.max(1, workMinutes) * 60;
            }

            setPhase("break");
            setStatusMessage(`Cycle ${currentCycle}/${cycles} done. Break time.`);
            return Math.max(1, breakMinutes) * 60;
          }

          const nextCycle = currentCycle + 1;
          setPhase("work");
          setCurrentCycle(nextCycle);
          setStatusMessage(`Cycle ${nextCycle}/${cycles}. Focus mode.`);
          return Math.max(1, workMinutes) * 60;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isRunning,
    mode,
    startTime,
    phase,
    currentCycle,
    cycles,
    workMinutes,
    breakMinutes,
    saveDevelopmentSession,
  ]);

  useEffect(() => {
    if (mode !== "pomodoro" || isRunning) return;
    setPhase("work");
    setCurrentCycle(1);
    setSecondsLeft(Math.max(1, workMinutes) * 60);
  }, [mode, workMinutes, isRunning]);

  return (
    <motion.div
      className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center px-4 py-10 text-center mt-4 panel-card rounded-2xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-5xl font-bold text-[var(--chrono-secondary)] mb-4 tracking-tight">
        DevPulse
      </h1>

      <p className="text-lg text-[var(--chrono-secondary)] mb-6 max-w-3xl sm:whitespace-nowrap">
        Track your daily development time and build the habit of consistency.
      </p>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 text-left">
        <label className="text-sm font-semibold text-gray-700">
          Mode
          <select
            value={mode}
            onChange={event => setMode(event.target.value)}
            disabled={isRunning}
            className="field-input mt-1"
          >
            <option value="timer">Standard Timer</option>
            <option value="pomodoro">Pomodoro</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-gray-700">
          Project
          <input
            type="text"
            value={project}
            onChange={event => setProject(event.target.value)}
            placeholder="General"
            className="field-input mt-1"
            disabled={isRunning}
          />
        </label>

        <label className="text-sm font-semibold text-gray-700 md:col-span-2">
          Tags (comma-separated)
          <input
            type="text"
            value={tagsInput}
            onChange={event => setTagsInput(event.target.value)}
            placeholder="frontend, react, debugging"
            className="field-input mt-1"
            disabled={isRunning}
          />
        </label>
      </div>

      {mode === "pomodoro" && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
          <label className="text-sm font-semibold text-gray-700">
            Work (minutes)
            <input
              type="number"
              min={1}
              value={workMinutes}
              onChange={event => setWorkMinutes(Math.max(1, Number(event.target.value) || 1))}
              className="field-input mt-1"
              disabled={isRunning}
            />
          </label>

          <label className="text-sm font-semibold text-gray-700">
            Break (minutes)
            <input
              type="number"
              min={1}
              value={breakMinutes}
              onChange={event => setBreakMinutes(Math.max(1, Number(event.target.value) || 1))}
              className="field-input mt-1"
              disabled={isRunning}
            />
          </label>

          <label className="text-sm font-semibold text-gray-700">
            Cycles
            <input
              type="number"
              min={1}
              value={cycles}
              onChange={event => setCycles(Math.max(1, Number(event.target.value) || 1))}
              className="field-input mt-1"
              disabled={isRunning}
            />
          </label>
        </div>
      )}

      <div className="relative mb-8">
        <AnimatePresence>
          {isRunning && (
            <motion.div
              className="absolute inset-0 rounded-full bg-[var(--chrono-primary)] blur-xl opacity-50"
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ scale: 1.6, opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "mirror",
              }}
            />
          )}
        </AnimatePresence>

        <motion.div
          className="relative z-10 text-5xl font-mono text-[var(--chrono-text)]"
          animate={{ scale: isRunning ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {mode === "timer" ? formatDuration(elapsed) : formatCountdown(secondsLeft)}
        </motion.div>

        {mode === "pomodoro" && (
          <p className="mt-2 text-sm text-gray-600">
            {phase === "work" ? "Work" : "Break"} phase, cycle {currentCycle}/{cycles}
          </p>
        )}
      </div>

      <motion.button
        onClick={isRunning ? handleStop : handleStart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`rounded-full px-8 py-3 text-base font-semibold shadow-md transition-colors duration-300 ${
          isRunning
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-[var(--chrono-primary)] hover:bg-[#e69e18] text-[#24180f]"
        }`}
      >
        {isRunning ? "Stop" : mode === "timer" ? "Start Development Session" : "Start Pomodoro"}
      </motion.button>

      {statusMessage && <p className="mt-4 text-sm text-[var(--chrono-secondary)]">{statusMessage}</p>}
    </motion.div>
  );
}
