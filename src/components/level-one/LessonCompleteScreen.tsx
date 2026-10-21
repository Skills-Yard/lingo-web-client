"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Star } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { StatCard, type StatSpec } from "@/components/home/DashboardScreen";
import { LEARNER_STATS } from "@/components/home/learnerStats";
import { playClickSound } from "@/components/onboarding/clickSound";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { Confetti } from "./Confetti";
import { OnboardingHex } from "./FeedbackPanel";
import { playCompleteChime, playCountTick, playLinePop } from "./lessonCompleteSound";
import { FLOAT_IN, FRAME_H, FRAME_W, useFrameScale } from "./RewardScreen";

type Stage = 1 | 2 | 3;
const LAST_STAGE: Stage = 3;

const COUNT_MS = 900;
/** Counting ticks sound no more often than this. */
const TICK_EVERY_MS = 60;
/** The seconds the lesson took, shown as m:ss. */
const LESSON_SECONDS = 222;
const BATTERY_REWARD = 2;

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** `0` up to `to` (eased) over `COUNT_MS`, starting `delay` seconds from now, with a tick as it climbs. */
const useCountUp = (to: number, delay: number, ticking = true) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    let lastTick = 0;
    let shown = 0;
    const start = performance.now() + delay * 1000;
    const step = (now: number) => {
      const t = Math.min(Math.max((now - start) / COUNT_MS, 0), 1);
      const next = Math.round(to * (1 - (1 - t) ** 3));
      if (next !== shown) {
        shown = next;
        setValue(next);
        if (ticking && now - lastTick >= TICK_EVERY_MS) {
          lastTick = now;
          playCountTick(Math.min(next, 20));
        }
      }
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, delay, ticking]);
  return value;
};

function CountUp({ to, delay, format = String }: { to: number; delay: number; format?: (value: number) => string }) {
  return <>{format(useCountUp(to, delay))}</>;
}

/** One line of the screen: floats up into place `delay` seconds in, with a pop. */
function Line({ delay, className, children }: { delay: number; className: string; children: ReactNode }) {
  useEffect(() => {
    const timer = window.setTimeout(playLinePop, delay * 1000);
    return () => window.clearTimeout(timer);
  }, [delay]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...FLOAT_IN, delay }}
      className={`absolute ${className}`}
    >
      {children}
    </motion.div>
  );
}

const Title = ({ delay, top }: { delay: number; top: number }) => (
  <Line delay={delay} className="inset-x-0 text-center" >
    <h1 style={{ marginTop: top }} className="text-[24px] leading-8 font-semibold text-[#01A17F]">
      Lesson complete!
    </h1>
  </Line>
);

const HexSpot = ({ delay, className, stage, celebrate }: { delay: number; className: string; stage: Stage; celebrate?: boolean }) => (
  <Line delay={delay} className={className}>
    <OnboardingHex
      entryKey={`lesson-complete-${stage}`}
      cue={celebrate ? HEX_ONBOARDING_TRIGGER.celebrate : null}
      cueDelayMs={600}
    />
  </Line>
);

const STATS: readonly StatSpec[] = [
  {
    id: "xp",
    label: "Total XP",
    value: <>+<CountUp to={40} delay={1.1} /></>,
    background: "#FFC342",
    shadow: "0 6px 14px rgba(255,195,66,0.22)",
    labelColor: "#5A3E00",
    accent: "#F5B301",
    icon: <Star className="h-[22px] w-[22px] fill-[#F5B301] text-[#F5B301]" strokeWidth={1.5} />,
  },
  {
    id: "accuracy",
    label: "Accuracy",
    value: <><CountUp to={92} delay={1.7} />%</>,
    background: "#01A17F",
    shadow: "0 6px 14px rgba(1,161,127,0.22)",
    labelColor: "#FFFFFF",
    accent: "#01A17F",
    icon: <Check className="h-[22px] w-[22px] text-[#01A17F]" strokeWidth={2.4} />,
  },
  {
    id: "time",
    label: "Time",
    value: <CountUp to={LESSON_SECONDS} delay={2.3} format={formatTime} />,
    background: "#2F80ED",
    shadow: "0 6px 14px rgba(47,128,237,0.22)",
    labelColor: "#FFFFFF",
    accent: "#2F80ED",
    icon: <Clock className="h-[22px] w-[22px] text-[#2F80ED]" strokeWidth={2.2} />,
  },
];
const STAT_CARD_DELAYS = [1, 1.6, 2.2] as const;

