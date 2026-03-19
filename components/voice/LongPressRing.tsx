"use client";

import { useVoiceCall } from "./VoiceCallContext";

const SIZE = 100;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function LongPressRing() {
  const { isLongPressing, longPressProgress } = useVoiceCall();

  if (!isLongPressing) return null;

  const offset = CIRCUMFERENCE * (1 - longPressProgress);

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-4">
        {/* Ring */}
        <div className="relative">
          <svg width={SIZE} height={SIZE} className="drop-shadow-lg">
            {/* Background circle */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={STROKE}
            />
            {/* Progress arc */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="#4ade80"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              style={{ transition: "stroke-dashoffset 0.05s linear" }}
            />
          </svg>
          {/* Percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-[#D1D5DB] tabular-nums">
              {Math.round(longPressProgress * 100)}%
            </span>
          </div>
        </div>

        {/* Label */}
        <span className="text-sm text-gray-400 font-medium">
          Conectando agente...
        </span>
      </div>
    </div>
  );
}
