import { Metadata } from "next";
import { VoiceChat } from "@/components/voice/VoiceChat";

export const metadata: Metadata = {
  title: "Demo | Leonobitech",
  description:
    "Prueba nuestro asistente de voz con IA en tiempo real. Habla y recibe respuestas al instante.",
};

export default function DemoPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <VoiceChat />
      </div>
    </section>
  );
}
