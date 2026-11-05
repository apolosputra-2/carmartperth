
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ExternalLink,
} from "lucide-react";

import {
  googleReviews,
  googleReviewSummary,
} from "../src/data/google-reviews";

const TRANSITION_MS = 550;

export default function GoogleReviewsSection() {
  const total = googleReviews.length;

  // Three copies allow seamless movement in either direction.
  const reviews = [
    ...googleReviews,
    ...googleReviews,
    ...googleReviews,
  ];

  const [position, setPosition] = useState(total);
  const [animated, setAnimated] = useState(true);
  const [moving, setMoving] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [cardWidth, setCardWidth] = useState(0);
  const [gap, setGap] = useState(24);

  useEffect(() => {
    const update = () => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const count = window.innerWidth >= 768 ? 3 : 1;
      const cardGap = 24;

      setVisibleCount(count);
      setGap(cardGap);
      setCardWidth(
        (viewport.clientWidth - cardGap * (count - 1)) /
          count
      );
    };

    update();

    const observer = new ResizeObserver(update);

    if (viewportRef.current) {
      observer.observe(viewportRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Restore position silently after entering outer copies.
  const handleTransitionEnd = () => {
    setMoving(false);

    if (total === 0) return;

    if (position >= total * 2 || position < total) {
      const normalized =
        ((position - total) % total + total) % total;

      setAnimated(false);
      setPosition(total + normalized);
    }
  };

  // Re-enable CSS transitions after a silent reset.
  useEffect(() => {
    if (!animated) {
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimated(true);
        });
      });

      return () => cancelAnimationFrame(frame);
    }
  }, [animated]);

  const slide = (direction: number) => {
    if (moving || total <= 1) return;

    setMoving(true);
    setAnimated(true);
    setPosition((current) => current + direction);
  };

  const { rating, totalReviews, googleUrl } =
    googleReviewSummary;

  const activeIndex =
    total > 0 ? ((position - total) % total + total) % total : 0;

  return (
    <section className="border-t border-white/10 bg-[#0a0b0f] px-6 py-20 text-white lg:py-24">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
            GOOGLE REVIEWS
          </p>

          <h2 className="mx-auto mt-5 max-w-[900px] font-['Montserrat'] text-[clamp(25px,2.6vw,42px)] font-black italic uppercase leading-[1.15] tracking-[-0.035em]">
            PERTH&apos;S PREMIER DESTINATION FOR
            <br className="hidden md:block" />
            {" "}CAR SALES{" "}
            <span className="inline-block bg-gradient-to-r from-[#f00085] to-[#c149a8] bg-clip-text pr-3 text-transparent">
              CARMART PERTH
            </span>
          </h2>

          <p className="mt-5 font-[Inter] text-[15px] leading-7 text-gray-300 sm:text-[17px]">
            Real stories from customers who found the right car
            with Carmart Perth.
          </p>

          {rating !== null && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="font-mono text-xl font-bold">
                {rating.toFixed(1)}
              </span>

              <div
                className="flex gap-1 text-[#fbbc04]"
                aria-label={`${rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={
                      i < Math.round(rating)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>

              {totalReviews !== null && (
                <span className="font-mono text-xs text-gray-400">
                  Based on {totalReviews} Google reviews
                </span>
              )}
            </div>
          )}
        </div>

        {/* Continuous slider */}
        {total > 0 ? (
          <>
            <div
              ref={viewportRef}
              className="overflow-hidden"
            >
              <div
                ref={trackRef}
                onTransitionEnd={handleTransitionEnd}
                className="flex"
                style={{
                  gap: `${gap}px`,
                  transform: `translate3d(-${
                    position * (cardWidth + gap)
                  }px, 0, 0)`,
                  transition: animated
                    ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                    : "none",
                  willChange: "transform",
                }}
              >
                {reviews.map((review, index) => (
                  <article
                    key={`${review.id}-${index}`}
                    className="flex min-h-[350px] shrink-0 flex-col rounded-2xl border border-gray-200 bg-white p-6 text-[#20242c] shadow-lg"
                    style={{
                      width: `${cardWidth}px`,
                    }}
                  >
                    {/* Reviewer */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e9f5fc] text-[#148ab8]">
                        <span className="font-[Inter] text-lg font-bold">
                          {review.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-[Inter] text-sm font-bold">
                          {review.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {review.date}
                        </p>
                      </div>

                      <span
                        aria-label="Google"
                        className="font-[Inter] text-lg font-bold text-[#4285F4]"
                      >
                        G
                      </span>
                    </div>

                    {/* Stars */}
                    <div
                      className="mt-6 flex gap-1 text-[#fbbc04]"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }).map((_, star) => (
                        <Star
                          key={star}
                          size={17}
                          fill={
                            star < review.rating
                              ? "currentColor"
                              : "none"
                          }
                        />
                      ))}
                    </div>

                    {/* Review text */}
                    <p className="mt-6 flex-1 whitespace-pre-line font-[Inter] text-sm leading-7 text-gray-700">
                      {review.text}
                    </p>

                    {/* Footer */}
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      {googleUrl ? (
                        <a
                          href={googleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-medium text-[#4285F4] hover:underline"
                        >
                          View on Google
                          <ExternalLink size={13} />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">
                          Google review
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Navigation */}
            {total > 1 && (
              <div className="mt-9 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => slide(-1)}
                  disabled={moving}
                  aria-label="Previous reviews"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-40"
                >
                  <ChevronLeft size={19} />
                </button>

                <span className="font-mono text-xs text-gray-400">
                  {activeIndex + 1} / {total}
                </span>

                <button
                  type="button"
                  onClick={() => slide(1)}
                  disabled={moving}
                  aria-label="Next reviews"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-40"
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-gray-400">
            Customer reviews will appear here soon.
          </div>
        )}

        {/* Google CTA */}
        {googleUrl && (
          <div className="mt-10 text-center">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-400 px-6 py-3 font-[Inter] text-sm font-semibold text-cyan-400 transition hover:bg-cyan-400 hover:text-black"
            >
              Read All Reviews on Google
              <ExternalLink size={16} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
