"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
import { useVoiceCall } from "@/components/voice/VoiceCallContext";
import { UserAvatar } from "@/components/Sidebar/_3/SidebarFooter/UserAvatar";
import "./TabBar.css";

export function SkeuoTabBar() {
  const { isAuthenticated } = useSession();
  const { isInCall, isConnecting, onConnect, onHangUp } = useVoiceCall();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginActive = pathname === "/login";
  const isDashboardActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isDemoPage = pathname === "/demo" || pathname.startsWith("/demo/");

  const handleDemoTap = () => {
    if (isInCall) {
      onHangUp?.();
    } else {
      if (!isDemoPage) {
        router.push("/demo");
        // Connect after navigation — small delay for page to mount
        setTimeout(() => onConnect?.(), 300);
      } else {
        onConnect?.();
      }
    }
  };

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

        {/* Demo / Colgar toggle */}
        <li className={isDemoPage || isInCall ? "menubar__list active" : "menubar__list"}>
          <button
            onClick={handleDemoTap}
            disabled={isConnecting}
            className={isInCall ? "menubar__item menubar__item--hangup" : "menubar__item"}
          >
            <span className={isInCall ? "menubar__icon menubar__icon--hangup" : "menubar__icon"}>
              <i className={isInCall ? "ri-phone-off-line" : isConnecting ? "ri-loader-4-line" : "ri-mic-line"}></i>
            </span>
            <span className={isInCall ? "menubar__text menubar__text--hangup" : "menubar__text"}>
              {isInCall ? "Colgar" : isConnecting ? "..." : "Agente"}
            </span>
          </button>
          <div className={isInCall ? "back_indicator back_indicator--hangup" : "back_indicator"} />
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
