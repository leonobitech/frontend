import {
  Mic,
  Bot,
  Cable,
  Phone,
  ShoppingCart,
  CalendarCheck,
  ClipboardList,
  Zap,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { AnimatedHero } from "@/components/home/AnimatedHero";

const WA_LINK = "https://wa.me/5491164479971";

export const metadata: Metadata = {
  title: "Leonobitech | Avatar Digital con IA - Agente de Voz en Tiempo Real",
  description:
    "Avatar digital con inteligencia artificial que habla en tiempo real. Agente de voz que atiende clientes, gestiona citas y opera tu negocio de forma automatica. Conectado a Odoo, WhatsApp y mas.",
};

/* ───────────────────── Data ───────────────────── */

const capabilities = [
  {
    icon: Phone,
    title: "Atencion al cliente 24/7",
    description:
      "Tu agente de voz responde llamadas y consultas en tiempo real, sin esperas ni horarios.",
  },
  {
    icon: ShoppingCart,
    title: "Ventas automatizadas",
    description:
      "Registra pedidos, cotiza productos y cierra ventas directamente en Odoo.",
  },
  {
    icon: CalendarCheck,
    title: "Agenda y citas",
    description:
      "Gestiona turnos, reservas y disponibilidad conectado a tu calendario en Odoo.",
  },
  {
    icon: ClipboardList,
    title: "Registro automatico en Odoo",
    description:
      "Cada interaccion queda registrada: leads, contactos, pedidos y seguimiento.",
  },
];

const steps = [
  {
    number: "01",
    icon: Cable,
    title: "Conectamos tu Odoo",
    description:
      "Integramos el agente de voz con tu instancia de Odoo a traves de MCP.",
  },
  {
    number: "02",
    icon: Bot,
    title: "Configuramos el agente",
    description:
      "Entrenamos la voz, el tono y las funcionalidades que necesita tu negocio.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Tu cliente habla, Odoo trabaja",
    description:
      "El avatar digital atiende a tus clientes y opera tu Odoo de forma automatica.",
  },
];

/* ───────────────────── Page (Server Component) ───────────────────── */

export default function Home() {
  return (
    <>
      {/* ───────────── Hero (Client - animaciones) ───────────── */}
      <AnimatedHero />

      {/* ───────────── Capabilities (SSR) ───────────── */}
      <section
        id="que-puede-hacer"
        className="bg-gray-50 dark:bg-white/3 py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB] md:text-4xl">
              Que puede hacer tu agente de voz
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
              Un avatar digital con inteligencia artificial que habla con tus
              clientes y opera tu negocio en Odoo sin intervencion humana.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="group rounded-lg bg-white dark:bg-white/5 p-6 transition-all hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors group-hover:bg-gray-200 dark:group-hover:bg-white/15 group-hover:text-gray-900 dark:group-hover:text-white">
                  <cap.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#3A3A3A] dark:text-[#D1D5DB]">
                  {cap.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── How It Works (SSR) ───────────── */}
      <section id="como-funciona" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB] md:text-4xl">
              Como funciona
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
              En tres pasos tu negocio tiene un agente de voz con inteligencia
              artificial atendiendo clientes y operando Odoo.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  <step.icon className="h-7 w-7" />
                </div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                  Paso {step.number}
                </span>
                <h3 className="mb-2 text-xl font-semibold text-[#3A3A3A] dark:text-[#D1D5DB]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Pricing (SSR) ───────────── */}
      <section
        id="precios"
        className="bg-gray-50 dark:bg-white/3 py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB] md:text-4xl">
              Planes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-500 dark:text-gray-400">
              Elije el nivel de automatizacion que necesita tu negocio y escala
              cuando quieras.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {/* Starter */}
            <div className="rounded-lg bg-[#C8CCD1] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-[#2B2B2B]">Starter</h3>
              <p className="mt-1 text-sm text-[#4A4A4A]">
                Un agente de voz + Odoo basico
              </p>

              <div className="mt-6 flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-white/30 text-[#3A3A3A]">
                <Mic className="h-7 w-7" />
              </div>

              <ul className="mt-8 space-y-3 text-sm text-[#4A4A4A]">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-[#5A5A5A]" />
                  Agente de voz con IA configurado
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-[#5A5A5A]" />
                  Odoo configurado (CRM, Ventas o Inventario)
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-[#5A5A5A]" />
                  Conexion agente-Odoo via MCP
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-[#5A5A5A]" />
                  Soporte por 30 dias
                </li>
              </ul>

              <div className="mt-auto pt-8">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-[#2B2B2B] py-3 text-center text-sm font-semibold text-[#D1D5DB] shadow-md transition-all hover:shadow-lg hover:shadow-black/20"
                >
                  Agendar consulta gratuita
                </a>
              </div>
            </div>

            {/* Growth */}
            <div className="rounded-lg bg-[#4A4A4A] p-8 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Growth</h3>
                <span className="rounded-lg bg-white/15 px-3 py-1 text-xs font-medium text-gray-300">
                  Popular
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Multiples agentes + automatizacion completa
              </p>

              <div className="mt-6 flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-white/10 text-gray-300">
                <Bot className="h-7 w-7" />
              </div>

              <ul className="mt-8 space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gray-300" />
                  Todo lo de Starter
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gray-300" />
                  Hasta 3 agentes (voz, WhatsApp, web)
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gray-300" />
                  Workflows automatizados
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gray-300" />
                  Integraciones MCP personalizadas
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gray-300" />
                  Soporte continuo
                </li>
              </ul>

              <div className="mt-auto pt-8">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-[#D1D5DB] py-3 text-center text-sm font-semibold text-[#2B2B2B] shadow-md transition-all hover:shadow-lg hover:shadow-black/20"
                >
                  Agendar consulta gratuita
                </a>
              </div>
            </div>

            {/* Custom */}
            <div className="rounded-lg bg-[#2B2B2B] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-[#D1D5DB]">Custom</h3>
              <p className="mt-1 text-sm text-gray-500">
                Solucion a medida para tu operacion
              </p>

              <div className="mt-6 flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-white/10 text-gray-400">
                <Cable className="h-7 w-7" />
              </div>

              <ul className="mt-8 space-y-3 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  Todo lo de Growth
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  Modulos Odoo personalizados
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  Agentes IA ilimitados
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  Arquitectura e infraestructura dedicada
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  Acompanamiento estrategico continuo
                </li>
              </ul>

              <div className="mt-auto pt-8">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-[#D1D5DB] py-3 text-center text-sm font-semibold text-[#2B2B2B] shadow-md transition-all hover:shadow-lg hover:shadow-black/20"
                >
                  Agendar consulta gratuita
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Blog (SSR) ───────────── */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-6 rounded-lg bg-[#C8CCD1] dark:bg-[#4A4A4A] p-8 sm:p-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#2B2B2B] dark:text-[#D1D5DB]">
                Aprende con nosotros
              </h2>
              <p className="mt-2 text-sm text-[#4A4A4A] dark:text-[#a8a29e]">
                Exploramos IA, automatizacion y herramientas en nuestro blog.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2B2B2B] dark:bg-[#D1D5DB] px-6 py-3 text-sm font-semibold text-[#D1D5DB] dark:text-[#2B2B2B] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/10 shrink-0"
            >
              Visitar blog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── CTA Banner (SSR) ───────────── */}
      <section className="bg-[#4A4A4A] dark:bg-white/[0.07] py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#D1D5DB] md:text-4xl">
            Listo para que la IA atienda a tus clientes?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Prueba el agente de voz en vivo o habla con nosotros para configurar
            el tuyo conectado a Odoo.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-lg bg-[#D1D5DB] px-7 py-3.5 text-base font-semibold text-[#2B2B2B] shadow-md transition-all hover:shadow-lg hover:shadow-black/20"
            >
              <Mic className="h-5 w-5" />
              Probar agente de voz
            </Link>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-500 bg-transparent px-7 py-3.5 text-base font-semibold text-gray-300 transition-all hover:border-gray-400 hover:bg-white/5"
            >
              <MessageSquare className="h-5 w-5" />
              Hablemos por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
