"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
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
} from "lucide-react";
import { useFavoriteStore } from "@/lib/store";
import { toast } from "sonner";

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

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { favoritePodcasts, addFavoritePodcast, removeFavoritePodcast } =
    useFavoriteStore();

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl text-center font-bold mb-4">
        Welcome to Leonobitech&apos;s Podcasts
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
        A podcast where we dive into the most exciting topics in technology, AI,
        neuroscience, entrepreneurship, and self-improvement. Get inspired, stay
        ahead, and unlock new possibilities every episode!
      </p>
      <Card className=" max-w-4xl mx-auto bg-gradient-to-br from-blue-800 to-black dark:bg-gradient-to-br dark:from-blue-600/20 dark:to-blue-950/10  border-hidden text-white shadow-xl mb-8">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {currentEpisode.mediaType === "audio" ? (
              <div className="w-full lg:w-64 h-64 relative">
                <Image
                  src={currentEpisode.cover || "/placeholder_001.png"}
                  alt={currentEpisode.title}
                  width={100}
                  height={300}
                  className="w-full h-full object-cover rounded-lg shadow-lg"
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
              <div
                className="w-full lg:w-1/2 aspect-video relative rounded-lg overflow-hidden shadow-lg"
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
            )}
            <div className="flex-1 w-full space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{currentEpisode.title}</h2>
                <p className="text-sm text-gray-300">
                  By {currentEpisode.artist}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-gradient-to-r from-blue-600 to-blue-900 hover:from-blue-600/90 hover:to-blue-900/80 text-white border-transparent transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
                    onClick={shareOnLinkedin}
                  >
                    Share on <Linkedin className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-600/70 hover:to-purple-600/70 text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
                    onClick={shareOnTwitter}
                  >
                    Share on <Twitter className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Slider
                  value={[progress]}
                  max={100}
                  step={0.1}
                  onValueChange={(value) => seek(value[0])}
                  className="text-white shadow-md"
                  aria-label="Seek"
                />
                <div className="flex justify-between text-sm">
                  <span>{formatTime(duration * (progress / 100))}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white"
                    onClick={() => changeEpisode("previous")}
                    aria-label="Previous episode"
                  >
                    <SkipBack className="h-6 w-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white"
                    onClick={() => changeEpisode("next")}
                    aria-label="Next episode"
                  >
                    <SkipForward className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-6 w-6" />
                    ) : (
                      <Volume2 className="h-6 w-6" />
                    )}
                  </Button>
                  <Slider
                    value={[volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                    className="w-24"
                    aria-label="Volume"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {podcastEpisodes.map((episode) => (
          <Card
            key={episode.id}
            className={`cursor-pointer transition-all duration-300 hover:bg-accent/10 custom-shadow border-hidden ${
              currentEpisode.id === episode.id ? "bg-accent/20" : ""
            }`}
            onClick={() => setCurrentEpisode(episode)}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={episode.cover || "/placeholder_001.png"}
                  alt={episode.title}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover rounded-md"
                />
                {currentEpisode.id === episode.id && isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-semibold text-sm sm:text-base line-clamp-1">
                  {episode.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                  {episode.description}
                </p>
                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                  <span>{episode.date}</span>
                  <span className="mx-2">•</span>
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{formatDuration(episode.duration)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                    currentEpisode.id === episode.id && isPlaying
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-white/10 hover:bg-white/20"
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
                    <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary w-8 h-8 sm:w-10 sm:h-10"
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
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      favoritePodcasts.some((p) => p.id === episode.id)
                        ? "fill-current text-red-500"
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
