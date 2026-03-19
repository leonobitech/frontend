"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useCallback } from "react";
import { useSession } from "@/app/context/SessionContext";
import { useVoiceCall } from "@/components/voice/VoiceCallContext";
import { UserAvatar } from "@/components/Sidebar/_3/SidebarFooter/UserAvatar";
import "./TabBar.css";

const LONG_PRESS_MS = 3000;

export function SkeuoTabBar() {
  const { isAuthenticated } = useSession();
  const { isInCall, isConnecting, onConnect, onHangUp } = useVoiceCall();
  const pathname = usePathname();
  const router = useRouter();

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const isLoginActive = pathname === "/login";
  const isDashboardActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isDemoPage = pathname === "/demo" || pathname.startsWith("/demo/");

  // ─── Long press handlers for Agent button ───

  const handlePointerDown = useCallback(() => {
    if (isInCall || isConnecting) return;
    didLongPress.current = false;

    // Start progress animation
    if (progressRef.current) {
      progressRef.current.style.transition = `width ${LONG_PRESS_MS}ms linear`;
      progressRef.current.style.width = "100%";
    }

    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;

      // Navigate if not on demo page, then connect
      if (!isDemoPage) {
        router.push("/demo");
        setTimeout(() => onConnect?.(), 300);
      } else {
        onConnect?.();
      }
    }, LONG_PRESS_MS);
  }, [isInCall, isConnecting, isDemoPage, router, onConnect]);

  const handlePointerUp = useCallback(() => {
    // Cancel long press
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    // Reset progress animation
    if (progressRef.current) {
      progressRef.current.style.transition = "width 0.2s ease";
      progressRef.current.style.width = "0%";
    }

    // Short tap: just navigate (only if didn't long press)
    if (!didLongPress.current && !isInCall && !isConnecting) {
      if (!isDemoPage) {
        router.push("/demo");
      }
    }
  }, [isInCall, isConnecting, isDemoPage, router]);

  const handlePointerLeave = useCallback(() => {
    // Cancel if finger/mouse leaves
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (progressRef.current) {
      progressRef.current.style.transition = "width 0.2s ease";
      progressRef.current.style.width = "0%";
    }
  }, []);

  const handleHangUp = useCallback(() => {
    onHangUp?.();
  }, [onHangUp]);

  return (
    <div className="menubar__navigation">
      <ul>
        {/* Home */}
        <li className={pathname === "/" ? "menubar__list active" : "menubar__list"}>
          <Link href="/" className="menubar__item">
            <span className="menubar__icon">
              <i className="ri-home-smile-line"></i>
            </span>
            <span className="menubar__text">Inicio</span>
          </Link>
          <div className="back_indicator" />
        </li>

        {/* Agent / Colgar toggle */}
        <li className={isDemoPage || isInCall ? "menubar__list active" : "menubar__list"}>
          {isInCall ? (
            <>
              <button
                onClick={handleHangUp}
                className="menubar__item menubar__item--hangup"
              >
                <span className="menubar__icon menubar__icon--hangup">
                  <i className="ri-phone-off-line"></i>
                </span>
                <span className="menubar__text menubar__text--hangup">Colgar</span>
              </button>
              <div className="back_indicator back_indicator--hangup" />
            </>
          ) : (
            <>
              <button
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                onContextMenu={(e) => e.preventDefault()}
                disabled={isConnecting}
                className="menubar__item menubar__item--agent"
              >
                {/* Long press progress bar */}
                <div className="menubar__progress-track">
                  <div ref={progressRef} className="menubar__progress-fill" />
                </div>
                <span className="menubar__icon">
                  <i className={isConnecting ? "ri-loader-4-line" : "ri-mic-line"}></i>
                </span>
                <span className="menubar__text">
                  {isConnecting ? "..." : "Agente"}
                </span>
              </button>
              <div className="back_indicator" />
            </>
          )}
        </li>

        {/* Login / Avatar */}
        {isAuthenticated ? (
          <li className={isDashboardActive ? "menubar__list active" : "menubar__list"}>
            <Link href="/dashboard" className="menubar__item">
              <span className="menubar__avatar">
                <UserAvatar status="online" size="small" />
              </span>
            </Link>
            <div className="back_indicator" />
          </li>
        ) : (
          <li className={isLoginActive ? "menubar__list active" : "menubar__list"}>
            <button onClick={() => router.push("/login")} className="menubar__item">
              <span className="menubar__icon">
                <i className="ri-login-box-line"></i>
              </span>
              <span className="menubar__text">Login</span>
            </button>
            <div className="back_indicator" />
          </li>
        )}
      </ul>
    </div>
  );
}
