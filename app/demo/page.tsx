import { Metadata } from "next";
import { VoiceChat } from "@/components/voice/VoiceChat";

export const metadata: Metadata = {
  title: "Demo | Leonobitech",
  description:
    "Prueba nuestro asistente de voz con IA en tiempo real. Habla y recibe respuestas al instante.",
};

export default function DemoPage() {
  return <VoiceChat />;
}
