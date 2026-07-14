import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ 
  children, 
  variant = 'primary', 
  className, 
  ...props 
}) {
  const baseStyles = "px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent-strong)] shadow-[var(--shadow-glow)]",
    secondary: "bg-[var(--surface-soft)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--surface)]",
    ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      {...props}
    >
      {children}
    </motion.button>
  );
}
