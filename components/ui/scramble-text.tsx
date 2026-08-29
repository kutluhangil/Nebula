"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$*&%";

interface ScrambleTextProps {
  text: string;
  className?: string;
  duration?: number;
}

export function ScrambleText({ text, className = "", duration = 800 }: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(true);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
        // Restarting for a new `text`: flagged here rather than in the effect
        // body so the state update stays out of the render pass.
        setIsScrambling(true);
      }
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      if (percentage < 1) {
        const scrambled = text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            // Reveal characters gradually from left to right
            if (index < text.length * percentage) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("");
        setDisplayText(scrambled);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayText(text);
        setIsScrambling(false);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [text, duration]);

  return (
    <motion.span
      className={`${className} ${isScrambling ? "font-mono" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {displayText}
    </motion.span>
  );
}
