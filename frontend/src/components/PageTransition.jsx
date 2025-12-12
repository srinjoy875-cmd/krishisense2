import React from 'react';
import { motion } from 'framer-motion';

// --- Shared Content Variants (Optional base) ---
const contentVariants = {
  initial: { opacity: 0, scale: 0.98 },
  enter: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.1, duration: 0.4, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.3, ease: 'easeIn' }
  },
};

// ==========================================
// 1. AuthTransition: HD Frosted Glass Curtain
// ==========================================
// This is for entering/exiting the Auth section (Login/Signup).
// It wipes with a premium "Glass" pane.

export function AuthTransition({ children }) {
  return (
    <>
      {/* 
        HD Frosted Glass Curtain 
        - High blur (backdrop-filter)
        - Semi-transparent background
        - Border for "Glass" edge definition
      */}
      <motion.div
        className="fixed inset-0 z-50 pointer-events-none"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          originY: 0,
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
        }}
      />

      {/* Secondary Accent Curtain (Behind the glass for depth) */}
      <motion.div
        className="fixed inset-0 bg-primary/80 z-40 pointer-events-none"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        style={{ originY: 0 }}
      />

      <motion.div
        className="w-full h-full"
        variants={contentVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </>
  );
}

// ==========================================
// 2. AppTransition: Modern Slide
// ==========================================
// This is for navigating BETWEEN pages in the Web App (Dashboard <-> Weather).
// It uses a smooth X-axis slide + fade.

const slideVariants = {
  initial: {
    opacity: 0,
    x: 20, // Start slightly right
    scale: 0.99
  },
  enter: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 1, 0.5, 1], // Cubic bezier for "Modern" feel
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: -20, // Exit slightly left
    scale: 0.99,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

export function AppTransition({ children }) {
  return (
    <motion.div
      className="w-full h-full"
      variants={slideVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

// Default export for backward compatibility if needed, but preferred named exports
export const PageTransition = AppTransition; 
