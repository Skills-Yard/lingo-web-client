"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, ChartNoAxesColumn, Heart, MessageCircle, Plus, Share2 } from "lucide-react";
import { TOP_MARGIN } from "./HomeStage";
import { FEED, STORIES, type Poll, type Post, type StoryRing } from "./feedData";

const EASE = [0.22, 1, 0.36, 1] as const;
const GREEN = "#01A17F";
const INK = "var(--h-ink)";
const MUTED = "var(--h-muted)";

/** Room under the feed for the shared bottom nav: 60px nav + its 38px margin
 * and some air. */
const NAV_CLEARANCE = 60 + 38 + 24;

const CARD = "w-full rounded-2xl border border-black/10 bg-white p-3 dark:border-white/12 dark:bg-[#1A1C22]";

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

function Story({ story }: { story: StoryRing }) {
  return (
    <button type="button" className="relative flex shrink-0 flex-col items-center gap-1.5">
      <span
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-[2.5px] bg-white text-lg font-semibold dark:bg-[#1A1C22]"
        style={{ borderColor: story.color, color: INK }}
      >
        {story.letter}
      </span>
      {story.id === "you" && (
        <span className="absolute right-0 top-9 h-3 w-3 rounded-full border-2 border-white bg-[#01A17F] dark:border-[#0F1F26]" />
      )}
      <span className="text-xs font-medium leading-4 text-[#444444] dark:text-[#C8C7C5]">{story.name}</span>
    </button>
  );
}

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const { media } = post;
  return (
    <article className={`${CARD} flex flex-col gap-3`}>
      <header className="flex items-center gap-2.5">
        <span className="h-8 w-8 shrink-0 rounded-full" style={{ backgroundColor: post.avatar }} />
        <h3 className="truncate text-base font-medium leading-6 text-[#2C2C2C] dark:text-white">
          {post.author}
        </h3>
      </header>

      {media.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.src} alt="" draggable={false} className="aspect-[2/1] w-full select-none rounded-xl object-cover" />
      ) : (
        <div className="flex h-[120px] w-full items-center justify-center rounded-xl" style={{ backgroundColor: media.tint }}>
          {media.kind === "video" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/images/feed/video.png" alt="" draggable={false} className="h-10 w-10 select-none" />
          ) : (
            <media.Icon className="h-10 w-10" style={{ color: media.color }} strokeWidth={2} />
          )}
        </div>
      )}

      <p className="text-base font-semibold leading-[22px] text-[#2C2C2C] dark:text-white">{post.caption}</p>

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
    <article className={`${CARD} flex flex-col gap-2.5`}>
      <span className="flex w-fit items-center gap-1 rounded-lg bg-[#E8F8F4] px-2 py-1 text-xs font-medium leading-4 text-[#007A70] dark:bg-[#133A35] dark:text-[#00B8A9]">
        <ChartNoAxesColumn className="h-3.5 w-3.5" strokeWidth={2.2} />
        Quick poll
      </span>
      <h3 className="text-base font-semibold leading-[22px] text-[#2C2C2C] dark:text-white">
        {poll.question.replace("Quick poll · ", "")}
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
            className={`relative flex min-h-10 w-full items-center gap-2 overflow-hidden rounded-xl border-[1.5px] bg-[#F7F8FA] dark:bg-[#16262D] px-3 py-2.5 text-left transition-colors duration-300 ${
              isPicked ? "border-[#01A17F]" : "border-transparent"
            } ${answered ? "" : "active:scale-[0.99]"}`}
          >
            {answered && (
              <motion.span
                aria-hidden
                className="absolute inset-y-0 left-0"
                style={{ backgroundColor: isPicked ? "var(--h-poll-picked)" : "var(--h-poll-bar)" }}
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
    <main className="font-sans scrollbar-none absolute inset-0 overflow-y-auto overflow-x-hidden bg-white text-[#2C2C2C] dark:bg-[#0F1F26] dark:text-white">
      <div className="mx-auto w-full max-w-[430px]" style={{ paddingBottom: NAV_CLEARANCE }}>
        {/* The whole top part (buttons, title, stories) sticks; the posts scroll under it. */}
        <div className="sticky top-0 z-10 bg-white pb-4 dark:bg-[#0F1F26]" style={{ paddingTop: TOP_MARGIN }}>
          <motion.header {...reveal(0.05)} className="flex items-center justify-between px-4">
            <button type="button" aria-label="New post" className="flex h-8 w-8 items-center justify-center">
              <Plus className="h-6 w-6" strokeWidth={1.8} />
            </button>
            <h1 className="text-xl font-semibold leading-7">Your Community</h1>
            <button type="button" aria-label="Notifications" className="flex h-8 w-8 items-center justify-center">
              <Bell className="h-6 w-6" strokeWidth={1.6} />
            </button>
          </motion.header>

          <motion.div {...reveal(0.1)} className="scrollbar-none mt-5 flex gap-4 overflow-x-auto px-4">
            {STORIES.map((story) => (
              <Story key={story.id} story={story} />
            ))}
          </motion.div>
        </div>

        <div className="flex flex-col gap-4 px-4">
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
