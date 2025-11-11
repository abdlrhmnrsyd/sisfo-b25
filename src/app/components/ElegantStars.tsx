'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import React from "react";

const ElegantStars = () => {
  const [stars, setStars] = useState<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    twinkle: boolean;
  }[]>([]);

  useEffect(() => {
    const newStars = [];
    for (let i = 0; i < 200; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() > 0.7 ? 2 : 1,
        opacity: 0.2 + Math.random() * 0.6,
        twinkle: Math.random() > 0.7
      });
    }
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
          animate={star.twinkle ? {
            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
          } : {}}
          transition={star.twinkle ? {
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
        />
      ))}
    </div>
  );
};

export default ElegantStars;


