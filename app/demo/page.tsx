import type { Metadata } from "next";
import { DemoClient } from "./DemoClient";

export const metadata: Metadata = {
  title: "Demo Agente de Voz con IA | Leonobitech",
  description:
    "Prueba en vivo nuestro avatar digital con inteligencia artificial. Agente de voz en tiempo real que atiende clientes y opera Odoo de forma automatica.",
  openGraph: {
    title: "Leonobit — Avatar Digital con IA",
    description:
      "Agente de Voz en Tiempo Real. Habla con nuestro avatar IA en vivo.",
    type: "website",
    url: "https://www.leonobitech.com/demo",
    siteName: "Leonobitech",
    images: [
      {
        url: "https://www.leonobitech.com/opengraph-demo.png",
        width: 1200,
        height: 630,
        alt: "Leonobit — Avatar Digital con IA en Tiempo Real",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leonobit — Avatar Digital con IA",
    description:
      "Agente de Voz en Tiempo Real. Habla con nuestro avatar IA en vivo.",
    images: ["https://www.leonobitech.com/opengraph-demo.png"],
  },
};

export default function DemoPage() {
  return <DemoClient />;
}
