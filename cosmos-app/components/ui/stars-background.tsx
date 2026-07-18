"use client";

import { useEffect, useRef } from "react";

export function StarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    interface Star {
      x: number;
      y: number;
      radius: number;
      opacity: number;
      speed: number;
      twinkleSpeed: number;
      phase: number;
    }

    interface Meteor {
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      opacity: number;
      active: boolean;
    }

    const stars: Star[] = [];
    const meteors: Meteor[] = [];

    // Generate stars
    for (let i = 0; i < 250; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.2,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;
    let meteorTimer = 0;

    const spawnMeteor = () => {
      meteors.push({
        x: Math.random() * width,
        y: -10,
        vx: (Math.random() - 0.5) * 3 + 2,
        vy: Math.random() * 3 + 2,
        length: Math.random() * 80 + 40,
        opacity: 1,
        active: true,
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep space gradient
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        0,
        width * 0.5,
        height * 0.3,
        width * 0.8
      );
      gradient.addColorStop(0, "rgba(10, 15, 40, 0.95)");
      gradient.addColorStop(0.4, "rgba(5, 5, 20, 0.98)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Aurora effect
      const auroraGradient = ctx.createLinearGradient(0, 0, width, height * 0.4);
      auroraGradient.addColorStop(0, `rgba(14, 165, 233, ${0.02 + Math.sin(time * 0.5) * 0.01})`);
      auroraGradient.addColorStop(0.3, `rgba(139, 92, 246, ${0.015 + Math.cos(time * 0.3) * 0.008})`);
      auroraGradient.addColorStop(0.6, `rgba(16, 185, 129, ${0.01 + Math.sin(time * 0.4) * 0.005})`);
      auroraGradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = auroraGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw stars
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.phase);
        const currentOpacity = star.opacity * (0.6 + twinkle * 0.4);
        const currentRadius = star.radius * (0.8 + twinkle * 0.2);

        ctx.beginPath();
        ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);

        // Glow for brighter stars
        if (star.radius > 1) {
          const glow = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, currentRadius * 3
          );
          glow.addColorStop(0, `rgba(200, 230, 255, ${currentOpacity})`);
          glow.addColorStop(1, "rgba(200, 230, 255, 0)");
          ctx.fillStyle = glow;
          ctx.arc(star.x, star.y, currentRadius * 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
        }

        ctx.fillStyle = `rgba(220, 240, 255, ${currentOpacity})`;
        ctx.fill();
      });

      // Meteors
      meteorTimer++;
      if (meteorTimer > 200 && Math.random() < 0.02) {
        spawnMeteor();
        meteorTimer = 0;
      }

      meteors.forEach((meteor, index) => {
        if (!meteor.active) return;

        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(
          meteor.x - meteor.vx * meteor.length * 0.05,
          meteor.y - meteor.vy * meteor.length * 0.05
        );

        const meteorGradient = ctx.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x - meteor.vx * meteor.length * 0.05,
          meteor.y - meteor.vy * meteor.length * 0.05
        );
        meteorGradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity})`);
        meteorGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.strokeStyle = meteorGradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.opacity -= 0.02;

        if (meteor.opacity <= 0 || meteor.y > height) {
          meteors.splice(index, 1);
        }
      });

      time += 0.01;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
