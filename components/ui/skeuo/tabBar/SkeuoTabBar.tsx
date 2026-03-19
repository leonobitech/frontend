"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
import { useVoiceCall } from "@/components/voice/VoiceCallContext";
import { UserAvatar } from "@/components/Sidebar/_3/SidebarFooter/UserAvatar";
import "./TabBar.css";

export function SkeuoTabBar() {
  const { isAuthenticated } = useSession();
  const { isInCall, onHangUp } = useVoiceCall();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginActive = pathname === "/login";
  const isDashboardActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isDemoActive = pathname === "/demo" || pathname.startsWith("/demo/");

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

        {/* Demo / Hang Up */}
        {isInCall ? (
          <li className="menubar__list active">
            <button
              onClick={() => onHangUp?.()}
              className="menubar__item menubar__item--hangup"
            >
              <span className="menubar__icon menubar__icon--hangup">
                <i className="ri-phone-off-line"></i>
              </span>
              <span className="menubar__text menubar__text--hangup">Colgar</span>
            </button>
            <div className="back_indicator back_indicator--hangup" />
          </li>
        ) : (
          <li className={isDemoActive ? "menubar__list active" : "menubar__list"}>
            <Link href="/demo" className="menubar__item">
              <span className="menubar__icon">
                <i className="ri-mic-line"></i>
              </span>
              <span className="menubar__text">Demo</span>
            </Link>
            <div className="back_indicator" />
          </li>
        )}

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
