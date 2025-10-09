import { motion } from "framer-motion";
import { ArrowRight, Github, BookText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LandingHeroMCPProps = {
  logoSrc?: string;
  alt?: string;
  showBackdrop?: boolean;
  className?: string;
};

export default function LandingHeroMCP({
  showBackdrop = false,
  className,
}: LandingHeroMCPProps) {
  const sectionClasses = cn(
    "relative overflow-hidden",
    showBackdrop ? "isolate" : "",
    className
  );

  return (
    <section className={sectionClasses}>
      {showBackdrop && <Backdrop />}

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative z-10"
          >
            <Badge />

            <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Build{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500">
                AI apps
              </span>{" "}
              with MCP
            </h1>

            <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Turn APIs into{" "}
              <span className="font-medium text-foreground">live tools</span>{" "}
              your agents can use. Design, test, and deploy MCP-powered
              experiences with the OpenAI Apps SDK and your own infra.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="group bg-gradient-to-r from-blue-600 to-indigo-900 text-white shadow-md transition hover:to-indigo-800 hover:shadow-lg"
              >
                <a href="#get-started" aria-label="Get started with MCP apps">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
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
                className="gap-2 text-white hover:bg-white/10"
              >
                <a href="#docs">
                  <BookText className="h-4 w-4" />
                  Docs
                </a>
              </Button>
            </div>

            <ul className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  title: "MCP-native",
                  sub: "Tool calls on a simple JSON-RPC bridge",
                },
                {
                  title: "OpenAI Apps SDK",
                  sub: "Wire agents to your MCP servers",
                },
                {
                  title: "Production mindset",
                  sub: "Auth, observability, retries",
                },
                { title: "DX first", sub: "Local dev, hot reload, examples" },
              ].map((f) => (
                <li
                  key={f.title}
                  className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {f.sub}
                  </p>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Badge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
      <span className="inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 shadow-[0_0_12px_theme(colors.blue.400/60)]" />
      Introducing your MCP app stack
    </div>
  );
}

function Backdrop() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,theme(colors.slate.950),theme(colors.black))]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]"
      >
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="dots"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" className="fill-white/15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-600/20 via-indigo-500/15 to-pink-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 -z-10 h-[520px] w-[520px] translate-x-1/3 translate-y-1/4 rounded-full bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-blue-500/20 blur-3xl"
      />
    </>
  );
}
