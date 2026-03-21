"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { VoiceChatMobile } from "@/components/voice/VoiceChatMobile";
import { VoiceChatDesktop } from "@/components/voice/VoiceChatDesktop";

export function DemoClient() {
  const isMobile = useIsMobile();

  if (isMobile) return <VoiceChatMobile />;
  return <VoiceChatDesktop />;
}
