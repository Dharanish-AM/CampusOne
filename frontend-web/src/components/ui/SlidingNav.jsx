import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function SlidingNav({ tabs, activeIndex, onChange }) {
  const tabWidth = 144; // w-36 = 144px in Tailwind

  return (
    <div className="relative flex items-center p-1 bg-white/5 border border-[var(--border-subtle)] rounded-xl w-max backdrop-blur-sm">
      {/* Sliding highlight container */}
      <motion.div
        className="absolute top-1 bottom-1 bg-[var(--brand-accent)] rounded-lg shadow-[var(--shadow-glow)]"
        initial={false}
        animate={{
          width: tabWidth,
          x: activeIndex * tabWidth,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      
      {tabs.map((tab, idx) => {
        const isActive = activeIndex === idx;
        return (
          <button
            key={tab.id || tab.label}
            onClick={() => onChange(idx)}
            style={{ width: tabWidth }}
            className={`relative z-10 px-4 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              isActive ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
