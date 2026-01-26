"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Heart, Linkedin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useFavoriteStore } from "@/lib/store";
import ThreeModel from "@/components/ThreeModel";

type Project = {
  id: string;
  model: string;
  title: string;
  description: string;
  author: string;
  technologies: string[];
  authorUrl: string;
  icon: string;
};

const projects: Project[] = [
  {
    id: "1",
    model: "/speaker.glb",
    title: "IoT Speaker with AI",
    description:
      "An interactive IoT Speaker with AI for multiple applications.",
    author: "Felix Figueroa",
    technologies: ["Solidworks"],
    authorUrl: "https://www.linkedin.com/in/felix-manuel-figueroa/",
    icon: "Linkedin",
  },
  {
    id: "2",
    model: "/speaker.glb",
    title: "IoT Speaker with AI",
    description:
      "An interactive IoT Speaker with AI for multiple applications.",
    author: "Felix Figueroa",
    technologies: ["Solidworks"],
    authorUrl: "https://www.linkedin.com/in/felix-manuel-figueroa/",
    icon: "Linkedin",
  },
  {
    id: "3",
    model: "/speaker.glb",
    title: "IoT Speaker with AI",
    description:
      "An interactive IoT Speaker with AI for multiple applications.",
    author: "Felix Figueroa",
    technologies: ["Solidworks"],
    authorUrl: "https://www.linkedin.com/in/felix-manuel-figueroa/",
    icon: "Linkedin",
  },
];

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { favoriteProjects, addFavoriteProject, removeFavoriteProject } =
    useFavoriteStore();

  const project = projects.find((p) => p.id === id);

  if (!project) {
    return <div>Project not found</div>;
  }

  const toggleFavorite = (project: Project) => {
    const isFavorite = favoriteProjects.some((p) => p.id === project.id);
    if (isFavorite) {
      removeFavoriteProject(project.id);
    } else {
      addFavoriteProject({ id: project.id, title: project.title });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Button>
      <Card className="max-w-lg mx-auto custom-shadow border-hidden">
        <CardHeader>
          <div className="h-96 w-full">
            <ThreeModel modelPath={project.model} />
          </div>
          <CardTitle className="flex justify-between items-center text-2xl">
            {project.title}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(project)}
              className="text-red-500 hover:text-red-700"
            >
              <Heart
                className={`h-6 w-6 ${
                  favoriteProjects.some((p) => p.id === project.id)
                    ? "fill-current"
                    : ""
                }`}
              />
            </Button>
          </CardTitle>
          <CardDescription className="text-lg">
            {project.description}
          </CardDescription>
          <p className="text-sm text-gray-300 mt-2">
            Designed by <strong>{project.author}</strong>
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="secondary">
                {tech}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button asChild variant="outline">
            <Link
              href={project.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {project.icon === "Github" ? (
                <Github className="mr-2 h-4 w-4" />
              ) : (
                <Linkedin className="mr-2 h-4 w-4" />
              )}
              {project.icon}
            </Link>
          </Button>
          <Button
            className="bg-linear-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
           dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600
            hover:shadow-lg hover:scale-105 
            transition-all duration-300 ease-out
            text-white font-semibold"
            size="lg"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
