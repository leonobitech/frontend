"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
  easeOut,
  type Variants,
  useMotionValue,
  useAnimationFrame,
} from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Code,
  Headphones,
  PenTool,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MotionCustomCard } from "@/components/ui/custom-card";
import { MotionCustomCardGrid } from "@/components/visual/CardGrid";

/* ---------- Dynamic CosmicBioCore con placeholder sutil ---------- */
const CosmicBioCore = dynamic(
  () =>
    import("@/components/CosmicBioCore/CosmicBioCore").then(
      (m) => m.CosmicBioCore
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[36vmin] sm:h-[42vmin] md:h-[52vmin] lg:h-[56vmin] rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-transparent" />
        <div className="absolute inset-0 animate-pulse opacity-20" />
      </div>
    ),
  }
);

/* ------------------------------ Botón magnético ------------------------------ */
function useMagnetic(amount = 8) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xs = useSpring(x, { stiffness: 180, damping: 12, mass: 0.4 });
  const ys = useSpring(y, { stiffness: 180, damping: 12, mass: 0.4 });

  const onMove = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * amount);
    y.set(((e.clientY - r.top) / r.height - 0.5) * amount);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { xs, ys, onMove, onLeave };
}

export default function Home() {
  const shouldReduce = useReducedMotion();

  /* ------------------------------- Variants ------------------------------- */
  const fast = { duration: shouldReduce ? 0 : 0.45, ease: easeOut };
  const fastCanvas = {
    duration: shouldReduce ? 0 : 0.5,
    ease: easeOut,
    delay: shouldReduce ? 0 : 0.05,
  };

  const hero: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: shouldReduce ? 0 : 0.08,
      },
    },
  };
  const heroItemUp: Variants = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : -14 },
    visible: { opacity: 1, y: 0, transition: fast },
  };
  const heroItemDown: Variants = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 14 },
    visible: { opacity: 1, y: 0, transition: fast },
  };
  const heroCanvas: Variants = {
    hidden: { opacity: 0, scale: shouldReduce ? 1 : 0.985 },
    visible: { opacity: 1, scale: 1, transition: fastCanvas },
  };

  // Grid: solo coordina el stagger, no anima layout del contenedor
  const gridEnter: Variants = {
    hidden: {},
    visible: {
      transition: {
        when: "beforeChildren",
        staggerChildren: shouldReduce ? 0 : 0.12,
      },
    },
  };

  // Cards: fade + leve desplazamiento (suave y estable)
  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduce ? 0 : 14,
      scale: shouldReduce ? 1 : 0.985,
      filter: shouldReduce ? "none" : "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: shouldReduce
        ? { duration: 0 }
        : { duration: 0.45, ease: easeOut },
    },
  };

  // Nueva sección intermedia (Highlights)
  const midEnter: Variants = {
    hidden: {},
    visible: {
      transition: {
        when: "beforeChildren",
        staggerChildren: shouldReduce ? 0 : 0.08,
      },
    },
  };
  const midItem: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduce ? 0 : 10,
      filter: shouldReduce ? "none" : "blur(3px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: shouldReduce
        ? { duration: 0 }
        : { duration: 0.35, ease: easeOut },
    },
  };

  /* ------------------- Parallax hero + breathing del core ------------------- */
  const { scrollYProgress } = useScroll();
  const eased = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    mass: 0.4,
  });

  const heroY = useTransform(eased, (v) => (shouldReduce ? 0 : v * -30));
  const heroScale = useTransform(eased, (v) =>
    shouldReduce ? 1 : 1 - v * 0.02
  );

  // Bloque de t/RAF:
  const breatheScale = useMotionValue(1);
  const breatheY = useMotionValue(0);
  const breatheAmp = shouldReduce ? 0 : 0.006;

  useAnimationFrame((tMs) => {
    if (shouldReduce) return;
    const t = tMs / 1000;
    breatheScale.set(1 + Math.sin(t * 1.5) * breatheAmp);
    breatheY.set(Math.sin(t * 0.9) * 2);
  });

  /* ------------------------------ CTA magnético ------------------------------ */
  const { xs, ys, onMove, onLeave } = useMagnetic(8);

  const waLink = "https://wa.me/5491164479971";

  return (
    <>
      <div className="container mx-auto px-4 pb-8">
        {/* ---------------- HERO ---------------- */}
        <motion.section
          className="
            relative 
            mb-12 md:mb-20
            min-h-[100svh]
            flex flex-col items-center
            justify-start md:justify-center
            pt-8 xs:pt-20 sm:pt-24 md:pt-0
            will-change-transform
          "
          variants={hero}
          initial="hidden"
          animate="visible"
          style={{ y: heroY, scale: heroScale }}
        >
          <div className="mx-auto w-full max-w-[94vw] xs:max-w-[520px] sm:max-w-[680px] md:max-w-[920px] lg:max-w-[1120px]">
            {/* 1) Título */}
            <motion.div
              className="align-baseline sm:text-center md:text-center relative z-10 mt-2 xs:mt-0 md:mt-6 will-change-transform"
              variants={heroItemUp}
            >
              <h1 className="text-4xl sm:text-3xl md:text-5xl font-bold leading-tight md:leading-[1.1] mb-1 drop-shadow-md">
                Transform your Business
              </h1>
              <p className="text-4xl sm:text-3xl md:text-5xl font-bold leading-tight">
                with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-500">
                  AI-Driven
                </span>{" "}
                Solutions
              </p>
            </motion.div>

            {/* 2) CosmicBioCore */}
            <motion.div
              className="
                relative z-0 
                mt-4 sm:mt-5
                md:-mt-12 lg:-mt-14 will-change-transform
              "
              variants={heroCanvas}
              style={{ y: breatheY, scale: breatheScale }}
            >
              <div className="h-[36vmin] sm:h-[42vmin] md:h-[52vmin] lg:h-[56vmin]">
                <CosmicBioCore status="open" quality="ultra" />
              </div>
            </motion.div>

            {/* 3) Descripción + CTA */}
            <motion.div
              className="
                text-center px-4 relative z-10
                mt-10 sm:mt-4
                md:-mt-6 lg:-mt-8
                will-change-transform
              "
              variants={heroItemDown}
            >
              <p className="mx-auto max-w-3xl text-sm sm:text-base md:text-xl text-muted-foreground mb-5 md:mb-6">
                Empower your business with AI agents, boost productivity and say
                goodbye to repetitive tasks to focus on what truly matters.
              </p>

              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-600 hover:to-purple-600 
                           text-white transition-all duration-300 ease-in-out transform hover:scale-105 
                           shadow-md hover:shadow-lg w-36 mx-auto"
              >
                <motion.a
                  href="/leonobit"
                  aria-label="Go to Leonobit AI"
                  onMouseMove={onMove}
                  onMouseLeave={onLeave}
                  style={{ x: xs, y: ys }}
                  className="flex items-center justify-center"
                >
                  Leonobit AI
                </motion.a>
              </Button>
            </motion.div>
          </div>

          {/* Scroll cue */}
          <div className="hidden md:flex absolute bottom-6 left-0 right-0 justify-center">
            <Link
              href="#highlights"
              aria-label="Scroll to highlights"
              className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-sm">Scroll</span>
              <motion.span
                initial={{ y: 0, opacity: 0.8 }}
                animate={{ y: shouldReduce ? 0 : 6, opacity: 1 }}
                transition={{
                  repeat: shouldReduce ? 0 : Infinity,
                  repeatType: "reverse",
                  duration: 0.9,
                }}
              >
                <ChevronDown className="h-5 w-5" aria-hidden />
              </motion.span>
            </Link>
          </div>
        </motion.section>

        {/* ====================== HIGHLIGHTS ====================== */}
        <motion.section
          id="highlights"
          className="
            relative mb-10 md:mb-16
            rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/30 to-slate-950/40
            px-4 sm:px-6 md:px-10
            py-6 sm:py-8 md:py-10
            shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
            overflow-hidden
          "
          variants={midEnter}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="pointer-events-none absolute -z-10 left-1/2 top-0 h-[220px] w-[720px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(99,102,241,0.15),transparent_60%)]" />

          <div className="mx-auto w-full max-w-[94vw] xs:max-w-[560px] sm:max-w-[780px] md:max-w-[980px] lg:max-w-[1120px]">
            <motion.h2
              className="text-center text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight mb-4 sm:mb-6"
              variants={midItem}
            >
              Supercharge your workflow
            </motion.h2>

            <div className="grid gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Item 1 */}
              <motion.div
                className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5"
                variants={midItem}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-5 w-5 text-white" aria-hidden />
                  <span className="text-white font-medium">Dev-ready</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Integrations, clean APIs and components to ship fast.
                </p>
              </motion.div>

              {/* Item 2 */}
              <motion.div
                className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5"
                variants={midItem}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Headphones className="h-5 w-5 text-white" aria-hidden />
                  <span className="text-white font-medium">
                    Human-in-the-loop
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Agents that collaborate with your team, not replace it.
                </p>
              </motion.div>

              {/* Item 3 */}
              <motion.div
                className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5"
                variants={midItem}
              >
                <div className="flex items-center gap-2 mb-2">
                  <PenTool className="h-5 w-5 text-white" aria-hidden />
                  <span className="text-white font-medium">Customizable</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tailor prompts, tools, and UI to your business.
                </p>
              </motion.div>

              {/* Item 4 */}
              <motion.div
                className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5"
                variants={midItem}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="h-5 w-5 text-white" aria-hidden />
                  <span className="text-white font-medium">Go-to-market</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  From prototype to production with analytics built-in.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ====================== ERP + CRM AUTOMATION ====================== */}
        <motion.section
          id="automation"
          className="relative mb-10 md:mb-16 grid gap-8 md:grid-cols-2 items-center"
          variants={midEnter}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Columna izquierda */}
          <motion.div variants={midItem}>
            <div className="mb-3">
              <span className="inline-block h-[3px] w-12 rounded-full bg-gradient-to-r from-blue-600 to-pink-500" />
            </div>
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 max-w-[32ch]">
              Automated ERP + CRM for Revenue Acceleration
            </h3>

            <p className="text-base md:text-lg text-muted-foreground max-w-[65ch]">
              Centralize customer data, streamline operations, and turn every
              inbound message into a sales opportunity—automatically. No
              duplicate entry, no manual handoffs, just a single flow from lead
              to invoice.
            </p>

            <ul className="mt-5 space-y-2 text-sm sm:text-base text-muted-foreground">
              <li>
                • Capture leads instantly and keep context across channels.
              </li>
              <li>
                • Qualify, assign, and nurture with automated steps—zero
                copy-paste.
              </li>
              <li>
                • Sync deals, inventory, and invoices in one place with
                real-time visibility.
              </li>
              <li>
                • Track KPIs (conversion, time-to-first-response, win rate) with
                clear dashboards.
              </li>
            </ul>
          </motion.div>

          {/* Columna derecha */}
          <MotionCustomCardGrid
            className="p-6 md:p-7 flex flex-col"
            variants={midItem}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full place-items-center">
              <Image
                src="/icon.png"
                alt="Leonobitech logo"
                width={220}
                height={220}
                sizes="(max-width: 768px) 200px, 220px"
                className="rounded-lg drop-shadow-xl object-contain"
              />

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open WhatsApp by scanning the QR"
                title="Open WhatsApp"
                className="relative w-full max-w-[240px] aspect-square rounded-xl ring-1 ring-white/10 bg-gradient-to-b from-slate-900/40 to-slate-950/60 overflow-hidden grid place-items-center transform-gpu hover:scale-[1.03] transition-transform duration-300"
              >
                <Image
                  src="/qr-contact.png"
                  alt="WhatsApp QR code"
                  width={220}
                  height={220}
                  sizes="(max-width: 768px) 200px, 220px"
                  className="rounded-md object-contain"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(240px_240px_at_50%_50%,rgba(99,102,241,0.16),transparent_70%)]"
                />
                <span className="sr-only">
                  Scan to start a chat on WhatsApp
                </span>
              </a>
            </div>

            <div className="mt-6 md:mt-7 border-t border-white/10 pt-6 text-center max-w-[60ch] mx-auto">
              <p className="text-sm sm:text-base text-muted-foreground">
                Prefer to try it now? Scan the QR or click below to message me
                on WhatsApp. Let’s talk about how an automated ERP + CRM can
                accelerate your sales.
              </p>
              <div className="mt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-900 hover:to-indigo-800 text-white shadow-md hover:shadow-lg"
                >
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open WhatsApp chat"
                  >
                    Open WhatsApp
                  </a>
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground/80">
                No spam. I’ll answer personally to understand your use case and
                propose a tailored flow.
              </p>
            </div>
          </MotionCustomCardGrid>
        </motion.section>

        {/* ----------------------------- CARDS ----------------------------- */}
        <motion.section
          id="features"
          className="grid gap-6 sm:gap-8 md:grid-cols-3 items-stretch"
          variants={gridEnter}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <MotionCustomCard
            className="h-full transform-gpu"
            variants={cardVariants}
            custom="L"
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Headphones className="h-6 w-6 text-white" aria-hidden />
                <span className="text-white">Podcast</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>
                Listen to our podcast about technology, development, and more.
              </CardDescription>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-950 hover:to-indigo-800 transition-colors duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5 transform-gpu text-white font-semibold w-48"
              >
                <Link
                  href="/podcasts"
                  className="flex items-center justify-center"
                >
                  Listen to Podcast{" "}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </CardFooter>
          </MotionCustomCard>

          <MotionCustomCard
            className="h-full transform-gpu"
            variants={cardVariants}
            custom="C"
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-6 w-6 text-white" aria-hidden />
                <span className="text-white">Projects</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>
                Discover the projects we&apos;re working on and join us in our
                endeavors.
              </CardDescription>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-950 hover:to-indigo-800 transition-colors duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5 transform-gpu text-white font-semibold w-48"
              >
                <Link
                  href="/projects"
                  className="flex items-center justify-center"
                >
                  View Projects{" "}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </CardFooter>
          </MotionCustomCard>

          <MotionCustomCard
            className="h-full transform-gpu"
            variants={cardVariants}
            custom="R"
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PenTool className="h-6 w-6 text-white" aria-hidden />
                <span className="text-white">Blog</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>
                Read our latest articles on technology, development, and
                industry trends.
              </CardDescription>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-950 hover:to-indigo-800 transition-colors duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5 transform-gpu text-white font-semibold w-48"
              >
                <Link href="/blog" className="flex items-center justify-center">
                  Read Blog <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </CardFooter>
          </MotionCustomCard>
        </motion.section>
      </div>
    </>
  );
}
