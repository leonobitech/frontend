"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Clock, X } from "lucide-react";

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
  onClose: () => void;
}

export function RestaurantCards({ restaurants, onClose }: RestaurantCardsProps) {
  if (!restaurants.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="ml-12 mr-3"
    >
      <div className="relative rounded-2xl border border-white/10 bg-[#1a1a1a]/95 backdrop-blur-xl p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">
            Resultados
          </span>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cards scroll */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          <AnimatePresence>
            {restaurants.map((r, i) => (
              <motion.a
                key={r.name}
                href={r.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.12 }}
                className="group flex-shrink-0 w-[220px] rounded-xl border border-white/5 bg-[#252525] overflow-hidden transition-all hover:border-white/15 hover:shadow-lg"
              >
                {/* Image */}
                <div className="relative h-[120px] overflow-hidden bg-[#333]">
                  <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
                    {r.cuisine}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-1.5">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {r.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium text-white">
                        {r.rating}
                      </span>
                    </div>
                    <span className="text-xs text-white/30">
                      ({r.reviews.toLocaleString()})
                    </span>
                    <span className="ml-auto text-xs text-white/40">
                      {r.price}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3 w-3 text-white/30 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/40 line-clamp-1">
                      {r.address}
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-white/30 shrink-0" />
                    <span className="text-xs text-white/40">{r.hours}</span>
                  </div>
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
