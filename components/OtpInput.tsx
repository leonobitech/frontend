"use client";

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";

type Props = {
  length?: number;
  onComplete: (code: string) => void;
};

export type OtpInputHandle = {
  reset: () => void;
};

export const OtpInput = forwardRef<OtpInputHandle, Props>(
  ({ length = 6, onComplete }, ref) => {
    const [values, setValues] = useState<string[]>(Array(length).fill(""));
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const hasSubmittedRef = useRef(false);

    // 🔁 Lógica de detección de completitud
    useEffect(() => {
      const isComplete = values.every((val) => val !== "");
      if (!hasSubmittedRef.current && isComplete) {
        hasSubmittedRef.current = true;
        onComplete(values.join(""));
      }
    }, [values, onComplete]);

    // Exponer método reset al padre
    useImperativeHandle(ref, () => ({
      reset: () => {
        setValues(Array(length).fill(""));
        hasSubmittedRef.current = false;
        inputsRef.current[0]?.focus();
      },
    }));

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
            }}
            autoFocus={i === 0}
            aria-label={`Código OTP dígito ${i + 1}`}
            className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-black dark:text-white"
          />
        ))}
      </div>
    );
  }
);
OtpInput.displayName = "OtpInput";
