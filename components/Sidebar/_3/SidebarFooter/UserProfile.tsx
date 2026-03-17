import React from "react";
import { MapPin, LinkIcon } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/app/context/SessionContext";

export function UserProfile() {
  const { user } = useSession();

  return (
    <div className="pt-8 px-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-[#D1D5DB]">
            {user?.name || "User"}
          </h3>
          <p className="text-sm text-gray-400">
            {user?.email || "No email"}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-300 mb-2 w-3/4">
        {user?.bio || "No bio available"}
      </p>
      {user?.location && (
        <div className="flex items-center text-sm text-gray-400 mb-2">
          <MapPin className="h-4 w-4 mr-1 shrink-0" />
          {user.location}
        </div>
      )}
      {user?.website && (
        <div className="flex items-center text-sm text-gray-400 mb-2">
          <LinkIcon className="h-4 w-4 mr-1 shrink-0" />
          <Link
            href={user.website}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline truncate"
          >
            {user.website.replace(/^https?:\/\//, "")}
          </Link>
        </div>
      )}
    </div>
  );
}
