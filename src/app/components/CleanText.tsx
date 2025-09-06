'use client';

import { motion } from "framer-motion";
import React from "react";

const CleanText = ({ children, className = "", size = "text-4xl" }: { children: React.ReactNode; className?: string; size?: string }) => {
  return (
    <motion.div
      className={`relative ${size} text-white ${className}`}
      style={{
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
        fontWeight: '500',
        letterSpacing: '-0.025em',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
};

export default CleanText;


