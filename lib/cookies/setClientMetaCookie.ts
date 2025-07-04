// lib/cookies/setClientMetaCookie.ts
import { NextResponse } from "next/server";
import { createCipheriv, randomBytes } from "crypto";
import type { ClientMeta } from "@/types/meta";

export function setClientMetaCookie(response: NextResponse, meta: ClientMeta) {
  const secret = process.env.CLIENT_META_KEY!;
  if (!secret) throw new Error("Missing CLIENT_META_KEY");

  const key = Buffer.from(secret, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(JSON.stringify(meta), "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag().toString("base64");

  const finalPayload = `${iv.toString("base64")}:${tag}:${encrypted}`;

  response.cookies.set({
    name: "clientMeta",
    value: finalPayload,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    domain: "leonobitech.com",
  });
}
