import { useEffect, useState } from "react";
import { Flame, Rocket, Brain, Hammer, Medal } from "lucide-react";
import BadgeCard from "./BadgeCard";
import { getUnlockedBadges, unlockBadge } from "../utils/storage";

export default function BadgesPanel({ totalMinutes = 0, streak = 0 }) {
  const [unlockedIds, setUnlockedIds] = useState([]);

  useEffect(() => {
    const badgeConditions = [
      { id: "starter", condition: totalMinutes >= 100 },
      { id: "digger", condition: totalMinutes >= 500 },
      { id: "pilot", condition: totalMinutes >= 1000 },
      { id: "deep", condition: totalMinutes >= 2000 },
      { id: "streak3", condition: streak >= 3 },
      { id: "streak7", condition: streak >= 7 },
      { id: "streak14", condition: streak >= 14 },
      { id: "streak30", condition: streak >= 30 },
    ];

    badgeConditions.forEach(badge => {
      if (badge.condition) unlockBadge(badge.id);
    });

    const unlocked = getUnlockedBadges();
    setUnlockedIds(unlocked.map(b => b.id));
  }, [totalMinutes, streak]);

  const badgeData = [
    {
      id: "starter",
      title: "Getting Started",
      description: "Log 100+ minutes total",
      icon: Hammer,
    },
    {
      id: "digger",
      title: "Development Digger",
      description: "Log 500+ minutes total",
      icon: Medal,
    },
    {
      id: "pilot",
      title: "Productive Pilot",
      description: "Log 1000+ minutes total",
      icon: Rocket,
    },
    {
      id: "deep",
      title: "Deep Developer",
      description: "Log 2000+ minutes total",
      icon: Brain,
    },
    {
      id: "streak3",
      title: "Warm-Up Streak",
      description: "3-day streak",
      icon: Flame,
    },
    {
      id: "streak7",
      title: "Focus Flame",
      description: "7-day streak",
      icon: Flame,
    },
    {
      id: "streak14",
      title: "Persistent Fire",
      description: "14-day streak",
      icon: Flame,
    },
    {
      id: "streak30",
      title: "Unbreakable",
      description: "30-day streak",
      icon: Rocket,
    },
  ];

  return (
    <div
      className="w-full mx-auto bg-white rounded-xl shadow-md border border-neutral-200 p-6 mt-8 mb-8 
                 hover:shadow-[0_0_0_2px_var(--chrono-primary)] 
                 hover:shadow-[0_0_12px_2px_var(--chrono-primary)] 
                 transition duration-300"
    >
      <div className="flex items-center justify-center gap-2 mb-4 text-[var(--chrono-secondary)]">
        <Medal size={17} />
        <h3 className="section-title">Achievements</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {badgeData.map((badge, index) => (
          <BadgeCard key={index} {...badge} unlocked={unlockedIds.includes(badge.id)} />
        ))}
      </div>
    </div>
  );
}
