"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Clock } from "lucide-react";

export interface Restaurant {
  name: string;
  rating: number;
  reviews: number;
  cuisine: string;
  price: string;
  address: string;
  hours: string;
  image: string;
  maps_url: string;
}

interface RestaurantCardsProps {
  restaurants: Restaurant[];
}

export function RestaurantCards({ restaurants }: RestaurantCardsProps) {
  const r = restaurants[0];
  if (!r) return null;

  return (
    <motion.a
      href={r.maps_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="block ml-12 mr-3 max-w-[320px] rounded-xl border border-white/10 bg-[#1a1a1a]/95 backdrop-blur-xl overflow-hidden shadow-lg transition-all hover:border-white/20 hover:shadow-xl"
    >
      {/* Image placeholder */}
      <div className="h-[100px] bg-[#2a2a2a] flex items-center justify-center">
        <span className="text-xs text-white/20">{r.cuisine}</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-semibold text-white">{r.name}</h3>

        {/* Rating + price */}
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-white">{r.rating}</span>
          <span className="text-xs text-white/30">
            ({r.reviews.toLocaleString()})
          </span>
          <span className="ml-auto text-xs text-white/40">{r.price}</span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5">
          <MapPin className="h-3 w-3 text-white/30 mt-0.5 shrink-0" />
          <span className="text-xs text-white/40">{r.address}</span>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-white/30 shrink-0" />
          <span className="text-xs text-white/40">{r.hours}</span>
        </div>
      </div>
    </motion.a>
  );
}
