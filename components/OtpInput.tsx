"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  length?: number;
  onComplete: (code: string) => void;
  firstInputRef?: React.RefObject<HTMLInputElement | null>;
};

export function OtpInput({ length = 6, onComplete, firstInputRef }: Props) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (values.every((val) => val !== "") && !hasCompleted.current) {
      hasCompleted.current = true;
      onComplete(values.join(""));
    }
  }, [values, onComplete]);

  useEffect(() => {
    // 🔁 Permite nuevos intentos si se borra algo
    if (values.some((val) => val === "")) {
      hasCompleted.current = false;
    }
  }, [values]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);
    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").slice(0, length);
    if (!/^\d+$/.test(pasted)) return;
    const newValues = pasted.split("");
    setValues((prev) => prev.map((_, i) => newValues[i] || ""));
    const nextIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={values[i]}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          ref={(el) => {
            inputsRef.current[i] = el;
            if (i === 0 && firstInputRef && el) {
              firstInputRef.current = el;
            }
          }}
          aria-label={`Código OTP dígito ${i + 1}`}
          className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-black dark:text-white"
        />
      ))}
    </div>
  );
}
