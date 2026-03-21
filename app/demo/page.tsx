import type { Metadata } from "next";
import { DemoClient } from "./DemoClient";

export const metadata: Metadata = {
  title: "Demo Agente de Voz con IA | Leonobitech",
  description:
    "Prueba en vivo nuestro avatar digital con inteligencia artificial. Agente de voz en tiempo real que atiende clientes y opera Odoo de forma automatica.",
};

export default function DemoPage() {
  return <DemoClient />;
}
