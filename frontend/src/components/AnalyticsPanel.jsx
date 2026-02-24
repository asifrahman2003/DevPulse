import { BarChart3, CalendarClock, Flag, Gauge, AlertTriangle, BriefcaseBusiness, Tag } from "lucide-react";

function formatBestHour(hour) {
  if (hour === null || hour === undefined) return "N/A";
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:00 ${suffix}`;
}

export default function AnalyticsPanel({ analytics, projects, tags }) {
  return (
    <div className="w-full mx-auto panel-card rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4 text-[var(--chrono-secondary)]">
        <BarChart3 size={17} />
        <h3 className="section-title">Smart Analytics</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="panel-soft rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm"><CalendarClock size={15} /> Rolling 7-day average</div>
          <p className="text-xl font-semibold mt-1">{analytics.rolling7Average} min/day</p>
        </div>
        <div className="panel-soft rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm"><Flag size={15} /> Goal hit rate (30d)</div>
          <p className="text-xl font-semibold mt-1">{analytics.goalHitRate30}%</p>
        </div>
        <div className="panel-soft rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm"><Gauge size={15} /> Most productive hour</div>
          <p className="text-xl font-semibold mt-1">{formatBestHour(analytics.bestHour?.hour)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <div className="panel-soft rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2"><BriefcaseBusiness size={15} /> Top projects (30d)</div>
          {projects.length === 0 && <p className="text-sm text-gray-500">No project data yet.</p>}
          {projects.slice(0, 5).map(project => (
            <p key={project.project} className="text-sm">
              <span className="font-medium">{project.project}</span>: {project.minutes} min ({project.sessions} sessions)
            </p>
          ))}
        </div>

        <div className="panel-soft rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2"><Tag size={15} /> Top tags (30d)</div>
          {tags.length === 0 && <p className="text-sm text-gray-500">No tags yet.</p>}
          {tags.slice(0, 5).map(tag => (
            <p key={tag.tag} className="text-sm">
              <span className="font-medium">{tag.tag}</span>: {tag.minutes} min ({tag.sessions} sessions)
            </p>
          ))}
        </div>
      </div>

      <div className="mt-3 panel-soft rounded-xl p-3">
        <p className="text-sm text-gray-700">
          Best day: <span className="font-medium">{analytics.bestDay?.date || "N/A"}</span>
          {analytics.bestDay?.minutes ? ` (${analytics.bestDay.minutes} min)` : ""}
        </p>
        <p className="text-sm text-gray-700">Active days (30d): <span className="font-medium">{analytics.activeDays30}</span></p>
        {analytics.streakAtRisk && (
          <p className="text-sm text-red-700 mt-1 flex items-center gap-1">
            <AlertTriangle size={14} />
            Your {analytics.riskStreakDays}-day streak is at risk today.
          </p>
        )}
      </div>
    </div>
  );
}