/** Stage 1: Hex with his star eyes, "Lesson complete!". */
function CompleteStage() {
  return (
    <>
      <HexSpot delay={0.1} stage={1} celebrate className="top-[130px] left-1/2 h-[160px] w-[190px] -translate-x-1/2" />
      <Title delay={0.9} top={290} />
    </>
  );
}

/** Stage 2: the lesson's XP, accuracy and time, one card after another. */
function StatsStage() {
  return (
    <>
      <HexSpot delay={0.1} stage={2} className="top-[100px] left-1/2 h-[150px] w-[180px] -translate-x-1/2" />
      <Title delay={0.5} top={278} />
      <div className="absolute inset-x-4 top-[500px] flex gap-2">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...FLOAT_IN, delay: STAT_CARD_DELAYS[i] }}
            className="flex min-w-0 flex-1"
          >
            <PopOnArrival delay={STAT_CARD_DELAYS[i] ?? 0} />
            <StatCard stat={stat} />
          </motion.div>
        ))}
      </div>
    </>
  );
}

/** Plays the line pop for something that animates by itself, `delay` seconds in. */
function PopOnArrival({ delay }: { delay: number }) {
  useEffect(() => {
    const timer = window.setTimeout(playLinePop, delay * 1000);
    return () => window.clearTimeout(timer);
  }, [delay]);
  return null;
}

/** Stage 3: the battery refill, "+2" counting up under Hex. */
function BatteryStage({ onGain }: { onGain: (gained: number) => void }) {
  const gained = useCountUp(BATTERY_REWARD, 1.6);
  useEffect(() => onGain(gained), [gained, onGain]);
  return (
    <>
      <Title delay={0.2} top={230} />
      <HexSpot delay={0.8} stage={3} className="top-[380px] left-1/2 h-[110px] w-[130px] -translate-x-1/2" />
      <Line delay={1.4} className="top-[490px] left-1/2 -translate-x-1/2">
        <div className="flex h-[56px] w-[96px] items-center justify-center rounded-[14px] border-[3px] border-[#FFB36B] bg-[#F78FC0] shadow-[0_6px_14px_rgba(247,143,192,0.3)]">
          <span className="text-[26px] leading-none font-semibold text-white tabular-nums">+{gained}</span>
        </div>
      </Line>
    </>
  );
}

/** The battery in the corner: it fills as the reward counts up. */
function BatteryChip({ gained }: { gained: number }) {
  return (
    <div className="absolute top-[51px] right-4 z-10 flex h-8 items-center gap-1.5 rounded-full border border-black/8 bg-white py-1 pr-3 pl-1.5 shadow-sm">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E9F5F0]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/stats/battery.png" alt="" draggable={false} className="h-[14px] w-[14px] select-none object-contain" />
      </span>
      <span className="text-[14px] leading-none font-semibold text-[#01A17F] tabular-nums">
        {LEARNER_STATS.battery.current + gained}
      </span>
    </div>
  );
}

/**
 * `/module?level=1&step=complete` — after the last screen: "Lesson complete!".
 * Three screens in turn (Continue steps through them), each showing its lines
 * one by one with a floating entrance and a sound: Hex and the title; the
 * XP / accuracy / time cards, each counting up; and the battery refill, "+2",
 * counting up as the corner chip fills.
 */
export function LessonCompleteScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const scale = useFrameScale();
  const [stage, setStage] = useState<Stage>(1);
  const [gained, setGained] = useState(0);

  useEffect(() => {
    if (stage === 1) playCompleteChime();
  }, [stage]);

  const next = () => {
    if (stage < LAST_STAGE) setStage((stage + 1) as Stage);
    else (onContinue ?? (() => router.push("/level")))();
  };

  return (
    <main className="onboarding-light relative h-dvh w-full overflow-hidden bg-white">
      <div
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
          visibility: scale === null ? "hidden" : "visible",
        }}
      >
        <BatteryChip gained={gained} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage}
            className="absolute inset-0"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {stage === 1 && <CompleteStage />}
            {stage === 2 && <StatsStage />}
            {stage === 3 && <BatteryStage onGain={setGained} />}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-9">
          <Button3D onClick={next} onPress={playClickSound} className="w-full">
            Continue
          </Button3D>
        </div>
      </div>
      <Confetti active={stage === 1 || stage === 3} />
    </main>
  );
}
