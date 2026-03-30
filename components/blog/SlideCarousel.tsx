"use client";

import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlideData {
  type: "cover" | "content" | "cta";
  title: string;
  subtitle?: string;
  body?: string;
  items?: { emoji: string; text: string }[];
  pillars?: { emoji: string; label: string }[];
  platforms?: { emoji: string; name: string; desc: string }[];
  coffeeTip?: string;
  question?: string;
  cta?: string;
}

interface SlideCarouselProps {
  slides: SlideData[];
  episode: string;
}

export function SlideCarousel({ slides, episode }: SlideCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const bgColors = [
    "#2B2B2B",
    "#333333",
    "#2B2B2B",
    "#3A3A3A",
    "#2B2B2B",
    "#333333",
    "#2B2B2B",
  ];

  return (
    <section aria-label="Episode slides" className="mx-auto w-full max-w-[600px]">
      {/* Carousel with external arrows on desktop */}
      <div className="relative flex items-center gap-3 sm:gap-4">
        {/* Left arrow — hidden on mobile */}
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className={cn(
            "hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3A3A3A] text-[#a8a29e] transition-all",
            canScrollPrev ? "opacity-100 hover:bg-[#4A4A4A] hover:text-[#D1D5DB]" : "opacity-20 pointer-events-none"
          )}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Slides */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-lg" ref={emblaRef}>
          <div className="flex">
            {slides.map((slide, i) => (
              <article
                key={i}
                className="min-w-0 flex-[0_0_100%]"
                style={{ aspectRatio: "1080/1350" }}
              >
                <div
                  className="flex h-full w-full flex-col justify-center p-6 sm:p-10"
                  style={{ backgroundColor: bgColors[i] || "#2B2B2B" }}
                >
                  {/* Header */}
                  <div className="mb-auto flex items-center justify-between pt-2">
                    <span className="text-[10px] sm:text-xs font-medium text-[#a8a29e]">
                      Knowing Claude over Coffee ☕
                    </span>
                    <span className="rounded-full bg-[#f59e0b] px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#2b2b2b]">
                      {episode}
                    </span>
                  </div>

                  {/* Slide content */}
                  <div className="my-auto">
                    {slide.type === "cover" && (
                      <CoverSlide title={slide.title} subtitle={slide.subtitle} />
                    )}
                    {slide.type === "content" && (
                      <ContentSlide slide={slide} />
                    )}
                    {slide.type === "cta" && (
                      <CtaSlide slide={slide} />
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex flex-col items-center gap-2 pb-1">
                    <div className="h-[2px] w-20 rounded-full bg-gradient-to-r from-[#E91E63] to-[#9B5DE5]" />
                    <span className="text-[10px] font-medium tracking-widest text-[#a8a29e]">
                      leonobitech.com
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right arrow — hidden on mobile */}
        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className={cn(
            "hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3A3A3A] text-[#a8a29e] transition-all",
            canScrollNext ? "opacity-100 hover:bg-[#4A4A4A] hover:text-[#D1D5DB]" : "opacity-20 pointer-events-none"
          )}
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Controls: arrows (mobile) + dots + counter */}
      <div className="mt-4 flex items-center justify-center gap-3">
        {/* Mobile prev */}
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className={cn(
            "sm:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3A3A3A] text-[#a8a29e] transition-all",
            canScrollPrev ? "opacity-100" : "opacity-20 pointer-events-none"
          )}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === selectedIndex
                  ? "w-6 bg-[#E91E63]"
                  : "w-2 bg-[#a8a29e]/30 hover:bg-[#a8a29e]/50"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Mobile next */}
        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className={cn(
            "sm:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3A3A3A] text-[#a8a29e] transition-all",
            canScrollNext ? "opacity-100" : "opacity-20 pointer-events-none"
          )}
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-[#a8a29e]">
        {selectedIndex + 1} / {slides.length}
      </p>
    </section>
  );
}

function CoverSlide({ title, subtitle }: { title: string; subtitle?: string }) {
  // Split title to highlight "Claude" in accent color
  const parts = title.split(/(Claude)/);
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-3xl font-black leading-tight text-[#f5f5f5] sm:text-4xl">
        {parts.map((part, i) =>
          part === "Claude" ? (
            <span key={i} className="text-[#E91E63]">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </h2>
      {subtitle && (
        <p className="text-sm text-[#d1d5db] sm:text-base">{subtitle}</p>
      )}
    </div>
  );
}

function ContentSlide({ slide }: { slide: SlideData }) {
  // Split title to highlight text after last period or specific words
  const titleParts = slide.title.split(/(\*\*.*?\*\*)/);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-black leading-snug text-[#f5f5f5] sm:text-2xl">
        {titleParts.map((part, i) =>
          part.startsWith("**") ? (
            <span key={i} className="text-[#E91E63]">
              {part.replace(/\*\*/g, "")}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </h2>

      {slide.body && (
        <p className="text-xs leading-relaxed text-[#d1d5db] sm:text-sm">
          {slide.body}
        </p>
      )}

      {/* Item grid */}
      {slide.items && (
        <div className="grid grid-cols-2 gap-2">
          {slide.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-[#2B2B2B] p-3"
            >
              <span className="text-base">{item.emoji}</span>
              <span className="text-xs font-medium text-[#d1d5db]">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pillars */}
      {slide.pillars && (
        <div className="flex gap-3">
          {slide.pillars.map((p, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-[#3A3A3A] p-3"
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="text-xs font-bold text-[#f5f5f5]">
                {p.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Platforms */}
      {slide.platforms && (
        <div className="flex flex-col gap-2">
          {slide.platforms.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg bg-[#2B2B2B] p-3"
            >
              <span className="text-lg">{p.emoji}</span>
              <div>
                <span className="text-sm font-bold text-[#f5f5f5]">
                  {p.name}
                </span>
                <span className="ml-2 text-xs text-[#a8a29e]">{p.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coffee Tip */}
      {slide.coffeeTip && (
        <div className="flex gap-3 rounded-xl bg-[#f5e6d3] p-4">
          <span className="text-lg">☕</span>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5c4033]">
              Coffee Tip
            </span>
            <p className="mt-1 text-xs font-medium leading-relaxed text-[#3a3a3a]">
              {slide.coffeeTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CtaSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <h2 className="text-xl font-bold text-[#f5f5f5]">{slide.title}</h2>
      {slide.question && (
        <p className="text-lg font-black leading-snug text-[#E91E63] sm:text-xl">
          {slide.question}
        </p>
      )}
      {slide.body && (
        <p className="text-sm text-[#d1d5db]">{slide.body}</p>
      )}
      {slide.cta && (
        <p className="text-base font-semibold text-[#f5f5f5]">
          {slide.cta} 👇
        </p>
      )}
    </div>
  );
}
