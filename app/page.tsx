// app/(public)/page.tsx
"use client";

import type React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Code, Headphones, PenTool } from "lucide-react";
import { motion } from "framer-motion";
import CustomCard from "@/components/ui/custom-card.tsx";

const CardButton = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Button
    asChild
    size="lg"
    className="bg-gradient-to-r from-blue-600 to-indigo-950 hover:from-pink-600 hover:to-purple-600 
               dark:from-blue-600 dark:to-indigo-950 dark:hover:from-pink-600 dark:hover:to-purple-600
                hover:shadow-lg hover:scale-105 
                transition-all duration-300 ease-out
                text-white font-semibold w-48"
  >
    <Link href={href} className="flex items-center justify-center">
      {children}
    </Link>
  </Button>
);

const MotionCustomCard = motion.create(CustomCard);

export default function Home() {
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="container mx-auto px-4 md:pt-20 pt-8 pb-8">
      <motion.section
        className="
        relative text-center mb-16 
        before:absolute before:inset-0 
        before:bg-[url('/icon_white.png')] before:bg-no-repeat before:bg-center before:bg-contain 
        before:content-[''] before:pointer-events-none 
        before:blur-[1px] 
        before:hidden md:before:block md:before:opacity-5
      "
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Transform your Business
            </h1>
            <p className="text-3xl md:text-5xl font-bold mb-8">
              with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-500">
                AI-Driven
              </span>{" "}
              Solutions
            </p>
            <p className="mb-8 max-w-3xl text-lg md:text-xl text-muted-foreground mx-auto">
              Empower your business with AI agents, boost productivity and say
              goodbye to repetitive tasks to focus on what truly matters.
            </p>

            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-600 hover:to-purple-600 text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg w-48"
            >
              <Link
                className="flex items-center justify-center"
                href="/courses"
              >
                Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="grid gap-8 md:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        <MotionCustomCard className="flex flex-col" variants={cardVariants}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Headphones className="h-6 w-6 text-white" />
              <span className="text-white">Podcast</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardDescription>
              Listen to our podcast about technology, development, and more.
            </CardDescription>
          </CardContent>
          <CardFooter className="mt-auto">
            <CardButton href="/podcasts">
              Listen to Podcast <ArrowRight className="ml-2 h-4 w-4" />
            </CardButton>
          </CardFooter>
        </MotionCustomCard>

        <MotionCustomCard className="flex flex-col" variants={cardVariants}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-6 w-6 text-white" />
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
            <CardButton href="/projects">
              View Projects <ArrowRight className="ml-2 h-4 w-4" />
            </CardButton>
          </CardFooter>
        </MotionCustomCard>

        <MotionCustomCard className="flex flex-col" variants={cardVariants}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PenTool className="h-6 w-6 text-white" />
              <span className="text-white">Blog</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardDescription>
              Read our latest articles on technology, development, and industry
              trends.
            </CardDescription>
          </CardContent>
          <CardFooter className="mt-auto">
            <CardButton href="/blog">
              Read Blog <ArrowRight className="ml-2 h-4 w-4" />
            </CardButton>
          </CardFooter>
        </MotionCustomCard>
      </motion.section>
    </div>
  );
}
