'use client';

import { Github } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const navLinks = [
    { href: '#focus', label: 'Focus' },
    { href: '#analytics', label: 'Analytics' },
    { href: '#sessions', label: 'Sessions' },
    { href: '#cloud', label: 'Cloud' },
    { href: '#about', label: 'About' },
  ];

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-3 z-50 px-3 sm:px-5"
    >
      <header className="glass-nav-shell max-w-6xl mx-auto rounded-2xl px-6 py-2 sm:px-6 sm:py-2.5">
        <div className="flex items-center gap-2 md:gap-5">
          <motion.a
            href="#focus"
            className="flex items-center gap-2.5 shrink-0"
            whileHover={{ scale: 1.03 }}
          >
            <motion.span
              className="w-2.5 h-2.5 rounded-full bg-[var(--chrono-primary)] self-center"
              animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--chrono-secondary)]">
              DevPulse
            </h1>
          </motion.a>

          <div className="ml-auto hidden md:flex items-center justify-end gap-2">
            <nav className="flex items-center gap-1.5">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="glass-nav-link">
                  {link.label}
                </a>
              ))}
            </nav>
            <motion.a
              href="https://github.com/asifrahman2003/DevPulse"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              className="action-btn-secondary text-xs sm:text-sm"
            >
              <Github className="w-4 h-4" />
              GitHub
            </motion.a>
          </div>

          <div className="ml-auto md:hidden">
            <motion.a
              href="https://github.com/asifrahman2003/DevPulse"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              className="action-btn-secondary text-xs"
            >
              <Github className="w-4 h-4" />
              GitHub
            </motion.a>
          </div>
        </div>

        <nav className="md:hidden mt-2 flex items-center justify-end gap-1 overflow-x-auto pb-1">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="glass-nav-link whitespace-nowrap">
              {link.label}
            </a>
          ))}
        </nav>
      </header>
    </motion.div>
  );
}
