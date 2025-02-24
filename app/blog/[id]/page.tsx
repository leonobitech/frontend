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
} from "lucide-react";
import Image from "next/image";

type BlogPost = {
  id: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  image: string;
};

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Getting Started with Web Development",
    description:
      "Learn the basics of HTML, CSS, and JavaScript to kickstart your web development journey.",
    date: "2023-06-01",
    readTime: "5 min read",
    image: "/podcast-01.jpeg",
  },
  {
    id: "2",
    title: "Advanced React Patterns",
    description:
      "Dive deep into advanced React patterns to build more efficient and scalable applications.",
    date: "2023-06-15",
    readTime: "8 min read",
    image: "/podcast-02.jpeg",
  },
  {
    id: "3",
    title: "The Future of AI in Education",
    description:
      "Explore how artificial intelligence is shaping the future of online education and learning.",
    date: "2023-07-01",
    readTime: "6 min read",
    image: "/podcast-01.jpeg",
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
          <div className="relative w-full aspect-video">
            <Image
              src={post.image || "/placeholder_001.png"}
              alt={post.title}
              width={400}
              height={288}
              className="w-full  h-72 rounded-t-lg object-cover"
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
          <p className="text-base sm:text-lg">{post.description}</p>
          {/* Add more content for the full blog post here */}
        </CardContent>
        <CardFooter className="flex justify-between">
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
        </CardFooter>
      </Card>
    </div>
  );
};

export default PostPage;
