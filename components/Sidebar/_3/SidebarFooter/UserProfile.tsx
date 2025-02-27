import React from "react";
import { MapPin, LinkIcon } from "lucide-react";
import Link from "next/link";

export function UserProfile() {
  return (
    <div className="pt-8 px-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Felix Figueroa
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Leonobitech@gmail.com
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 w-3/4">
        Passionate developer, coffee enthusiast, and avid traveler.
      </p>
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
        Remote
      </div>
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
        <LinkIcon className="h-4 w-4 mr-1 flex-shrink-0" />
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline truncate"
        >
          leonobitech.com
        </Link>
      </div>
    </div>
  );
}
