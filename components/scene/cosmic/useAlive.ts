"use client";
import { useEffect, useRef } from "react";

export function useAlive() {
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );
  return alive;
}
