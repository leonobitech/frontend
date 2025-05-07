import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  BookOpen,
  BarChart,
  Star,
  Eye,
  ThumbsUp,
  Heart,
} from "lucide-react";
import { useFavoriteStore } from "@/lib/store";

interface CourseProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  level: string;
  modules: number;
  price: number;
  rating: number;
  image: string;
  views: number;
  likes: number;
}

export default function CourseCard({ course }: { course: CourseProps }) {
  const { favoriteCourses, addFavoriteCourse, removeFavoriteCourse } =
    useFavoriteStore();
  const isFavorite = favoriteCourses.some((c) => c.id === course.id);

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFavoriteCourse(course.id);
    } else {
      addFavoriteCourse({ id: course.id, title: course.title });
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden group">
      <div className="relative overflow-hidden">
        <Image
          src={course.image || "/placeholder.svg"}
          alt={course.title}
          width={400}
          height={225}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {course.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-wrap items-center justify-between text-base text-muted-foreground mb-2">
            <span className="flex items-center mr-2 mb-1">
              <Clock className="mr-1 h-4 w-4" />
              {course.duration}
            </span>
            <span className="flex items-center mr-2 mb-1">
              <BookOpen className="mr-1 h-4 w-4" />
              {course.modules} modules
            </span>
            <span className="flex items-center mb-1">
              <BarChart className="mr-1 h-4 w-4" />
              {course.level}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className="text-muted-foreground hover:text-primary"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? "fill-current text-red-500" : ""
              }`}
            />
            <span className="sr-only">
              {isFavorite ? "Remove from favorites" : "Add to favorites"}
            </span>
          </Button>
        </div>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-sm">
            {course.category}
          </Badge>
          <span className="font-bold text-xl">${course.price.toFixed(2)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(course.rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
            <span className="ml-2 text-base text-muted-foreground">
              {course.rating.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-base text-muted-foreground">
            <span className="flex items-center">
              <Eye className="mr-1 h-4 w-4" />
              {course.views}
            </span>
            <span className="flex items-center">
              <ThumbsUp className="mr-1 h-4 w-4" />
              {course.likes}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4">
        <Button
          className="bg-gradient-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
               dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600
                hover:shadow-lg hover:scale-105 
                transition-all duration-300 ease-out
                text-white font-semibold w-full"
          size="sm"
        >
          Enroll Now
        </Button>
      </CardFooter>
    </Card>
  );
}
