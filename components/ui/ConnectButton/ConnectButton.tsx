"use client";
import React from "react";
import { Mic, PhoneOff } from "lucide-react";
import "./ConnectButton.css";

interface ConnectButtonProps {
  status: "open" | "connecting" | "closed";
  onClick: () => void;
  disabled?: boolean;
}

export function ConnectButton({
  status,
  onClick,
  disabled = false,
}: ConnectButtonProps) {
  const isConnecting = status === "connecting";
  const isOpen = status === "open";

  const getIcon = () => {
    if (isConnecting) return <Mic className="icon pulse" />;
    if (isOpen) return <PhoneOff className="icon" />;
    return <Mic className="icon" />;
  };

  const getLabel = () => {
    if (isConnecting) return "Connecting...";
    if (isOpen) return "Connected";
    return "Disconnected";
  };

  return (
    <div className="connect-button-container" aria-live="polite">
      <button
        className={`connect-button ${status}`}
        onClick={onClick}
        disabled={isConnecting || disabled}
      >
        {getIcon()}
      </button>
      <span className={`status-label ${status}`}>{getLabel()}</span>
    </div>
  );
}
