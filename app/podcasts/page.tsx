"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Twitter,
  Linkedin,
  Clock,
  Heart,
  Plus,
} from "lucide-react";
import { useFavoriteStore } from "@/lib/store";
import { toast } from "sonner";
import { useSession } from "@/app/context/SessionContext";
import { VideoUploader, type PodcastUploadResponse } from "@/components/podcasts";

const formatDuration = (duration: string) => {
  const [minutes, seconds] = duration.split(":").map(Number);
  return `${minutes}m ${seconds}s`;
};

type PodcastEpisode = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioSrc: string;
  mediaSrc: string;
  mediaType: "audio" | "video";
  description: string;
  duration: string;
  date: string;
};

const podcastEpisodes: PodcastEpisode[] = [
  {
    id: "1",
    title: "ONNX and Future in the Age of LLMs with Pytorch 2.0 Part 01",
    artist: "SqueezeBits",
    cover: "/podcast-02.jpeg",
    audioSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1739314535/lenobit/podcasts/ONNXandFutureinth_AgeofLLMsPart01_oaj608.mp4",
    mediaSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1739314535/lenobit/podcasts/ONNXandFutureinth_AgeofLLMsPart01_oaj608.mp4",
    mediaType: "video",
    description: "The Rise and Fall of ONNX in the era of PyTorch 2.0",
    duration: "09:08",
    date: "Feb 11, 2025",
  },
  {
    id: "2",
    title: "ONNX and Future in the Age of LLMs with Pytorch 2.0 Part 02",
    artist: "SqueezeBits",
    cover: "/podcast-02.jpeg",
    audioSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1739318955/lenobit/podcasts/ONNXandFutureinth_AgeofLLMsPart02_fwjfwv.mp4",
    mediaSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1739318955/lenobit/podcasts/ONNXandFutureinth_AgeofLLMsPart02_fwjfwv.mp4",
    mediaType: "video",
    description: "The Rise and Fall of ONNX in the era of PyTorch 2.0",
    duration: "09:02",
    date: "Feb 11, 2025",
  },
  {
    id: "3",
    title: "AI-Enhanced Embedded Control System using ROS2 and Rust Part 01",
    artist: "Lenobitech",
    cover: "/podcast-02.jpeg",
    audioSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1739056116/lenobit/podcasts/AI-Emb-Ctrl-ROS2-Rust-Part01_pmqzwe.mp4",
    mediaSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1739056116/lenobit/podcasts/AI-Emb-Ctrl-ROS2-Rust-Part01_pmqzwe.mp4",
    mediaType: "video",
    description:
      "Discover an AI-Enhanced Embedded Control System using ROS2 and Rust.",
    duration: "09:21",
    date: "Feb 08, 2025",
  },
  {
    id: "4",
    title: "AI-Enhanced Embedded Control System using ROS2 and Rust Part 02",
    artist: "Lenobitech",
    cover: "/podcast-02.jpeg",
    audioSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1739056274/lenobit/podcasts/AI-Emb-Ctrl-ROS2-Rust-Part02_lxraua.mp4",
    mediaSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1739056274/lenobit/podcasts/AI-Emb-Ctrl-ROS2-Rust-Part02_lxraua.mp4",
    mediaType: "video",
    description:
      "Discover an AI-Enhanced Embedded Control System using ROS2 and Rust.",
    duration: "09:27",
    date: "Feb 08, 2025",
  },
  {
    id: "5",
    title: "Blockchain Fundamentals Part 01",
    artist: "Akhil Sharma",
    cover: "/podcast-02.jpeg",
    audioSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1738620915/lenobit/podcasts/Blockchain-part01_mdpnoj.mp4",
    mediaSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1738620915/lenobit/podcasts/Blockchain-part01_mdpnoj.mp4",
    mediaType: "video",
    description:
      "Discover the basic fundamentals of how a blockchain network is formed.",
    duration: "05:45",
    date: "Feb 03, 2025",
  },
  {
    id: "6",
    title: "Blockchain Fundamentals Part 02",
    artist: "Akhil Sharma",
    cover: "/podcast-02.jpeg",
    audioSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1738627956/lenobit/podcasts/Blockchain-part02_kv824t.mp4",
    mediaSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1738627956/lenobit/podcasts/Blockchain-part02_kv824t.mp4",
    mediaType: "video",
    description:
      "Discover the basic fundamentals of how a blockchain network is formed.",
    duration: "06:33",
    date: "Feb 03, 2025",
  },
  {
    id: "7",
    title: "Blockchain Fundamentals Part 03",
    artist: "Akhil Sharma",
    cover: "/podcast-02.jpeg",
    audioSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1738629172/lenobit/podcasts/Blockchain-part03_mmoi7r.mp4",
    mediaSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1738629172/lenobit/podcasts/Blockchain-part03_mmoi7r.mp4",
    mediaType: "video",
    description:
      "Discover the basic fundamentals of how a blockchain network is formed.",
    duration: "04:13",
    date: "Feb 03, 2025",
  },
  {
    id: "8",
    title: "Low-Level Concurrency in Rust",
    artist: "Mara Bos",
    cover: "/podcast-01.jpeg",
    audioSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1735300946/lenobit/podcasts/v4cnu6gmj7wzarts3vbu.mp3",
    mediaSrc:
      "https://res.cloudinary.com/deyfoah45/video/upload/v1735300946/lenobit/podcasts/v4cnu6gmj7wzarts3vbu.mp3",
    mediaType: "video",
    description:
      "This episode covers topics ranging from basic threading to advanced memory ordering and lock-free data structures.",
    duration: "15:25",
    date: "Dic 27, 2024",
  },
];

