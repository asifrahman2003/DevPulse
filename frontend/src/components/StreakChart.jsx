import React, { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { getAllLogs } from "../utils/storage";
import { subDays } from "date-fns";
import { Tooltip } from "react-tooltip";
import { Flame } from "lucide-react";

export default function StreakChart() {
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    const logs = getAllLogs();

    if (logs && typeof logs === "object") {
      const data = Object.entries(logs)
        .filter(([date]) => !isNaN(new Date(date))) // Only valid dates
        .map(([date, sessions]) => ({
          date,
          count: Array.isArray(sessions)
            ? sessions.reduce((a, b) => a + b, 0)
            : 0,
        }));
      setHeatmapData(data);
    }
  }, []);

  return (
    <div
      className="mt-10 w-full max-w-2xl mx-auto mb-6 
        panel-card rounded-2xl p-5 
        hover:shadow-[0_0_0_2px_var(--chrono-primary)] 
        hover:shadow-[0_0_12px_2px_var(--chrono-primary)] 
        transition duration-300 text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-4 text-[var(--chrono-secondary)]">
        <Flame size={17} />
        <h3 className="section-title">Development Streak Calendar</h3>
      </div>

      <div className="overflow-x-auto flex justify-center">
        <CalendarHeatmap
          startDate={subDays(new Date(), 180)}
          endDate={new Date()}
          values={heatmapData}
          showWeekdayLabels
          className="react-heatmap"
          classForValue={(value) => {
            if (!value || !value.count) return "color-empty";
            if (value.count < 30) return "color-scale-1";
            if (value.count < 60) return "color-scale-2";
            if (value.count < 90) return "color-scale-3";
            return "color-scale-4";
          }}
          tooltipDataAttrs={(value) =>
            value?.date
              ? {
                  "data-tooltip-id": "heatmap-tooltip",
                  "data-tooltip-content": `${value.date}: ${value.count || 0} minute${
                    value.count === 1 ? "" : "s"
                  } of development`,
                }
              : {
                  "data-tooltip-id": "heatmap-tooltip",
                  "data-tooltip-content": "No data",
                }
          }
        />
      </div>

      <Tooltip id="heatmap-tooltip" />
    </div>
  );
}
