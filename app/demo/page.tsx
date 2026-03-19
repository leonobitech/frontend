"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { VoiceChatMobile } from "@/components/voice/VoiceChatMobile";
import { VoiceChatDesktop } from "@/components/voice/VoiceChatDesktop";

export default function DemoPage() {
  const isMobile = useIsMobile();

  if (isMobile) return <VoiceChatMobile />;
  return <VoiceChatDesktop />;
}
