"use client";
import React from "react";
import { Mic } from "lucide-react";
import "./ConnectButton.css";

interface ConnectButtonProps {
  status: "closed" | "connecting";
  onClick: () => void;
  disabled?: boolean;
  labelClosed?: string;
  labelConnecting?: string;
}

export function ConnectButton({
  status,
  onClick,
  disabled = false,
  labelClosed = "Conectar",
  labelConnecting = "Conectando…",
}: ConnectButtonProps) {
  const isConnecting = status === "connecting";
  const label = isConnecting ? labelConnecting : labelClosed;

  return (
    <div
      className="connect-button-container"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <button
        type="button"
        className={`connect-button ${status}`}
        onClick={onClick}
        disabled={isConnecting || disabled}
        aria-label={label}
      >
        <Mic className="icon" />
      </button>

      {/* Texto visible que también será anunciado por el live region */}
      <span className={`status-label ${status}`}>{label}</span>
    </div>
  );
}
