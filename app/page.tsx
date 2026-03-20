"use client";

import {
  motion,
  useReducedMotion,
  easeOut,
  type Variants,
} from "framer-motion";
import {
  Mic,
  Bot,
  Cable,
  Phone,
  ShoppingCart,
  CalendarCheck,
  ClipboardList,
  Zap,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

const WA_LINK = "https://wa.me/5491164479971";

/* ───────────────────── Animation helpers ───────────────────── */

function useVariants(shouldReduce: boolean) {
  const fast = { duration: shouldReduce ? 0 : 0.5, ease: easeOut };

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { when: "beforeChildren", staggerChildren: shouldReduce ? 0 : 0.1 },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, scale: shouldReduce ? 1 : 0.97 },
    visible: { opacity: 1, scale: 1, transition: fast },
  };

  return { container, fadeUp };
}

/* ───────────────────── Data ───────────────────── */

const capabilities = [
  {
    icon: Phone,
    title: "Atención al cliente",
    description: "Tu agente responde llamadas y consultas 24/7, sin esperas ni horarios.",
  },
  {
    icon: ShoppingCart,
    title: "Ventas automatizadas",
    description: "Registra pedidos, cotiza productos y cierra ventas directamente en Odoo.",
  },
  {
    icon: CalendarCheck,
    title: "Agenda y citas",
    description: "Gestiona turnos, reservas y disponibilidad conectado a tu calendario en Odoo.",
  },
  {
    icon: ClipboardList,
    title: "Registro en Odoo",
    description: "Cada interacción queda registrada: leads, contactos, pedidos y seguimiento.",
  },
];

const steps = [
  {
    number: "01",
    icon: Cable,
    title: "Conectamos tu Odoo",
    description: "Integramos el agente con tu instancia de Odoo a través de MCP.",
  },
  {
    number: "02",
    icon: Bot,
    title: "Configuramos el agente",
    description: "Entrenamos la voz, el tono y las funcionalidades que necesita tu negocio.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Tu cliente habla, Odoo trabaja",
    description: "El agente atiende a tus clientes y opera tu Odoo automáticamente.",
  },
];

/* ───────────────────── Page ───────────────────── */

export default function Home() {
  const shouldReduce = useReducedMotion();
  const { container, fadeUp } = useVariants(!!shouldReduce);

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <motion.section
        className="relative overflow-hidden min-h-screen flex items-start pt-24 md:items-center md:pt-0"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <motion.h1
            className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB] md:text-5xl lg:text-6xl"
            variants={fadeUp}
          >
            Tu agente de ventas con IA, conectado a{" "}
              Odoo
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400 md:text-xl"
            variants={fadeUp}
          >
            Un asistente de voz inteligente que atiende a tus clientes,
            agenda citas, gestiona pedidos y registra todo en Odoo — automáticamente.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            variants={fadeUp}
          >
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-lg bg-[#3A3A3A] dark:bg-[#D1D5DB] px-7 py-3.5 text-base font-semibold text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15"
            >
              <Mic className="h-5 w-5" />
              Pruébalo ahora
            </Link>
            <a
              href="#que-puede-hacer"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-transparent px-7 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              Ver qué puede hacer
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* ───────────── Capabilities ───────────── */}
      <section
        id="que-puede-hacer"
        className="bg-gray-50 dark:bg-white/3 py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB] md:text-4xl">
              ¿Qué puede hacer tu agente?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
              Un agente de voz que habla con tus clientes y opera tu negocio
              en Odoo sin intervención humana.
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

      {/* ───────────── How It Works ───────────── */}
      <section
        id="como-funciona"
        className="py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB] md:text-4xl">
              Cómo funciona
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
              En tres pasos tu negocio tiene un agente de voz
              atendiendo clientes y operando Odoo.
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

      {/* ───────────── Pricing ───────────── */}
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
              Elegí el nivel de automatización que necesita tu negocio y escalá cuando quieras.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {/* Starter — gris claro */}
            <div className="rounded-lg bg-[#C8CCD1] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-[#2B2B2B]">
                Starter
              </h3>
              <p className="mt-1 text-sm text-[#4A4A4A]">
                Un agente de voz + Odoo básico
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
                  Conexión agente-Odoo via MCP
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-[#5A5A5A]" />
                  Soporte por 30 días
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

            {/* Growth — gris medio, destacado */}
            <div className="rounded-lg bg-[#4A4A4A] p-8 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  Growth
                </h3>
                <span className="rounded-lg bg-white/15 px-3 py-1 text-xs font-medium text-gray-300">
                  Popular
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Múltiples agentes + automatización completa
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
                  Workflows automatizados con n8n
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

            {/* Custom — gris oscuro */}
            <div className="rounded-lg bg-[#2B2B2B] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-[#D1D5DB]">
                Custom
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Solución a medida para tu operación
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
                  Módulos Odoo personalizados
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
                  Acompañamiento estratégico continuo
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

      {/* ───────────── CTA Banner ───────────── */}
      <section
        className="bg-[#4A4A4A] dark:bg-white/[0.07] py-20 md:py-24"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-[#D1D5DB] md:text-4xl"
          >
            ¿Listo para que la IA atienda a tus clientes?
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-gray-400"
          >
            Probá el agente de voz en vivo o hablá con nosotros para
            configurar el tuyo conectado a Odoo.
          </p>
          <div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
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
