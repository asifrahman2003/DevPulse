import { createElement } from "react";
import { motion } from "framer-motion";
import { Info, Github, Linkedin, Globe } from "lucide-react";

export default function AboutSection() {
  const iconLinks = [
    {
      icon: Globe,
      href: "https://www.iamasiff.com",
      label: "Website",
    },
    {
      icon: Github,
      href: "https://github.com/asifrahman2003",
      label: "GitHub",
    },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/in/iamasiff",
      label: "LinkedIn",
    },
  ];

  return (
    <motion.div
      className="w-full max-w-5xl mx-auto px-4 bg-[#fdf9f3] rounded-xl shadow-md p-5 border border-neutral-200 mb-6 text-center mt-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-center items-center gap-2 mb-2 text-[var(--chrono-primary)] mt-2">
        <Info size={18} />
        <h3 className="section-title">About DevPulse</h3>
      </div>

      <p className="text-sm leading-relaxed text-gray-700 px-4">
  <strong>DevPulse</strong> is your personal development time logger that helps you build habits,
  visualize progress, and stay motivated on your development journey. Whether you're grinding LeetCode, learning a new
  tech stack, or building consistently, DevPulse tracks your daily development minutes, unlocks badges,
  and celebrates streaks, because we strongly <strong>consistency builds mastery</strong>.
  <br /><br />
  Your progress is currently saved privately in your browser using <strong>localStorage</strong>, so your data stays safe
  on your device and loads instantly, <br /><strong>no login is required</strong>. In the future, we plan to add
  <strong> user accounts</strong>, so your data can sync across devices seamlessly.
  <br /><br />
  Thank you for using <strong>DevPulse</strong>. Keep grinding and stay committed to your personal goals! 
</p>

      <div className="mt-6 flex justify-center gap-6 mb-2">
        {iconLinks.map(({ icon, href, label }) => (
          <motion.a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.2, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="text-gray-500 hover:text-[var(--chrono-primary)]"
            aria-label={label}
          >
            {createElement(icon, { size: 20 })}
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}
