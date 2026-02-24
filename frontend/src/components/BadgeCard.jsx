import { createElement } from "react";
import { motion } from "framer-motion";

export default function BadgeCard({ icon, title, description, unlocked }) {
  return (
    <motion.div
      className={`flex items-center gap-4 border rounded-lg px-4 py-3 shadow-sm transition ${
        unlocked
          ? "bg-white border-green-400 hover:shadow-[0_0_12px_2px_rgba(34,197,94,0.5)]"
          : "bg-gray-100 border-gray-300 opacity-60"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="p-2.5 rounded-full bg-gray-200">
        {createElement(icon, {
          size: 28,
          className: unlocked ? "text-green-600" : "text-gray-400",
        })}
      </div>
      <div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </motion.div>
  );
}
