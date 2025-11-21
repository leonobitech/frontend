import React from "react";
import Link from "next/link";
import { Twitter, Instagram, Github, Youtube } from "lucide-react";
import clsx from "clsx";
import { useSession } from "@/app/context/SessionContext";

type Props = {
  className?: string;
};

export const UserSocialMedia: React.FC<Props> = ({ className }) => {
  const { user } = useSession();

  const socialLinks = [
    {
      icon: Twitter,
      href: user?.socialTwitter,
      label: "Twitter profile",
    },
    {
      icon: Instagram,
      href: user?.socialInstagram,
      label: "Instagram profile",
    },
    {
      icon: Youtube,
      href: user?.socialYoutube,
      label: "YouTube profile",
    },
    {
      icon: Github,
      href: user?.socialGithub,
      label: "GitHub profile",
    },
  ].filter((social) => social.href); // Only show links that have a URL

  if (socialLinks.length === 0) {
    return null; // Don't render anything if there are no social links
  }

  return (
    <div className={clsx("flex flex-col items-end space-y-2", className)}>
      {socialLinks.map((social, index) => (
        <Link
          key={index}
          href={social.href!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          className="group relative p-2 rounded-full bg-gradient-to-r from-indigo-950 to-blue-500 dark:from-purple-700 dark:to-pink-500 transition-all duration-300 ease-out hover:shadow-lg hover:scale-110"
        >
          <social.icon className="h-4 w-4 text-white transition-transform duration-300 ease-out group-hover:-translate-y-1" />
        </Link>
      ))}
    </div>
  );
};
