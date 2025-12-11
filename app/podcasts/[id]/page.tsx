"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Twitter,
  Linkedin,
  ArrowLeft,
  Heart,
  Loader2,
} from "lucide-react";
import { useFavoriteStore } from "@/lib/store";
import { toast } from "sonner";
import Link from "next/link";

// API Response type
type PodcastFromAPI = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  width: number | null;
  height: number | null;
  publishedAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
};

// Internal type for the player
type PodcastEpisode = {
  id: string;
  title: string;
  artist: string;
  mediaSrc: string;
  description: string;
  duration: string;
  durationSeconds: number;
  date: string;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const transformPodcast = (podcast: PodcastFromAPI): PodcastEpisode => ({
  id: podcast.id,
  title: podcast.title,
  artist: podcast.user.name || "Leonobitech",
  mediaSrc: podcast.videoUrl,
  description: podcast.description || "",
  duration: formatDuration(podcast.duration),
  durationSeconds: podcast.duration,
  date: formatDate(podcast.publishedAt),
});

export default function PodcastDetailPage() {
  const params = useParams();
  const router = useRouter();
  const podcastId = params.id as string;

  const [podcast, setPodcast] = useState<PodcastEpisode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { favoritePodcasts, addFavoritePodcast, removeFavoritePodcast } =
    useFavoriteStore();

  // Fetch podcast by ID
  const fetchPodcast = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `https://core.leonobitech.com/podcasts/${podcastId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Podcast no encontrado");
        } else {
          setError("Error al cargar el podcast");
        }
        return;
      }

      const data = await response.json();

      if (data.success && data.podcast) {
        setPodcast(transformPodcast(data.podcast));
      } else {
        setError("Podcast no encontrado");
      }
    } catch (err) {
      console.error("Error fetching podcast:", err);
      setError("Error al cargar el podcast");
    } finally {
      setIsLoading(false);
    }
  }, [podcastId]);

  useEffect(() => {
    if (podcastId) {
      fetchPodcast();
    }
  }, [podcastId, fetchPodcast]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current || !podcast) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((error) => {
        toast.error(`${error}`);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const percent =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
      setDuration(videoRef.current.duration);
    }
  };

  const seek = (percent: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime =
        (percent / 100) * videoRef.current.duration;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const shareOnTwitter = () => {
    if (!podcast) return;
    const text = `Listen to "${podcast.title}" by ${podcast.artist} on Leonobitech Podcasts!`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareOnLinkedin = () => {
    if (!podcast) return;
    const text = `Listen to "${podcast.title}" by ${podcast.artist} on Leonobitech Podcasts!\n\n${podcast.description}\n\nCheck it out at: ${window.location.href}`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const toggleFavorite = () => {
    if (!podcast) return;
    const isFavorite = favoritePodcasts.some((p) => p.id === podcast.id);
    if (isFavorite) {
      removeFavoritePodcast(podcast.id);
      toast.success("Eliminado de favoritos");
    } else {
      addFavoritePodcast({ id: podcast.id, title: podcast.title });
      toast.success("Agregado a favoritos");
    }
  };

  const isFavorite = podcast
    ? favoritePodcasts.some((p) => p.id === podcast.id)
    : false;

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-12 pb-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (error || !podcast) {
    return (
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">
            {error || "Podcast no encontrado"}
          </h1>
          <p className="text-gray-400 mb-6">
            El podcast que buscas no existe o fue eliminado.
          </p>
          <Link href="/podcasts">
            <Button className="bg-blue-600 hover:bg-blue-500">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ver todos los podcasts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-12 pb-8">
      {/* Back button */}
      <div className="max-w-xl mx-auto mb-6">
        <Link
          href="/podcasts"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a podcasts
        </Link>
      </div>

      {/* Player Card */}
      <Card
        className={`max-w-xl mx-auto mb-8 border bg-linear-to-br from-blue-900/40 via-slate-900/30 to-blue-950/40 backdrop-blur-2xl text-white overflow-hidden ring-2 transition-all duration-300 ${
          isPlaying
            ? "ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.3),0_0_45px_rgba(59,130,246,0.1)]"
            : "border-white/10 ring-white/10 shadow-2xl shadow-blue-500/20"
        }`}
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col items-center gap-4">
            {/* Mobile: Simple vertical video */}
            <div
              className={`md:hidden w-full max-w-[320px] aspect-[9/16] relative rounded-2xl overflow-hidden ring-2 transition-all duration-300 shrink-0 ${
                isPlaying
                  ? "ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.3),0_0_45px_rgba(59,130,246,0.1)]"
                  : "ring-white/10"
              }`}
              onContextMenu={(e) => e.preventDefault()}
            >
              <video
                ref={videoRef}
                src={podcast.mediaSrc}
                className="w-full h-full object-cover"
                onTimeUpdate={handleProgress}
                onLoadedMetadata={handleProgress}
                playsInline
                controls={isPlaying}
                controlsList="nodownload"
              />
              {!isPlaying && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-16 h-16 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                    onClick={togglePlay}
                    aria-label="Play"
                  >
                    <Play className="h-8 w-8 text-white" />
                  </Button>
                </div>
              )}
            </div>

            {/* Desktop: LinkedIn-style with blur sides */}
            <div
              className={`hidden md:block w-full max-w-[560px] aspect-[3/4] relative rounded-lg overflow-hidden ring-2 transition-all duration-300 shrink-0 ${
                isPlaying
                  ? "ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.3),0_0_45px_rgba(59,130,246,0.1)]"
                  : "ring-white/10"
              }`}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Blurred background video */}
              <video
                src={podcast.mediaSrc}
                className="absolute inset-0 w-full h-full object-cover scale-150 blur-2xl opacity-60"
                muted
                playsInline
                aria-hidden="true"
              />
              {/* Dark overlay for better contrast */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Main centered video */}
              <div className="absolute inset-0 flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={podcast.mediaSrc}
                  className="h-full aspect-[9/16] object-cover shadow-2xl"
                  onTimeUpdate={handleProgress}
                  onLoadedMetadata={handleProgress}
                  playsInline
                  controls={isPlaying}
                  controlsList="nodownload"
                />
              </div>

              {/* Play overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-16 h-16 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all backdrop-blur-sm"
                    onClick={togglePlay}
                    aria-label="Play"
                  >
                    <Play className="h-8 w-8 text-white" />
                  </Button>
                </div>
              )}
            </div>

            {/* Controls Section */}
            <div className="w-full max-w-md">
              <div className="text-center">
                <h1 className="text-xl md:text-2xl font-bold">
                  {podcast.title}
                </h1>
                <p className="text-sm text-gray-300 mt-1">
                  By {podcast.artist}
                </p>
                {podcast.description && (
                  <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                    {podcast.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">{podcast.date}</p>

                <div className="flex justify-center gap-2 mt-4 mb-6">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`bg-linear-to-r from-blue-600 to-blue-900 hover:from-blue-600/90 hover:to-blue-900/80 text-white border-transparent transition-all duration-300 ease-in-out transform hover:scale-105 ${
                      isPlaying
                        ? "shadow-[0_0_10px_rgba(37,99,235,0.5),0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_15px_rgba(37,99,235,0.6),0_0_25px_rgba(37,99,235,0.4)]"
                        : "shadow-md hover:shadow-lg"
                    }`}
                    onClick={shareOnLinkedin}
                  >
                    Share on <Linkedin className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-600/70 hover:to-purple-600/70 text-white transition-all duration-300 ease-in-out transform hover:scale-105 ${
                      isPlaying
                        ? "shadow-[0_0_10px_rgba(219,39,119,0.5),0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_15px_rgba(219,39,119,0.6),0_0_25px_rgba(147,51,234,0.4)]"
                        : "shadow-md hover:shadow-lg"
                    }`}
                    onClick={shareOnTwitter}
                  >
                    Share on <Twitter className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`transition-all duration-300 ease-in-out transform hover:scale-105 ${
                      isFavorite
                        ? "bg-pink-600 hover:bg-pink-500 text-white"
                        : "bg-white/10 hover:bg-white/20 text-gray-300"
                    }`}
                    onClick={toggleFavorite}
                  >
                    <Heart
                      className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <Slider
                  value={[progress]}
                  max={100}
                  step={0.1}
                  onValueChange={(value) => seek(value[0])}
                  className="text-white"
                  aria-label="Seek"
                  active={isPlaying}
                />
                <div
                  className={`flex justify-between text-xs font-bold tracking-wider transition-all duration-300 ${
                    isPlaying
                      ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                      : "text-white/60 opacity-60"
                  }`}
                >
                  <span>{formatTime(duration * (progress / 100))}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-14 w-14 border-2 transition-all duration-300 hover:scale-110 rounded-full ${
                    isPlaying
                      ? "text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/15 border-blue-400 hover:border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4),0_0_25px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5),0_0_35px_rgba(59,130,246,0.3)]"
                      : "text-white/60 hover:text-white/80 bg-white/5 hover:bg-white/10 border-white/10"
                  }`}
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-7 w-7" />
                  ) : (
                    <Play className="h-7 w-7 ml-0.5" />
                  )}
                </Button>

                <div className="w-px h-8 bg-white/20" />

                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-9 w-9 rounded-full border-2 transition-all duration-300 hover:scale-110 ${
                    isPlaying
                      ? "text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/15 border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.4),0_0_25px_rgba(59,130,246,0.2)]"
                      : "text-white/60 hover:text-white/80 bg-white/5 hover:bg-white/10 border-white/10"
                  }`}
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setVolume(value[0] / 100)}
                  className="w-20"
                  aria-label="Volume"
                  active={isPlaying}
                  variant="white"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* More podcasts link */}
      <div className="max-w-xl mx-auto text-center">
        <Link href="/podcasts">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Ver todos los podcasts
          </Button>
        </Link>
      </div>
    </div>
  );
}
