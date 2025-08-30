"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
  type Variants,
  useMotionValue,
} from "framer-motion";
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

/* ------------------- Fondo sutil para profundidad ------------------- */
function BackgroundFX() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute left-1/2 top-[22%] -translate-x-1/2 -translate-y-1/2 w-[80vmax] h-[80vmax] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.18),transparent_60%)]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vmax] h-[100vmax] rotate-12 bg-[radial-gradient(closest-side,rgba(236,72,153,0.10),transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.08] mix-blend-soft-light [background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'140\\' height=\\'140\\'><filter id=\\'n\\'><feTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.85\\' numOctaves=\\'4\\' stitchTiles=\\'stitch\\'/></filter><rect width=\\'100%\\' height=\\'100%\\' filter=\\'url(%23n)\\' opacity=\\'0.4\\'/></svg>')]" />
    </div>
  );
}

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
  const fast = { duration: shouldReduce ? 0 : 0.45, ease: "easeOut" };
  const fastCanvas = {
    duration: shouldReduce ? 0 : 0.5,
    ease: "easeOut",
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
        : { duration: 0.45, ease: "easeOut" },
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

  const breatheAmp = shouldReduce ? 0 : 0.006;
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    if (shouldReduce) return;
    let raf = 0;
    const loop = (now: number) => {
      setT(now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [shouldReduce]);
  const breatheScale = shouldReduce ? 1 : 1 + Math.sin(t * 1.5) * breatheAmp;
  const breatheY = shouldReduce ? 0 : Math.sin(t * 0.9) * 2;

  /* ------------------------------ CTA magnético ------------------------------ */
  const { xs, ys, onMove, onLeave } = useMagnetic(8);

  return (
    <LazyMotion features={domAnimation}>
      <BackgroundFX />

      <div className="container mx-auto px-4 pb-8">
        {/* ---------------- HERO: mobile arriba / desktop centrado ---------------- */}
        <m.section
          className="
            relative 
            mb-12 md:mb-20
            min-h-[100svh]
            flex flex-col items-center
            justify-start md:justify-center
            pt-16 xs:pt-20 sm:pt-24 md:pt-0
          "
          variants={hero}
          initial="hidden"
          animate="visible"
          style={{ y: heroY, scale: heroScale }}
        >
          <div className="mx-auto w-full max-w-[94vw] xs:max-w-[520px] sm:max-w-[680px] md:max-w-[920px] lg:max-w-[1120px]">
            {/* 1) Título */}
            <m.div
              className="text-center relative z-10 mt-2 xs:mt-0 md:mt-6"
              variants={heroItemUp}
            >
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight md:leading-[1.1] mb-1 drop-shadow-md">
                Transform your Business
              </h1>
              <p className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight">
                with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-500">
                  AI-Driven
                </span>{" "}
                Solutions
              </p>
            </m.div>

            {/* 2) CosmicBioCore */}
            <m.div
              className="
                relative z-0 
                mt-4 sm:mt-5
                md:-mt-12 lg:-mt-14
              "
              variants={heroCanvas}
              style={{ y: breatheY, scale: breatheScale }}
            >
              {/* Alturas contenidas en mobile, grandes en desktop */}
              <div className="h-[36vmin] sm:h-[42vmin] md:h-[52vmin] lg:h-[56vmin]">
                <CosmicBioCore status="open" quality="ultra" />
              </div>
            </m.div>

            {/* 3) Descripción + CTA */}
            <m.div
              className="
                text-center px-4 relative z-10
                mt-10 sm:mt-4
                md:-mt-6 lg:-mt-8
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
                <m.a
                  href="/leonobit"
                  aria-label="Go to Leonobit AI"
                  onMouseMove={onMove}
                  onMouseLeave={onLeave}
                  style={{ x: xs, y: ys }}
                  className="flex items-center justify-center"
                >
                  Leonobit AI
                </m.a>
              </Button>
            </m.div>
          </div>

          {/* Scroll cue: sólo desktop/tablet */}
          <div className="hidden md:flex absolute bottom-6 left-0 right-0 justify-center">
            <Link
              href="#features"
              aria-label="Scroll to features"
              className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-sm">Scroll</span>
              <m.span
                initial={{ y: 0, opacity: 0.8 }}
                animate={{ y: shouldReduce ? 0 : 6, opacity: 1 }}
                transition={{
                  repeat: shouldReduce ? 0 : Infinity,
                  repeatType: "reverse",
                  duration: 0.9,
                }}
              >
                <ChevronDown className="h-5 w-5" aria-hidden />
              </m.span>
            </Link>
          </div>
        </m.section>

        {/* ----------------------------- CARDS (wow) ----------------------------- */}
        <m.section
          id="features"
          className="grid gap-6 sm:gap-8 md:grid-cols-3 items-stretch"
          variants={gridEnter}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
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
                className="bg-gradient-to-r from-blue-600 to-indigo-950 hover:to-indigo-800
                           transition-colors duration-300 ease-out
                           hover:shadow-lg hover:-translate-y-0.5 transform-gpu
                           text-white font-semibold w-48"
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
                className="bg-gradient-to-r from-blue-600 to-indigo-950 hover:to-indigo-800
                           transition-colors duration-300 ease-out
                           hover:shadow-lg hover:-translate-y-0.5 transform-gpu
                           text-white font-semibold w-48"
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
                className="bg-gradient-to-r from-blue-600 to-indigo-950 hover:to-indigo-800
                           transition-colors duration-300 ease-out
                           hover:shadow-lg hover:-translate-y-0.5 transform-gpu
                           text-white font-semibold w-48"
              >
                <Link href="/blog" className="flex items-center justify-center">
                  Read Blog <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </CardFooter>
          </MotionCustomCard>
        </m.section>
      </div>
    </LazyMotion>
  );
}
