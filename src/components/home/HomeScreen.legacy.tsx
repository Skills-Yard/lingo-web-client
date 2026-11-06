"use client";

import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { House } from "lucide-react";
import { useScreenTop } from "@/hooks/useFullscreen";
import { TOP_MARGIN } from "./HomeStage";
import { LevelStats } from "./HomeTopBar";
import { configureRiveRuntime, HEX_EXIT_MS, HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import {
  clearModuleJustDone,
  completeModule,
  PLAYABLE_MODULES,
  readModuleJustDone,
  readModulesDone,
  setModulesDone,
} from "@/lib/levelProgress";
import { LevelBackground } from "./LevelBackground";
import { LevelStartPopup } from "./LevelStartPopup";
import type { BlockController, Launch } from "./legacy/types";
import {
  COMING_SOON,
  curveBetween,
  EASE,
  FIRST_MODULE_LEVEL,
  HOP_S,
  LEVEL_COUNT,
  levelCenter,
  MODULE_LESSONS,
  MOVE_ON_DELAY_MS,
  moveTriggers,
  PLATFORMS,
  STAGE_H,
  STAGE_W,
  START_LESSON_MS,
  WORLD_H,
} from "./legacy/pathGeometry";
import { PlatformNode } from "./legacy/PathBlock";
import { CARD_MOVE, cardPlace, homeButtonBottom, LESSONS_PER_MODULE, ModuleCard, MODULES } from "./legacy/ModuleCards";
import { LevelMenu } from "./legacy/LevelMenu";

configureRiveRuntime();

const subscribeNever = () => () => {};

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

export function HomeScreen({
  onStart,
}: {
  onStart?: (module: number) => void;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [viewH, setViewH] = useState(STAGE_H);
  const cardsTop = useScreenTop() + 36 + 10;
  const [boxW, setBoxW] = useState(STAGE_W);
  const [popupOpen, setPopupOpen] = useState(false);
  const currentBlock = useRef<BlockController | null>(null);

  const modulesDone = useSyncExternalStore(subscribeNever, readModulesDone, () => null);
  const justDone = useSyncExternalStore(subscribeNever, readModuleJustDone, () => false);
  const [arrived, setArrived] = useState(false);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const path = useMemo(() => {
    if (modulesDone === null) return null;
    const reached = FIRST_MODULE_LEVEL + Math.min(modulesDone, LEVEL_COUNT - FIRST_MODULE_LEVEL);
    const moving = justDone && !arrived && reached > FIRST_MODULE_LEVEL;
    return { current: moving ? reached - 1 : reached, next: moving ? reached : null, arrived };
  }, [modulesDone, justDone, arrived]);

  useEffect(() => {
    if (!path?.next) return;
    const { exit } = moveTriggers(path.current, path.next);
    let arrive = 0;
    const leave = window.setTimeout(() => {
      currentBlock.current?.leave(exit);
      arrive = window.setTimeout(() => {
        setArrived(true);
        clearModuleJustDone();
      }, HEX_EXIT_MS);
    }, MOVE_ON_DELAY_MS);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(arrive);
    };
  }, [path]);

  const current = path?.current ?? FIRST_MODULE_LEVEL;
  const currentPoint = levelCenter(current);
  const moduleNumber = current - FIRST_MODULE_LEVEL + 1;
  const done = Math.min(moduleNumber - 1, MODULES.length);

  const goTo = (count: number, moveOn = false) => {
    if (moveOn) completeModule(count);
    else setModulesDone(count);
    setArrived(false);
    rerender();
  };

  const lesson = MODULE_LESSONS[moduleNumber - 1] ?? COMING_SOON;
  const enterTrigger = path?.arrived ? moveTriggers(current - 1, current).enter : HEX_ONBOARDING_TRIGGER.enter;

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !path) return;
    const top = Math.max(0, currentPoint.y * scale - scroller.clientHeight * 0.55);
    if (top > scroller.scrollTop) scroller.scrollTo({ top, behavior: path.arrived ? "smooth" : "auto" });
  }, [path, currentPoint.y, scale]);

  const openPopup = () => {
    currentBlock.current?.letsGo();
    setPopupOpen(true);
  };

  const startTimer = useRef<number | undefined>(undefined);

  const closePopup = () => {
    setPopupOpen(false);
    if (startTimer.current === undefined) currentBlock.current?.exitLetsGo();
  };

  const startLesson = () => {
    if (startTimer.current !== undefined || moduleNumber > PLAYABLE_MODULES) return;
    currentBlock.current?.startLesson();
    startTimer.current = window.setTimeout(() => onStart?.(moduleNumber), START_LESSON_MS);
  };

  useEffect(() => () => window.clearTimeout(startTimer.current), []);

  const launch: Launch = {
    current,
    enterTrigger,
    onLaunch: () => {
      if (!path?.next) openPopup();
    },
    controllerRef: currentBlock,
  };

  useEffect(() => {
    if (!popupOpen) return;
    const close = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-level-popup]")) return;
      closePopup();
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [popupOpen]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const { width, height } = box.getBoundingClientRect();
      const next = Math.min(width / STAGE_W, height / STAGE_H, 1.5);
      setScale(next);
      setViewH(height / next);
      setBoxW(width);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <main
      className="onboarding-light flex h-dvh w-full justify-center overflow-hidden bg-gradient-to-b from-[#F3F4F7] via-[#F3F4F7] to-[#F3F4F7] text-[#1A1C22] dark:from-[#0f1f26] dark:via-[#0f1f26] dark:to-[#0a171d] dark:text-white"
    >
      <div ref={boxRef} className="relative h-full w-full">
        <div
          ref={scrollerRef}
          className="scrollbar-none absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <div className="relative w-full" style={{ height: WORLD_H * scale }}>
            <LevelBackground width={boxW} height={WORLD_H * scale} />
            <div
              className="relative mx-auto"
              style={{ width: STAGE_W * scale, height: WORLD_H * scale }}
            >
              <div
                className="absolute left-0 top-0 origin-top-left"
                style={{ width: STAGE_W, height: WORLD_H, transform: `scale(${scale})` }}
              >
                <svg
                  className="absolute inset-0"
                  width={STAGE_W}
                  height={WORLD_H}
                  viewBox={`0 0 ${STAGE_W} ${WORLD_H}`}
                  fill="none"
                  aria-hidden
                >
                  {path && (
                    <>
                      <motion.path
                        d={curveBetween(path.arrived ? current - 1 : current, LEVEL_COUNT)}
                        stroke="#B7BAC6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="5 8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                      />
                      <motion.path
                        d={curveBetween(1, path.arrived ? current - 1 : current)}
                        stroke="#6F5CFF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="5 8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      />
                      {path.arrived && (
                        <motion.path
                          d={curveBetween(current - 1, current)}
                          stroke="#6F5CFF"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray="5 8"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      )}
                    </>
                  )}
                </svg>

                {path && PLATFORMS.map((spec) => (
                  <PlatformNode key={spec.id} spec={spec} launch={launch} />
                ))}

                <AnimatePresence>
                  {popupOpen && (
                    <LevelStartPopup
                      cx={currentPoint.x}
                      cy={currentPoint.y}
                      stageWidth={STAGE_W}
                      title={lesson.title}
                      xp={lesson.xp}
                      onStart={startLesson}
                      delay={HOP_S}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="pointer-events-none absolute inset-x-0 z-40 mx-auto flex w-full max-w-[430px] items-center gap-2 px-4"
          style={{ top: TOP_MARGIN }}
          {...reveal(0)}
        >
          <LevelStats className="pointer-events-auto min-w-0 flex-1" />
          <LevelMenu
            done={done}
            onComplete={() => goTo(done + 1, true)}
            onUndo={() => goTo(done - 1)}
            playing={moduleNumber}
            onPickModule={(module) => goTo(module - 1)}
          />
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-x-0 z-50 mx-auto w-full max-w-[430px] px-4"
          initial={false}
          animate={{ bottom: homeButtonBottom(done) }}
          transition={CARD_MOVE}
        >
          <motion.button
            type="button"
            onClick={() => router.push("/home")}
            aria-label="Home"
            animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
            whileTap={{ scale: 0.94 }}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-black bg-[#1A1C22] text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)] dark:border-white dark:bg-white dark:text-[#1A1C22] dark:shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
          >
            <House className="h-7 w-7" strokeWidth={1.65} />
          </motion.button>
        </motion.div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-x-0 mx-auto w-full max-w-[430px]"
            style={{ top: cardsTop, height: viewH * scale - cardsTop }}
          >
            {MODULES.map((m, i) => (
              <ModuleCard
                key={m.id}
                title={m.title}
                progress={i < done ? LESSONS_PER_MODULE : m.base}
                place={cardPlace(i, done, viewH * scale - cardsTop)}
                compact={i < done}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
