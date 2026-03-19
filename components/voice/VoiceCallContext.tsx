"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface VoiceCallState {
  isInCall: boolean;
  isConnecting: boolean;
  isLongPressing: boolean;
  longPressProgress: number;
  setIsInCall: (value: boolean) => void;
  setIsConnecting: (value: boolean) => void;
  setIsLongPressing: (value: boolean) => void;
  setLongPressProgress: (value: number) => void;
  onHangUp: (() => void) | null;
  onConnect: (() => void) | null;
  registerHangUp: (fn: (() => void) | null) => void;
  registerConnect: (fn: (() => void) | null) => void;
}

const VoiceCallContext = createContext<VoiceCallState>({
  isInCall: false,
  isConnecting: false,
  isLongPressing: false,
  longPressProgress: 0,
  setIsInCall: () => {},
  setIsConnecting: () => {},
  setIsLongPressing: () => {},
  setLongPressProgress: () => {},
  onHangUp: null,
  onConnect: null,
  registerHangUp: () => {},
  registerConnect: () => {},
});

export function VoiceCallProvider({ children }: { children: ReactNode }) {
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const [onHangUp, setOnHangUp] = useState<(() => void) | null>(null);
  const [onConnect, setOnConnect] = useState<(() => void) | null>(null);

  const registerHangUp = useCallback((fn: (() => void) | null) => {
    setOnHangUp(() => fn);
  }, []);

  const registerConnect = useCallback((fn: (() => void) | null) => {
    setOnConnect(() => fn);
  }, []);

  return (
    <VoiceCallContext.Provider
      value={{
        isInCall,
        isConnecting,
        isLongPressing,
        longPressProgress,
        setIsInCall,
        setIsConnecting,
        setIsLongPressing,
        setLongPressProgress,
        onHangUp,
        onConnect,
        registerHangUp,
        registerConnect,
      }}
    >
      {children}
    </VoiceCallContext.Provider>
  );
}

export function useVoiceCall() {
  return useContext(VoiceCallContext);
}
