"use client";

import { Button } from "@/components/ui/button";
import { Share2, Github, Linkedin } from "lucide-react";

interface ShareButtonsProps {
  postId: string;
  postTitle?: string;
}

export function ShareButtons({ postId }: ShareButtonsProps) {
  const handleCopyLink = () => {
    const url = `https://leonobitech.com/blog/${postId}`;
    navigator.clipboard.writeText(url);

    // Optional: Show a toast notification
    console.log("Link copied to clipboard!");
  };

  return (
    <div className="flex items-center gap-4 border-t border-border/50 pt-6">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>
      <Button variant="outline" size="sm" asChild>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://leonobitech.com/blog/${postId}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Linkedin className="mr-2 h-4 w-4" />
          LinkedIn
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a
          href="https://github.com/leonobitech"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopyLink}>
        <Share2 className="mr-2 h-4 w-4" />
        Copy Link
      </Button>
    </div>
  );
}
