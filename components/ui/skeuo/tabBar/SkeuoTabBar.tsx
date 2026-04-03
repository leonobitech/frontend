"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useCallback, useEffect } from "react";
import { useSession } from "@/app/context/SessionContext";
import { useVoiceCall } from "@/components/voice/VoiceCallContext";
import { UserAvatar } from "@/components/Sidebar/_3/SidebarFooter/UserAvatar";
import "./TabBar.css";

const LONG_PRESS_MS = 1500;
const PROGRESS_INTERVAL = 50;

export function SkeuoTabBar() {
  const { isAuthenticated } = useSession();
  const {
    isInCall, isConnecting, onConnect, onHangUp,
    setIsLongPressing, setLongPressProgress,
  } = useVoiceCall();
  const pathname = usePathname();
  const router = useRouter();

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const didLongPress = useRef(false);
  const startTime = useRef(0);

  const isLoginActive = pathname === "/login";
  const isDashboardActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isDemoPage = pathname === "/demo" || pathname.startsWith("/demo/");
  const isBlogActive = pathname === "/blog" || pathname.startsWith("/blog/");
  const isCoursesActive = pathname === "/courses" || pathname.startsWith("/courses/");

  const clearTimers = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setIsLongPressing(false);
    setLongPressProgress(0);
  }, [setIsLongPressing, setLongPressProgress]);

  // Cleanup on unmount
  useEffect(() => clearTimers, [clearTimers]);

  const handlePointerDown = useCallback(() => {
    if (isInCall || isConnecting) return;
    didLongPress.current = false;
    startTime.current = Date.now();
    setIsLongPressing(true);
    setLongPressProgress(0);

    // Progress updates
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min(elapsed / LONG_PRESS_MS, 1);
      setLongPressProgress(progress);
    }, PROGRESS_INTERVAL);

    // Trigger after 3s
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      clearTimers();

      if (!isDemoPage) {
        router.push("/demo");
        setTimeout(() => onConnect?.(), 300);
      } else {
        onConnect?.();
      }
    }, LONG_PRESS_MS);
  }, [isInCall, isConnecting, isDemoPage, router, onConnect, clearTimers, setIsLongPressing, setLongPressProgress]);

  const handlePointerUp = useCallback(() => {
    clearTimers();

    if (!didLongPress.current && !isInCall && !isConnecting) {
      if (!isDemoPage) {
        router.push("/demo");
      }
    }
  }, [isInCall, isConnecting, isDemoPage, router, clearTimers]);

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

        {/* Blog */}
        <li className={isBlogActive ? "menubar__list active" : "menubar__list"}>
          <Link href="/blog" className="menubar__item">
            <span className="menubar__icon">
              <i className="ri-book-open-line"></i>
            </span>
            <span className="menubar__text">Blog</span>
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
                onPointerLeave={handlePointerUp}
                onContextMenu={(e) => e.preventDefault()}
                disabled={isConnecting}
                className="menubar__item"
              >
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

        {/* Cursos */}
        <li className={isCoursesActive ? "menubar__list active" : "menubar__list"}>
          <Link href="/courses" className="menubar__item">
            <span className="menubar__icon">
              <i className="ri-graduation-cap-line"></i>
            </span>
            <span className="menubar__text">Cursos</span>
          </Link>
          <div className="back_indicator" />
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
