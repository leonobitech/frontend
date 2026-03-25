// Bundles TalkingHead + Three.js into a single ESM file for runtime loading
import { build } from "esbuild";

await build({
  entryPoints: ["scripts/talkinghead-entry.mjs"],
  bundle: true,
  format: "esm",
  outfile: "public/talkinghead/talkinghead-bundle.mjs",
  minify: true,
  target: "es2020",
});

console.log("✅ Built public/talkinghead/talkinghead-bundle.mjs");
