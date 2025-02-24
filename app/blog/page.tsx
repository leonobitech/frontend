import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon, ClockIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
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
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start p-0 h-auto"
              >
                <Link
                  href={`/blog/${post.id}`}
                  className="flex items-center text-sm"
                >
                  Read More
                  <ArrowRightIcon className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
