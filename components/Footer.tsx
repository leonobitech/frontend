"use client";

import {
  Github,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const WA_LINK = "https://wa.me/5491164479971";

const socialLinks = [
  {
    icon: Twitter,
    href: "https://x.com/leonobitech",
    label: "Twitter",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/leonobitech/",
    label: "Instagram",
  },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/company/leonobitech",
    label: "LinkedIn",
  },
  {
    icon: Youtube,
    href: "https://www.youtube.com/@leonobitech",
    label: "YouTube",
  },
  {
    icon: Github,
    href: "https://github.com/leonobitech",
    label: "GitHub",
  },
];

const footerColumns = [
  {
    title: "Servicios",
    links: [
      { label: "Implementación Odoo", href: "/#servicios" },
      { label: "Agentes de IA", href: "/#servicios" },
      { label: "Integraciones MCP", href: "/#servicios" },
      { label: "Desarrollo a medida", href: "/#servicios" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Claude 101", href: "/blog/claude-101" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Cómo trabajamos", href: "/#como-funciona" },
      { label: "Legal", href: "/legal" },
      { label: "Política de privacidad", href: "/privacy-policy" },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#3A3A3A]/10 dark:border-white/10 bg-[#2B2B2B] dark:bg-[#222222] text-gray-300">
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-8">
        {/* Top: brand + columns + contact */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="relative h-8 w-8">
                <Image
                  src="/icon_512x512.png"
                  alt="Leonobitech"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-[#B0B5BD]">
                Leonobitech
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
              Implementaciones Odoo potenciadas por agentes de IA y servidores
              MCP. Automatizamos tu negocio desde la consultoría hasta la puesta
              en marcha.
            </p>

            {/* Social */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-gray-400 transition-all hover:bg-white/25 hover:text-white"
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#B0B5BD]">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#B0B5BD]">
              Contacto
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="mailto:felix@leonobitech.com"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  felix@leonobitech.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} Leonobitech. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
