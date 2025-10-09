"use client";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeftIcon,
  ArrowLeft,
  Github,
  Linkedin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
      "In the world of modern software development, building highly performant and scalable distributed systems is a common challenge. To tackle this, the protocol buffers and the gRPC framework has gained significant popularity due to its efficient communication protocol and language-agnostic nature.",
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
      "The upload_asset function operates asynchronously, showcasing the ability to handling multipart/form-data requests in a web application by allowing you to parse the request body into a type-safe struct.",
    date: "2024-03-07",
    readTime: "6 min read",
    image: "/post-03.png",
    icon: "Github",
    liveUrl: "https://github.com/FMFigueroa/asset-upload-in-Cloudinary",
  },
  // Add more blog posts as needed
];

const PostPage = () => {
  const router = useRouter();
  const { id } = useParams();
  const post = blogPosts.find((post) => post.id === id);

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card className="max-w-lg mx-auto border-hidden custom-shadow">
        <CardHeader className="space-y-2 sm:space-y-3">
          <div className="relative w-full overflow-hidden rounded-t-lg aspect-video">
            <Image
              src={post.image || "/placeholder_001.png"}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority={false}
            />
          </div>
          <CardTitle className="text-2xl sm:text-3xl">{post.title}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-muted-foreground">
            <span className="flex items-center">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              {new Date(post.date).toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              {post.readTime}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base sm:text-lg text-justify">
            {post.description}
          </p>
          {/* Add more content for the full blog post here */}
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
              <Button
                className="bg-gradient-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
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
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PostPage;
