import Image from "next/image";
import Link from "next/link";
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
  Heart,
  MessageCircle,
  CalendarDays,
  ExternalLink,
  Github,
} from "lucide-react";
import { useFavoriteStore } from "@/lib/store";
import type { GalleryItem } from "@/data/gallery";

type GalleryEntry = GalleryItem & { coverImage: string };

interface Props {
  entry: GalleryEntry;
}

export default function GalleryCard({ entry }: Props) {
  const { favoriteGallery, addFavoriteGalleryEntry, removeFavoriteGalleryEntry } =
    useFavoriteStore();
  const isFavorite = favoriteGallery.some((item) => item.id === entry.id);

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFavoriteGalleryEntry(entry.id);
    } else {
      addFavoriteGalleryEntry({ id: entry.id, title: entry.title });
    }
  };

  // MCP Connectors go to special page
  const detailUrl = entry.category === "MCP Connectors"
    ? `/mcp-connectors/${entry.id}`
    : `/gallery/${entry.id}`;

  return (
    <Card className="flex flex-col h-full overflow-hidden group">
      <Link
        href={detailUrl}
        className="relative block overflow-hidden rounded-xl"
      >
        <div className="relative w-full aspect-video sm:aspect-3/2">
          <Image
            src={entry.coverImage || "/placeholder.svg"}
            alt={entry.title}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            priority={false}
          />
        </div>
        <span className="sr-only">Ver detalle de {entry.title}</span>
      </Link>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{entry.title}</CardTitle>
            <CardDescription className="mt-2 text-sm line-clamp-3">
              {entry.summary}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className="shrink-0 text-muted-foreground hover:text-primary"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? "fill-current text-rose-500" : ""
              }`}
            />
            <span className="sr-only">
              {isFavorite
                ? "Remove from saved gallery entries"
                : "Save to gallery favourites"}
            </span>
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {entry.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {entry.sdk}
          </Badge>
          {entry.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="grow p-4 pt-0">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {entry.highlights.map((highlight) => (
            <li key={highlight} className="list-disc list-inside">
              {highlight}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {entry.likes.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {entry.comments}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {new Date(entry.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex w-full flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1 min-w-35">
            <Link href={detailUrl}>
              {entry.category === "MCP Connectors" ? "View Tutorial" : "Ver detalle"}
            </Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <a href={entry.link} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on LinkedIn
            </a>
          </Button>
          {entry.repository && (
            <Button asChild size="sm" variant="outline" className="flex items-center gap-2">
              <a href={entry.repository} target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" />
                Repo
              </a>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
