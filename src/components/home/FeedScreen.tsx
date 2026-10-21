"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { TOP_BAR_BOTTOM } from "./HomeStage";
import { FEED, STORIES, type Poll, type Post, type StoryRing } from "./feedData";

const EASE = [0.22, 1, 0.36, 1] as const;
const GREEN = "#01A17F";
const INK = "#2C2C2C";
const MUTED = "#818185";

/** Room under the feed for the shared bottom nav: 60px nav + its 38px margin
 * and some air. */
const NAV_CLEARANCE = 60 + 38 + 24;

const CARD = "w-full rounded-[18px] border-[1.5px] border-black/10 bg-white p-3.5";

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

function Story({ story }: { story: StoryRing }) {
  return (
    <button type="button" className="flex shrink-0 flex-col items-center gap-1">
      <span
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 bg-white text-lg font-extrabold"
        style={{ borderColor: story.color, color: INK }}
      >
        {story.letter}
      </span>
      <span className="text-[11px] font-semibold" style={{ color: MUTED }}>
        {story.name}
      </span>
    </button>
  );
}

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const { media } = post;
  return (
    <article className={`${CARD} flex flex-col gap-2.5`}>
      <header className="flex items-center gap-2.5">
        <span className="h-[34px] w-[34px] shrink-0 rounded-full" style={{ backgroundColor: post.avatar }} />
        <h3 className="truncate text-base font-extrabold leading-[22px]" style={{ color: INK }}>
          {post.author}
        </h3>
      </header>

      <div
        className="flex h-[120px] w-full items-center justify-center rounded-xl"
        style={{ backgroundColor: media.tint }}
      >
        {media.kind === "video" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/images/feed/video.png" alt="" draggable={false} className="h-10 w-10 select-none" />
        ) : (
          <media.Icon className="h-10 w-10" style={{ color: media.color }} strokeWidth={2} />
        )}
      </div>

      <p className="text-sm font-semibold leading-5 text-[#444444]">{post.caption}</p>

      <footer className="flex items-center gap-4 text-xs" style={{ color: MUTED }}>
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          className="flex items-center gap-1 transition-transform active:scale-90"
        >
          <Heart
            className="h-[18px] w-[18px] transition-colors duration-200"
            strokeWidth={1.6}
            style={liked ? { color: "#EF4444", fill: "#EF4444" } : undefined}
          />
          {post.likes}
          {liked && <span className="sr-only">(you liked this)</span>}
        </button>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.6} />
          {post.comments}
        </span>
        <Share2 className="h-[18px] w-[18px]" strokeWidth={1.6} />
      </footer>
    </article>
  );
}

/** A radio-style circle with a dot in it: the mark on the option you picked. */
function CircleDot() {
  return (
    <span
      className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
      style={{ borderColor: GREEN }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GREEN }} />
    </span>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  // Everyone's votes so far, plus the learner's own once cast.
  const counts = poll.options.map((o, i) => o.votes + (i === picked ? 1 : 0));
  const total = counts.reduce((sum, n) => sum + n, 0);

  return (
    <article className={`${CARD} flex flex-col gap-2`}>
      <h3 className="text-base font-extrabold leading-[22px]" style={{ color: INK }}>
        {poll.question}
      </h3>
      {poll.options.map((option, i) => {
        const percent = Math.round((counts[i] / total) * 100);
        const isPicked = picked === i;
        return (
          <button
            key={option.label}
            type="button"
            disabled={answered}
            onClick={() => setPicked(i)}
            aria-pressed={isPicked}
            className={`relative flex min-h-10 w-full items-center gap-2 overflow-hidden rounded-xl border-[1.5px] bg-[#F7F8FA] px-3 py-2.5 text-left transition-colors duration-300 ${
              isPicked ? "border-[#01A17F]" : "border-transparent"
            } ${answered ? "" : "active:scale-[0.99]"}`}
          >
            {answered && (
              <motion.span
                aria-hidden
                className="absolute inset-y-0 left-0"
                style={{ backgroundColor: isPicked ? "#CDEBE2" : "#E9ECF0" }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            )}
            {isPicked && (
              <motion.span
                className="relative"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <CircleDot />
              </motion.span>
            )}
            <span className="relative min-w-0 flex-1 text-sm font-semibold leading-5" style={{ color: INK }}>
              {option.label}
            </span>
            {answered && (
              <motion.span
                className="relative text-sm font-extrabold"
                style={{ color: isPicked ? GREEN : MUTED }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {percent}%
              </motion.span>
            )}
          </button>
        );
      })}
      {answered && (
        <p className="text-xs" style={{ color: MUTED }}>
          {total.toLocaleString("en-IN")} votes
        </p>
      )}
    </article>
  );
}

/**
 * The feed tab: the learner's stats, the stories row and a scrolling list of
 * posts and polls, above the same bottom nav the other tabs share.
 */
export function FeedScreen() {
  return (
    <main
      style={{ top: TOP_BAR_BOTTOM }}
      className={`font-[family-name:var(--font-app-poppins)] scrollbar-none absolute inset-x-0 bottom-0 overflow-y-auto overflow-x-hidden bg-white text-[#2C2C2C]`}
    >
      <div
        className="mx-auto w-full max-w-[430px] px-4 pt-1"
        style={{ paddingBottom: NAV_CLEARANCE }}
      >
        <motion.h1 {...reveal(0.05)} className="text-2xl font-extrabold leading-tight">
          Feed
        </motion.h1>

        <motion.div {...reveal(0.1)} className="scrollbar-none -mx-4 mt-3 flex gap-3.5 overflow-x-auto px-4">
          {STORIES.map((story) => (
            <Story key={story.id} story={story} />
          ))}
        </motion.div>

        <div className="mt-4 flex flex-col gap-3">
          {FEED.map((item, i) => (
            <motion.div key={item.id} {...reveal(0.15 + Math.min(i, 3) * 0.05)}>
              {item.type === "post" ? <PostCard post={item} /> : <PollCard poll={item} />}
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
