'use client';

import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full text-center text-sm text-[var(--chrono-secondary)] py-6 mt-auto border-t border-neutral-200 px-4"
    >
      <p className="font-semibold">&copy; {new Date().getFullYear()} DevPulse</p>

      <p className="mt-1">
        Built with <span role="img" aria-label="love">❤️</span> and Focus by{' '}
        <a
          href="https://www.iamasiff.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--chrono-primary)] transition font-medium"
        >
          Asifur Rahman
        </a>
      </p>
      <div className="inline-block bg-[var(--chrono-primary)] text-white text-xs font-medium px-3 mt-2 py-1 rounded-full">
          v1.1
        </div>
    </motion.footer>
  );
}
