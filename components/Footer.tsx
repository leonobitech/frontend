"use client";

import { useState } from "react";
import {
  ArrowRight,
  Github,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";

const socialLinks = [
  {
    icon: Twitter,
    href: "https://x.com/leonobitech",
    label: "Twitter profile",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/leonobitech/",
    label: "Instagram profile",
  },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/company/leonobitech",
    label: "LinkedIn profile",
  },
  {
    icon: Youtube,
    href: "https://www.youtube.com/@leonobitech",
    label: "Youtube profile",
  },
  {
    icon: Github,
    href: "https://github.com/leonobitech",
    label: "GitHub profile",
  },
];

const footerLinks = [
  {
    title: "Solutions",
    links: [
      { label: "Gallery", href: "/gallery" },
      { label: "Playbooks", href: "/#playbooks" },
      { label: "Stack", href: "/#stack" },
      { label: "Projects", href: "/projects" },
    ],
  },
  {
    title: "Capabilities",
    links: [
      { label: "AgentKit + MCP", href: "/#playbooks" },
      { label: "Human-in-the-loop", href: "/#stack" },
      { label: "Observability", href: "/#stack" },
      { label: "Launch support", href: "/#community" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Podcasts", href: "/podcasts" },
      { label: "Blog", href: "/blog" },
      { label: "Docs", href: "/docs" },
      { label: "Contact", href: "/contact" },
      { label: "Legal", href: "/legal" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribed:", email);
    setEmail("");
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10">
      {/* Enhanced Dynamic background for footer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-1/4 -bottom-1/4 w-1/2 h-1/2 bg-linear-to-br from-blue-300/30 to-indigo-400/30 dark:from-blue-500/20 dark:to-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob"></div>
      </div>

      <div className="relative z-10 mx-auto w-full px-4 sm:px-5 md:px-6 xl:px-8 pt-8 pb-6 max-w-400 2xl:max-w-430">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2  group">
              {/* <BookOpen
                className="h-8 w-8 text-blue-800 dark:text-blue-950 hover:scale-105 
                 transition-colors duration-300 ease-out"
              /> */}
              <div className="relative w-12 h-12">
                <Image
                  src="/icon.png"
                  alt="icon"
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority
                />
              </div>
              <span
                className="font-bold text-3xl bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:scale-105 
                 transition-colors duration-300 ease-out"
              >
                Felix Figueroa
              </span>
            </Link>
            {/* <div className="text-sm  ml-14 -translate-y-4 text-gray-600 font-bold">
              by Felix Figueroa
            </div> */}
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We help product teams design, ship, and scale MCP-native agent
              apps backed by ChatGPT, AgentKit, and custom SDKs.
            </p>
            <ul className="mb-6 space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li>• MCP manifests + SDK orchestration</li>
              <li>• Human-in-the-loop consoles and guardrails</li>
              <li>• Observability, benchmarks, and rollout playbooks</li>
            </ul>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  type="email"
                  placeholder="Get MCP field notes"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="grow h-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-hidden"
                />
                <Button
                  type="submit"
                  className="bg-linear-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
               dark:from-pink-600 dark:to-purple-600 dark:hover:from-pink-500 dark:hover:to-purple-500
                hover:shadow-lg hover:scale-105 
                transition-all duration-300 ease-out
                text-white font-semibold w-12 h-8"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Monthly, zero noise. MCP frameworks, metrics, and release briefs.
              </p>
            </form>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 mb-2">
                Direct Contact
              </p>
              <Link
                href="mailto:hola@leonobitech.com"
                className="text-sm font-medium text-blue-500 hover:text-blue-400 transition"
              >
                info@leonobitech.com
              </Link>
            </div>
          </div>

          {footerLinks.map((column, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {column.title}
              </h3>
              <ul className="space-y-2 pl-4">
                {column.links.map((link, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="my-6 flex flex-col justify-center items-start">
          <div className="flex space-x-6 mb-4 sm:mb-0">
            {socialLinks.map((social, index) => (
              <Link
                key={index}
                href={social.href}
                aria-label={social.label}
                className="group relative p-2 rounded-full bg-linear-to-r from-indigo-950 to-blue-500 dark:from-purple-700 dark:to-pink-500 transition-all duration-300 ease-out hover:shadow-lg hover:scale-110"
              >
                <social.icon className="h-5 w-5 text-white transition-transform duration-300 ease-out group-hover:-translate-y-1" />
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700/50 pt-6 flex flex-col justify-center items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 sm:mb-0">
            © {currentYear} Leonobitech | Felix Figueroa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
