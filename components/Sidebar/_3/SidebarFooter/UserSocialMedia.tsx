import React from "react";
import Link from "next/link";
import { Twitter, Instagram, Github, Youtube } from "lucide-react";
import clsx from "clsx";

type Props = {
  className?: string;
};

const socialLinks = [
  {
    icon: Twitter,
    href: "https://x.com/leonobitech",
    label: "Twitter profile",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/leonobitech/",
    label: "Instagram profile",
  },
  {
    icon: Youtube,
    href: "https://www.youtube.com/@leonobitech",
    label: "YouTube profile",
  },
  {
    icon: Github,
    href: "https://github.com/leonobitech",
    label: "GitHub profile",
  },
];

export const UserSocialMedia: React.FC<Props> = ({ className }) => {
  return (
    <div className={clsx("flex flex-col items-end space-y-2", className)}>
      {socialLinks.map((social, index) => (
        <Link
          key={index}
          href={social.href}
          aria-label={social.label}
          className="group relative p-2 rounded-full bg-gradient-to-r from-indigo-950 to-blue-500 dark:from-purple-700 dark:to-pink-500 transition-all duration-300 ease-out hover:shadow-lg hover:scale-110"
        >
          <social.icon className="h-4 w-4 text-white transition-transform duration-300 ease-out group-hover:-translate-y-1" />
        </Link>
      ))}
    </div>
  );
};
