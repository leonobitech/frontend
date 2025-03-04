import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarIcon,
  ClockIcon,
  ArrowRightIcon,
  Github,
  Linkedin,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type BlogPost = {
  id: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  image: string;
  icon: string;
  liveUrl: string;
};

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "n8n Scalable Architecture with Load Balancing and Redis",
    description:
      "Learn How sets up a highly scalable and robust n8n architecture, ensuring optimal performance for workflow automation.",
    date: "2025-03-04",
    readTime: "5 min read",
    image: "/post-01.png",
    icon: "Github",
    liveUrl: "https://github.com/FMFigueroa/n8n-reloaded",
  },
  {
    id: "2",
    title: "Microservices based on gRPC with Rust",
    description:
      "gRPC service built with Tonic and Instrumented with Autometrics.",
    date: "2023-11-31",
    readTime: "8 min read",
    image: "/post-02.png",
    icon: "Github",
    liveUrl: "https://github.com/FMFigueroa/grpc-tonic",
  },
  {
    id: "3",
    title: "Asynchronous Asset Upload System in Rust",
    description:
      "The fn upload_asset function operates asynchronously, showcasing the ability to handling multipart/form-data requests in a web application by allowing you to parse the request body into a type-safe struct.",
    date: "2024-03-07",
    readTime: "6 min read",
    image: "/post-03.png",
    icon: "Github",
    liveUrl: "https://github.com/FMFigueroa/asset-upload-in-Cloudinary",
  },
  // Add more blog posts as needed
];

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Our Blog</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <Card
            key={post.id}
            className="flex flex-col border-hidden custom-shadow"
          >
            <CardHeader className="space-y-2 sm:space-y-3">
              <div className="relative w-full aspect-video">
                <Image
                  src={post.image || "/placeholder_001.png"}
                  alt={post.title}
                  width={400}
                  height={288}
                  className="w-full h-72 rounded-t-lg  object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <CardTitle className="text-lg sm:text-xl line-clamp-2">
                {post.title}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center">
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {new Date(post.date).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {post.readTime}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {post.description}
              </p>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <div className="flex justify-between w-full">
                <Button asChild variant="outline">
                  <Link
                    href={post.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {post.icon === "Github" ? (
                      <Github className="mr-2 h-4 w-4" />
                    ) : (
                      <Linkedin className="mr-2 h-4 w-4" />
                    )}
                    {post.icon}
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
                    href={`/blog/${post.id}`}
                    className="flex items-center text-sm"
                  >
                    Read More
                    <ArrowRightIcon className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
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
