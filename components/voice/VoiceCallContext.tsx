"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface VoiceCallState {
  isInCall: boolean;
  setIsInCall: (value: boolean) => void;
  onHangUp: (() => void) | null;
  registerHangUp: (fn: (() => void) | null) => void;
}

const VoiceCallContext = createContext<VoiceCallState>({
  isInCall: false,
  setIsInCall: () => {},
  onHangUp: null,
  registerHangUp: () => {},
});

export function VoiceCallProvider({ children }: { children: ReactNode }) {
  const [isInCall, setIsInCall] = useState(false);
  const [onHangUp, setOnHangUp] = useState<(() => void) | null>(null);

  const registerHangUp = useCallback((fn: (() => void) | null) => {
    setOnHangUp(() => fn);
  }, []);

  return (
    <VoiceCallContext.Provider
      value={{ isInCall, setIsInCall, onHangUp, registerHangUp }}
    >
      {children}
    </VoiceCallContext.Provider>
  );
}

export function useVoiceCall() {
  return useContext(VoiceCallContext);
}
