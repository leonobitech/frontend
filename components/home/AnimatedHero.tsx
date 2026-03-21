"use client";

import {
  motion,
  useReducedMotion,
  easeOut,
  type Variants,
} from "framer-motion";
import { Mic, ArrowRight } from "lucide-react";
import Link from "next/link";

function useVariants(shouldReduce: boolean) {
  const fast = { duration: shouldReduce ? 0 : 0.5, ease: easeOut };

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        when: "beforeChildren",
        staggerChildren: shouldReduce ? 0 : 0.1,
      },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, scale: shouldReduce ? 1 : 0.97 },
    visible: { opacity: 1, scale: 1, transition: fast },
  };

  return { container, fadeUp };
}

export function AnimatedHero() {
  const shouldReduce = useReducedMotion();
  const { container, fadeUp } = useVariants(!!shouldReduce);

  return (
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
          Avatar digital con IA que habla en tiempo real
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400 md:text-xl"
          variants={fadeUp}
        >
          Un agente de voz inteligente que atiende a tus clientes, agenda citas,
          gestiona pedidos y opera tu negocio de forma automatica, conectado a
          Odoo.
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
            Pruebalo ahora
          </Link>
          <a
            href="#que-puede-hacer"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-transparent px-7 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-300 transition-all hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            Ver que puede hacer
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </motion.section>
  );
}
