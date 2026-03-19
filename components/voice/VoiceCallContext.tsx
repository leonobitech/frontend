"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface VoiceCallState {
  isInCall: boolean;
  isConnecting: boolean;
  setIsInCall: (value: boolean) => void;
  setIsConnecting: (value: boolean) => void;
  onHangUp: (() => void) | null;
  onConnect: (() => void) | null;
  registerHangUp: (fn: (() => void) | null) => void;
  registerConnect: (fn: (() => void) | null) => void;
}

const VoiceCallContext = createContext<VoiceCallState>({
  isInCall: false,
  isConnecting: false,
  setIsInCall: () => {},
  setIsConnecting: () => {},
  onHangUp: null,
  onConnect: null,
  registerHangUp: () => {},
  registerConnect: () => {},
});

export function VoiceCallProvider({ children }: { children: ReactNode }) {
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
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
        setIsInCall,
        setIsConnecting,
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
