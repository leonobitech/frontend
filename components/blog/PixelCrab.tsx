"use client";

import { useState, useEffect } from "react";

export function PixelCrab({ size = 6 }: { size?: number }) {
  const px = size;
  const [isBlinking, setIsBlinking] = useState(false);

  // Blink frequently
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // 0=transparent (background + eyes), 1=body
  const grid = [
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [
      0,
      0,
      1,
      1,
      isBlinking ? 1 : 0,
      1,
      1,
      1,
      1,
      1,
      1,
      isBlinking ? 1 : 0,
      1,
      1,
      0,
      0,
    ],
    [
      0,
      0,
      1,
      1,
      isBlinking ? 1 : 0,
      1,
      1,
      1,
      1,
      1,
      1,
      isBlinking ? 1 : 0,
      1,
      1,
      0,
      0,
    ],
    [
      0,
      0,
      1,
      1,
      isBlinking ? 1 : 0,
      1,
      1,
      1,
      1,
      1,
      1,
      isBlinking ? 1 : 0,
      1,
      1,
      0,
      0,
    ],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  ];

  const colors: Record<number, string> = {
    0: "transparent",
    1: "#C0775A",
  };

  return (
    <div
      aria-hidden="true"
      className="inline-block animate-bounce"
      style={{
        width: grid[0].length * px,
        height: grid.length * px,
        animationDuration: "3s",
        animationTimingFunction: "ease-in-out",
      }}
    >
      {grid.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => (
            <div
              key={x}
              style={{
                width: px,
                height: px,
                backgroundColor: colors[cell],
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
