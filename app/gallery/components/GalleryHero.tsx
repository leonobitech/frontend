"use client";

import { motion } from "framer-motion";

export default function GalleryHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-12"
    >
      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        Build With The MCP Gallery
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground">
        Dive into experiments, SDK-powered agents, and LinkedIn drops from the
        Leonobitech lab.
      </p>
    </motion.div>
  );
}
