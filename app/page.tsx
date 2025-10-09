"use client";

import * as React from "react";
import Link from "next/link";
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
  Github,
  Code,
  Headphones,
  GalleryHorizontal,
  PenTool,
  Workflow,
  Rocket,
  ShieldCheck,
  GitBranch,
  Gauge,
  Users,
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
import WaveGradient from "@/components/visual/WaveGradient";

/* ---------- Dynamic CosmicBioCore con placeholder sutil ---------- */
/* ------------------------------ Magnetic CTA button ------------------------------ */
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
  const heroHalo: Variants = {
    hidden: {
      opacity: 0,
      scale: shouldReduce ? 1 : 1.04,
      filter: shouldReduce ? "none" : "blur(10px)",
    },
    visible: {
      opacity: shouldReduce ? 0.55 : 0.75,
      scale: 1,
      filter: "blur(0px)",
      transition: { ...fast, delay: shouldReduce ? 0 : 0.12 },
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
  const heroSellingPoints = [
    {
      title: "MCP-native stack",
      description:
        "Compose manifests, tools, and context orchestration for ChatGPT and AgentKit.",
    },
    {
      title: "SDK accelerators",
      description:
        "AgentKit, LangGraph, and custom runners wired with guardrails and tests.",
    },
    {
      title: "Human-in-the-loop",
      description:
        "Operators review, approve, and annotate without breaking agent flows.",
    },
    {
      title: "Insights ready",
      description:
        "Benchmarks, telemetry, and rollout scripts baked in from day zero.",
    },
  ];

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

  // Mid highlights section
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

  /* ------------------------------ Magnetic CTA ------------------------------ */
  const { xs, ys, onMove, onLeave } = useMagnetic(8);

  const waLink = "https://wa.me/5491164479971";

  const playbooks = [
    {
      title: "AgentKit + CRM",
      summary: "Auto-qualify leads and sync insights with your sales stack.",
      bullets: [
        "Enrich deals with tool-executed research",
        "Escalate to reps via approval queues",
        "Log transcripts and actions back to HubSpot/Zoho",
      ],
      icon: Workflow,
      status: "In production",
    },
    {
      title: "LangGraph Workflows",
      summary: "Branching agent flows for operations and support teams.",
      bullets: [
        "Multi-agent routing with guardrails",
        "Fallback to humans on policy triggers",
        "Observability with structured traces",
      ],
      icon: GitBranch,
      status: "Beta with partners",
    },
    {
      title: "MCP SDK Launch",
      summary:
        "Spin up a dedicated app surface backed by Model Context Protocol.",
      bullets: [
        "Design manifest + capabilities library",
        "Ship web/mobile command centers",
        "Track usage, retention, and quality",
      ],
      icon: Rocket,
      status: "1-2 week sprint",
    },
  ];

  const stackFlow = [
    {
      title: "Model Context",
      description:
        "Define manifests, tools, and policies tuned for your domain.",
    },
    {
      title: "SDK Orchestration",
      description:
        "Wire AgentKit, LangGraph, or custom runners with guardrails and tests.",
    },
    {
      title: "Human-in-the-loop",
      description:
        "Expose review consoles, approvals, and live annotations for operators.",
    },
    {
      title: "Insights & Scaling",
      description:
        "Ship dashboards, alerts, and rollout scripts for safe continuous delivery.",
    },
  ];

  const communitySignals = {
    metrics: [
      { label: "Agent apps shipped", value: "32" },
      { label: "Avg. launch time", value: "14 days" },
      { label: "Human approvals captured", value: "18k+" },
    ],
    logos: ["OpenAI Builders", "LangChain", "Anthropic", "Supabase"],
  };

  return (
    <>
      <div className="mx-auto w-full px-3 sm:px-4 md:px-5 xl:px-6 pb-8 max-w-[1600px] 2xl:max-w-[1720px]">
        {/* ---------------- HERO ---------------- */}
        <motion.section
          className="relative mb-12 md:mb-20 min-h-[95svh] pt-12 xs:pt-12 lg:pt-10 flex items-center"
          variants={hero}
          initial="hidden"
          animate="visible"
          style={{ y: heroY, scale: heroScale }}
        >
          <motion.div
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-screen max-w-none -translate-x-1/2 overflow-hidden sm:flex items-start justify-center"
            variants={heroHalo}
            aria-hidden
          >
            <WaveGradient className="h-auto w-full max-w-none -translate-y-[22%] opacity-55 sm:-translate-y-[16%] md:-translate-y-[10%] lg:-translate-y-[6%] xl:-translate-y-[4%] transform-gpu" />
          </motion.div>
          <div className="mx-auto w-full max-w-[94vw] xs:max-w-[600px] sm:max-w-[960px] md:max-w-[1320px] xl:max-w-[1600px] 2xl:max-w-[1720px]">
            <div className="flex flex-col items-center gap-10">
              <motion.div
                variants={heroItemUp}
                className="relative z-10 space-y-6 text-center lg:text-left"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
                  <span className="inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 shadow-[0_0_12px_theme(colors.blue.400/60)]" />
                  Model Context Protocol delivery squad
                </span>
                <div className="space-y-4">
                  <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight tracking-tight drop-shadow-md">
                    <span className="block">Build the next generation</span>
                    <span className="block">
                      of{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500">
                        MCP-native AI
                      </span>{" "}
                      apps
                    </span>
                  </h1>

                  <p className="mx-auto max-w-3xl text-sm sm:text-base md:text-xl text-muted-foreground">
                    Launch Model Context Protocol experiences powered by
                    ChatGPT, AgentKit, and custom SDKs. We design, build, and
                    operate production-grade agentic apps alongside the teams
                    leading this new AI wave.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  <Button
                    asChild
                    size="lg"
                    className="group bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md transition hover:from-pink-600 hover:to-purple-600 hover:shadow-lg"
                  >
                    <motion.a
                      href="/gallery"
                      aria-label="Explore the MCP Gallery"
                      onMouseMove={onMove}
                      onMouseLeave={onLeave}
                      style={{ x: xs, y: ys }}
                      className="flex items-center justify-center"
                    >
                      Explore gallery
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </motion.a>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="gap-2 border border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Link
                      href="https://github.com/leonobitech"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="lg"
                    className="gap-2 text-white/80 hover:bg-white/10"
                  >
                    <Link href="#stack">Stack</Link>
                  </Button>
                </div>

                <motion.div variants={heroItemDown} className="text-left">
                  <ul className="grid gap-3 sm:grid-cols-2" role="list">
                    {heroSellingPoints.map((point) => (
                      <li
                        key={point.title}
                        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm"
                      >
                        <p className="text-sm font-semibold text-white">
                          {point.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {point.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            </div>
          </div>

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

        {/* helper component renders cosmic visual with MCP logo */}

        {/* ====================== HIGHLIGHTS ====================== */}
        <motion.section
          id="highlights"
          className="
            relative mb-10 md:mb-16
            rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/30 to-slate-950/40
            px-4 sm:px-5 md:px-6
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

          <div className="mx-auto w-full max-w-[94vw] sm:max-w-[1100px] md:max-w-[1360px] xl:max-w-[1600px] 2xl:max-w-[1720px]">
            <motion.h2
              className="text-center text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight mb-4 sm:mb-6"
              variants={midItem}
            >
              Why teams partner with us for MCP builds
            </motion.h2>

            <div className="grid gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Item 1 */}
              <motion.div
                className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5"
                variants={midItem}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-5 w-5 text-white" aria-hidden />
                  <span className="text-white font-medium">
                    MCP-first architecture
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compose manifests, tools, and context orchestration that plug
                  straight into ChatGPT and AgentKit.
                </p>
              </motion.div>

              {/* Item 2 */}
              <motion.div
                className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5"
                variants={midItem}
              >
                <div className="flex items-center gap-2 mb-2">
                  <GalleryHorizontal
                    className="h-5 w-5 text-white"
                    aria-hidden
                  />
                  <span className="text-white font-medium">SDK launchpad</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Prebuilt accelerators for AgentKit, LangGraph, and custom MCP
                  providers to ship faster.
                </p>
              </motion.div>

              {/* Item 3 */}
              <motion.div
                className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5"
                variants={midItem}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Headphones className="h-5 w-5 text-white" aria-hidden />
                  <span className="text-white font-medium">
                    Human-in-the-loop ops
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Give operators controls for reviews, escalations, and live
                  annotations without breaking the flow.
                </p>
              </motion.div>

              {/* Item 4 */}
              <motion.div
                className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5"
                variants={midItem}
              >
                <div className="flex items-center gap-2 mb-2">
                  <PenTool className="h-5 w-5 text-white" aria-hidden />
                  <span className="text-white font-medium">
                    Tailored agent UX
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Design command centers, workspaces, and embeddable widgets
                  tailored to your teams and customers.
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
              Your launchpad for Model Context Protocol apps
            </h3>

            <p className="text-base md:text-lg text-muted-foreground max-w-[65ch]">
              We design the foundation, wire the SDKs, and keep your agent apps
              running in production. From the first manifest to the millionth
              request, Leonobitech stays in the loop with you.
            </p>

            <ul className="mt-5 space-y-2 text-sm sm:text-base text-muted-foreground">
              <li>• Model manifests, connectors, and secure tools for MCP.</li>
              <li>
                • Opinionated AgentKit flows for ChatGPT, LangGraph, and AMP.
              </li>
              <li>
                • Observability, guardrails, and human approvals out of the box.
              </li>
              <li>
                • Continuous releases with benchmarks, analytics, and support.
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
                alt="mcp logo"
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
                Ready to scope your MCP build? Scan the QR or message me and
                we’ll map the stack—from SDK choices to rollout plan.
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
                    aria-label="Open WhatsApp chat about MCP apps"
                  >
                    Start an MCP build
                  </a>
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground/80">
                No spam—just a focused plan for your agent experience, delivered
                by Felix from Leonobitech.
              </p>
            </div>
          </MotionCustomCardGrid>
        </motion.section>

        {/* ====================== PLAYBOOKS ====================== */}
        <motion.section
          id="playbooks"
          className="relative mb-10 md:mb-16"
          variants={midEnter}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="mx-auto w-full max-w-[94vw] sm:max-w-[1100px] md:max-w-[1360px] xl:max-w-[1600px] 2xl:max-w-[1720px]">
            <motion.div className="text-center mb-8" variants={midItem}>
              <span className="inline-flex items-center justify-center rounded-full bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
                Playbooks
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
                Launch-ready patterns for MCP apps
              </h2>
              <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
                Pick a template or mix and match modules. Each playbook combines
                MCP tooling, SDKs, and human processes to reach production with
                zero friction.
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {playbooks.map((pb) => (
                <MotionCustomCard
                  key={pb.title}
                  variants={midItem}
                  className="p-6"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">
                        <pb.icon className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">
                          {pb.title}
                        </CardTitle>
                        <p className="text-xs uppercase tracking-wide text-blue-200/80">
                          {pb.status}
                        </p>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground/90">
                      {pb.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {pb.bullets.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href="/gallery"
                      className="text-sm font-semibold text-blue-200 hover:text-blue-100 transition"
                    >
                      See examples ↗
                    </Link>
                  </CardFooter>
                </MotionCustomCard>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ====================== MCP STACK FLOW ====================== */}
        <motion.section
          id="stack"
          className="relative mb-10 md:mb-16 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80 px-5 py-10 sm:px-6 md:px-8"
          variants={midEnter}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="mx-auto w-full max-w-[94vw] sm:max-w-[1100px] md:max-w-[1360px] xl:max-w-[1600px] 2xl:max-w-[1720px]">
            <motion.div className="text-center mb-8" variants={midItem}>
              <span className="inline-flex items-center justify-center rounded-full bg-purple-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-purple-200">
                Stack
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
                From context to customer impact
              </h2>
              <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
                Modular architecture ready to deploy reliable agents—from the
                MCP manifest all the way to the insights layer.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-4">
              {stackFlow.map((step, idx) => (
                <motion.div
                  key={step.title}
                  variants={midItem}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/80">
                      {idx + 1}
                    </span>
                    <span className="text-white font-semibold">
                      {step.title}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground/90">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <MotionCustomCard variants={midItem} className="p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <ShieldCheck className="h-5 w-5" aria-hidden />
                    Continuous operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Safe deploys with versioned pipelines, automated tests, and
                    straightforward rollback paths.
                  </p>
                  <p>
                    Observability across LLM metrics, latency, human feedback,
                    and exportable traces.
                  </p>
                </CardContent>
              </MotionCustomCard>
              <MotionCustomCard variants={midItem} className="p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Gauge className="h-5 w-5" aria-hidden />
                    Metrics that matter
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Continuous benchmarks for quality, coverage, and operational
                    savings.
                  </p>
                  <p>Reporting packaged for leadership and stakeholders.</p>
                </CardContent>
              </MotionCustomCard>
            </div>
          </div>
        </motion.section>

        {/* ====================== TRUST & COMMUNITY ====================== */}
        <motion.section
          id="community"
          className="relative mb-12 rounded-3xl border border-white/10 bg-black/40 px-6 py-10 sm:px-7"
          variants={midEnter}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="mx-auto w-full max-w-[94vw] sm:max-w-[1100px] md:max-w-[1360px] xl:max-w-[1600px] 2xl:max-w-[1720px]">
            <motion.div
              className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-center"
              variants={midItem}
            >
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
                  We build alongside the teams leading the MCP wave
                </h2>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-3xl">
                  We stay active across OpenAI, LangChain, and Anthropic
                  communities and share what we learn every week. Join the
                  newsletter for frameworks, metrics, and product updates.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {communitySignals.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center"
                    >
                      <p className="text-2xl font-semibold text-white">
                        {metric.value}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-white/60">
                        {metric.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/60">
                  {communitySignals.logos.map((logo) => (
                    <span
                      key={logo}
                      className="rounded-full border border-white/15 px-4 py-1"
                    >
                      {logo}
                    </span>
                  ))}
                </div>
              </div>

              <MotionCustomCard className="p-6" variants={midItem}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="h-5 w-5" aria-hidden />
                    Join the community
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Get frameworks that blend MCP + SDK, manifest examples, and
                    breakdowns of new releases.
                  </p>
                  <form className="space-y-3">
                    <input
                      type="email"
                      placeholder="your-email@company.com"
                      className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none"
                      required
                      aria-label="Email address"
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-900 hover:to-indigo-800 text-white"
                    >
                      Keep me updated
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground/70">
                    Monthly, zero noise. Unsubscribe anytime.
                  </p>
                </CardContent>
              </MotionCustomCard>
            </motion.div>
          </div>
        </motion.section>

        {/* ----------------------------- CARDS ----------------------------- */}
        <motion.section
          id="features"
          className="mx-auto grid w-full max-w-[94vw] sm:max-w-[1100px] md:max-w-[1360px] xl:max-w-[1600px] 2xl:max-w-[1720px] gap-6 sm:gap-8 md:grid-cols-3 items-stretch"
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
                <GalleryHorizontal className="h-6 w-6 text-white" aria-hidden />
                <span className="text-white">Gallery</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>
                Explore MCP-powered experiments, LinkedIn drops, and SDK builds
                curated in our gallery.
              </CardDescription>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-950 hover:to-indigo-800 transition-colors duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5 transform-gpu text-white font-semibold w-48"
              >
                <Link
                  href="/gallery"
                  className="flex items-center justify-center"
                >
                  View Gallery{" "}
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
                <Headphones className="h-6 w-6 text-white" aria-hidden />
                <span className="text-white">Podcasts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>
                Listen to conversations on agents, automation, and the builders
                behind Leonobitech.
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
                  Play Podcasts{" "}
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
                <Code className="h-6 w-6 text-white" aria-hidden />
                <span className="text-white">Projects</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>
                Discover the projects we&apos;re building and see MCP
                automations in action.
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
        </motion.section>
      </div>
    </>
  );
}