export default function PodcastPlayer() {
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode>(
    podcastEpisodes[0]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { favoritePodcasts, addFavoritePodcast, removeFavoritePodcast } =
    useFavoriteStore();
  const { user } = useSession();

  const isAdmin = user?.isAdmin ?? false;

  useEffect(() => {
    const mediaElement =
      currentEpisode.mediaType === "audio"
        ? audioRef.current
        : videoRef.current;
    if (mediaElement) {
      mediaElement.volume = volume;
      mediaElement.muted = isMuted;
    }
  }, [volume, isMuted, currentEpisode]);

  const togglePlay = () => {
    const mediaElement =
      currentEpisode.mediaType === "audio"
        ? audioRef.current
        : videoRef.current;
    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        mediaElement.play().catch((error) => {
          //REVIEW: Revisar mensaje de error desde  el back en el toast
          toast.error(`${error}`);
          /* toast({
            title: "Playback Error",
            description:
              "There was an error playing this episode. Please try again.",
            variant: "destructive",
          }); */
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgress = () => {
    const mediaElement =
      currentEpisode.mediaType === "audio"
        ? audioRef.current
        : videoRef.current;
    if (mediaElement) {
      const percent = (mediaElement.currentTime / mediaElement.duration) * 100;
      setProgress(percent);
      setDuration(mediaElement.duration);
    }
  };

  const seek = (percent: number) => {
    const mediaElement =
      currentEpisode.mediaType === "audio"
        ? audioRef.current
        : videoRef.current;
    if (mediaElement) {
      mediaElement.currentTime = (percent / 100) * mediaElement.duration;
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
    const text = `Listen to "${currentEpisode.title}" by ${currentEpisode.artist} on Lenobitech Podcasts!`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareOnLinkedin = () => {
    const text = `Listen to "${currentEpisode.title}" by ${currentEpisode.artist} on Lenobitech Podcasts!\n\n${currentEpisode.description}\n\nCheck it out at: ${window.location.href}`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const toggleFavorite = (episode: PodcastEpisode) => {
    const isFavorite = favoritePodcasts.some((p) => p.id === episode.id);
    if (isFavorite) {
      removeFavoritePodcast(episode.id);
    } else {
      addFavoritePodcast({ id: episode.id, title: episode.title });
    }
  };

  const changeEpisode = (direction: "next" | "previous") => {
    const currentIndex = podcastEpisodes.findIndex(
      (episode) => episode.id === currentEpisode.id
    );
    let newIndex: number;

    if (direction === "next") {
      newIndex = (currentIndex + 1) % podcastEpisodes.length;
    } else {
      newIndex =
        (currentIndex - 1 + podcastEpisodes.length) % podcastEpisodes.length;
    }

    setCurrentEpisode(podcastEpisodes[newIndex]);
    setIsPlaying(false);
    setProgress(0);
  };

  const handleUploadComplete = (data: PodcastUploadResponse) => {
    toast.success(`Podcast "${data.title}" subido exitosamente`);
    setIsUploadOpen(false);
    // TODO: In the future, this will add the new podcast to the list
    // For now, just show success and close the drawer
    console.log("Podcast uploaded:", {
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
    });
  };

  return (
    <div className="container mx-auto px-4 pt-12 pb-8">
      <h1 className="text-4xl text-center font-bold mb-4">
        Welcome to Leonobitech&apos;s Podcasts
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
        A podcast where we dive into the most exciting topics in technology, AI,
        neuroscience, entrepreneurship, and self-improvement. Get inspired, stay
        ahead, and unlock new possibilities every episode!
      </p>

      {/* Admin Upload Button */}
      {isAdmin && (
        <div className="flex justify-center mb-8">
          <Sheet open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <SheetTrigger asChild>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Podcast
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-white/10 text-white overflow-y-auto"
            >
              <SheetHeader className="mb-6">
                <SheetTitle className="text-white text-xl">
                  Subir Nuevo Podcast
                </SheetTitle>
                <SheetDescription className="text-white/60">
                  Sube un video y completa la información del episodio
                </SheetDescription>
              </SheetHeader>
              <VideoUploader
                onUploadComplete={handleUploadComplete}
                onCancel={() => setIsUploadOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Glassmorphic Hero Player */}
      <Card className={`max-w-xl mx-auto mb-12 border bg-gradient-to-br from-blue-900/40 via-slate-900/30 to-blue-950/40 backdrop-blur-2xl text-white overflow-hidden ring-2 transition-all duration-300 ${
        isPlaying
          ? "ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.3),0_0_45px_rgba(59,130,246,0.1)]"
          : "border-white/10 ring-white/10 shadow-2xl shadow-blue-500/20"
      }`}>
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col items-center gap-4">
            {/* Video/Audio Container - Vertical 9:16 format */}
            {currentEpisode.mediaType === "audio" ? (
              <div className={`w-full max-w-[320px] md:max-w-[280px] lg:max-w-[320px] aspect-[9/16] relative rounded-2xl overflow-hidden ring-2 transition-all duration-300 flex-shrink-0 ${
                isPlaying
                  ? "ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.3),0_0_45px_rgba(59,130,246,0.1)]"
                  : "ring-white/10"
              }`}>
                <Image
                  src={currentEpisode.cover || "/placeholder_001.png"}
                  alt={currentEpisode.title}
                  width={280}
                  height={498}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-16 h-16 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8 text-white" />
                    ) : (
                      <Play className="h-8 w-8 text-white" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile: Simple vertical video */}
                <div
                  className={`md:hidden w-full max-w-[320px] aspect-[9/16] relative rounded-2xl overflow-hidden ring-2 transition-all duration-300 flex-shrink-0 ${
                    isPlaying
                      ? "ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.3),0_0_45px_rgba(59,130,246,0.1)]"
                      : "ring-white/10"
                  }`}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <video
                    ref={videoRef}
                    src={currentEpisode.mediaSrc}
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
                  className={`hidden md:block w-full max-w-[560px] aspect-[3/4] relative rounded-lg overflow-hidden ring-2 transition-all duration-300 flex-shrink-0 ${
                    isPlaying
                      ? "ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.3),0_0_45px_rgba(59,130,246,0.1)]"
                      : "ring-white/10"
                  }`}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {/* Blurred background video */}
                  <video
                    src={currentEpisode.mediaSrc}
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
                      src={currentEpisode.mediaSrc}
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
              </>
            )}
            {/* Controls Section - Below Video */}
            <div className="w-full max-w-md">
              <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold">{currentEpisode.title}</h2>
                <p className="text-sm text-gray-300 mt-1">
                  By {currentEpisode.artist}
                </p>
                <div className="flex justify-center gap-2 mt-3 mb-6">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`bg-gradient-to-r from-blue-600 to-blue-900 hover:from-blue-600/90 hover:to-blue-900/80 text-white border-transparent transition-all duration-300 ease-in-out transform hover:scale-105 ${
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
                    className={`bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-600/70 hover:to-purple-600/70 text-white transition-all duration-300 ease-in-out transform hover:scale-105 ${
                      isPlaying
                        ? "shadow-[0_0_10px_rgba(219,39,119,0.5),0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_15px_rgba(219,39,119,0.6),0_0_25px_rgba(147,51,234,0.4)]"
                        : "shadow-md hover:shadow-lg"
                    }`}
                    onClick={shareOnTwitter}
                  >
                    Share on <Twitter className="w-4 h-4 ml-2" />
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
                <div className={`flex justify-between text-xs font-bold tracking-wider transition-all duration-300 ${
                  isPlaying
                    ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    : "text-white/60 opacity-60"
                }`}>
                  <span>{formatTime(duration * (progress / 100))}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-10 w-10 rounded-full border-2 transition-all duration-300 hover:scale-110 ${
                      isPlaying
                        ? "text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/15 border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.4),0_0_25px_rgba(59,130,246,0.2)]"
                        : "text-white/60 hover:text-white/80 bg-white/5 hover:bg-white/10 border-white/10"
                    }`}
                    onClick={() => changeEpisode("previous")}
                    aria-label="Previous episode"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-10 w-10 rounded-full border-2 transition-all duration-300 hover:scale-110 ${
                      isPlaying
                        ? "text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/15 border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.4),0_0_25px_rgba(59,130,246,0.2)]"
                        : "text-white/60 hover:text-white/80 bg-white/5 hover:bg-white/10 border-white/10"
                    }`}
                    onClick={() => changeEpisode("next")}
                    aria-label="Next episode"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  <div className="w-px h-8 bg-white/20 mx-6" />
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 rounded-full border-2 transition-all duration-300 hover:scale-110 ${
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
      {/* Episodes Grid */}
      <div className="grid gap-4 grid-cols-1 max-w-xl mx-auto">
        {podcastEpisodes.map((episode) => (
          <Card
            key={episode.id}
            className={`group cursor-pointer transition-all duration-500 hover:scale-[1.02] border ring-2 will-change-transform
                ${
                  currentEpisode.id === episode.id && isPlaying
                    ? "bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-blue-600/30 border-blue-400/50 ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.3),0_0_45px_rgba(59,130,246,0.1)]"
                    : currentEpisode.id === episode.id
                    ? "bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-blue-600/30 border-blue-400/50 ring-white/10 shadow-blue-500/30"
                    : "border-white/5 ring-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:ring-white/10 hover:shadow-blue-500/10 shadow-xl"
                }`}
            style={{ transform: 'translateZ(0)' }}
            onClick={() => setCurrentEpisode(episode)}
          >
            <CardContent className="px-5 md:py-6 py-6 flex items-center justify-between space-x-4 [backdrop-filter:none]">
              <div className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden ring-2 transition-all duration-300 ${
                currentEpisode.id === episode.id && isPlaying
                  ? "ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.3),0_0_45px_rgba(59,130,246,0.1)] animate-pulse"
                  : "ring-white/10 group-hover:ring-blue-400/50"
              }`}>
                <Image
                  src={episode.cover || "/placeholder_001.png"}
                  alt={episode.title}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex-grow min-w-0 space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-white line-clamp-1 group-hover:text-blue-200 transition-colors duration-300">
                  {episode.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 line-clamp-1 group-hover:text-gray-300 transition-colors duration-300">
                  {episode.description}
                </p>
                <div className="flex items-center text-xs text-gray-500 group-hover:text-cyan-300 transition-colors duration-300">
                  <span>{episode.date}</span>
                  <span className="mx-2">•</span>
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{formatDuration(episode.duration)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 self-center">
                <Button
                  size="icon"
                  variant="ghost"
                  className={`w-10 h-10 sm:w-12 sm:h-12 border-2 rounded-full transition-all duration-300 hover:scale-110 ${
                    currentEpisode.id === episode.id && isPlaying
                      ? "text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/15 border-blue-400 hover:border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4),0_0_25px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5),0_0_35px_rgba(59,130,246,0.3)]"
                      : "text-white/60 hover:text-white/80 bg-white/5 hover:bg-white/10 border-white/10"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentEpisode.id === episode.id) {
                      togglePlay();
                    } else {
                      setCurrentEpisode(episode);
                      if (!isPlaying) togglePlay();
                    }
                  }}
                  aria-label={`${
                    currentEpisode.id === episode.id && isPlaying
                      ? "Pause"
                      : "Play"
                  } ${episode.title}`}
                >
                  {currentEpisode.id === episode.id && isPlaying ? (
                    <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 ml-0.5" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-pink-400 transition-all duration-300 transform hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(episode);
                  }}
                  aria-label={
                    favoritePodcasts.some((p) => p.id === episode.id)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  <Heart
                    className={`h-5 w-5 transition-all duration-300 ${
                      favoritePodcasts.some((p) => p.id === episode.id)
                        ? "fill-current text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]"
                        : ""
                    }`}
                  />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <audio
        ref={audioRef}
        src={
          currentEpisode.mediaType === "audio"
            ? currentEpisode.mediaSrc
            : undefined
        }
        onTimeUpdate={
          currentEpisode.mediaType === "audio" ? handleProgress : undefined
        }
        onLoadedMetadata={
          currentEpisode.mediaType === "audio" ? handleProgress : undefined
        }
      />
    </div>
  );
}
