"use client";

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
import { Github, ExternalLink, Heart, Linkedin } from "lucide-react";
import Link from "next/link";
//import Image from "next/image";
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
  liveUrl: string;
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
    liveUrl: "https://lenobit.vercel.app/projects",
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
    liveUrl: "https://lenobit.vercel.app/projects",
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
    liveUrl: "https://lenobit.vercel.app/projects",
  },
];

export default function ProjectsPage() {
  const { favoriteProjects, addFavoriteProject, removeFavoriteProject } =
    useFavoriteStore();

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
      <h1 className="text-3xl font-bold mb-8">Projects</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="flex flex-col border-hidden custom-shadow"
          >
            <CardHeader>
              {/* <Image
                src={project.image}
                alt={project.title}
                width={400}
                height={288}
                className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-110"
              /> */}
              <ThreeModel modelPath={project.model} />
              <CardTitle className="flex justify-between items-center">
                {project.title}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(project)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      favoriteProjects.some((p) => p.id === project.id)
                        ? "fill-current"
                        : ""
                    }`}
                  />
                </Button>
              </CardTitle>
              <CardDescription>{project.description}</CardDescription>
              <p className="text-xs text-gray-300">
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
            <CardFooter className="mt-auto">
              <div className="flex justify-between w-full">
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
                  className="bg-gradient-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
             dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600
              hover:shadow-lg hover:scale-105 
              transition-all duration-300 ease-out
              text-white font-semibold"
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <Link
                    href={`/projects/${project.id}`}
                    /* target="_blank" */
                    /* rel="noopener noreferrer" */
                  >
                    <ExternalLink className="mr-2 h-4 w-4 " />
                    View Project
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
