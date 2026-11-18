"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import {
  readModulesDone,
  setModulesDone,
  subscribeModulesDone,
} from "@/lib/levelProgress";
import {
  PlatformConfig,
  PLATFORM_CONFIGS,
  WORLD_STAGE_HEIGHT,
} from "./level/levelConfig";
import { LevelHeader } from "./level/LevelHeader";
import { CategoryBar } from "./level/CategoryBar";
import { LockedToast } from "./level/LockedToast";
import { LevelWorld } from "./level/LevelWorld";

export type { PlatformConfig };
export { PLATFORM_CONFIGS };

const TABS = ["Python fundamental", "Advance python", "Pandas"] as const;

export function HomeScreen({
  onStart,
}: {
  /** Opens module `module` (1-based). */
  onStart?: (module: number) => void;
}) {
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [stageScale, setStageScale] = useState<number>(1);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const updateScale = () => {
      const w = el.clientWidth;
      if (w > 0) {
        const nextScale = w < 390 ? Math.max((w - 4) / 390, 0.7) : Math.min(w / 390, 1.05);
        setStageScale(nextScale);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    window.addEventListener("resize", updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<string>("Python fundamental");

  const storedModulesDone = useSyncExternalStore(subscribeModulesDone, readModulesDone, () => 0);
  const [modulesCompleted, setModulesCompleted] = useState<number>(() => storedModulesDone);

  useEffect(() => {
    if (readModulesDone() === 2 && !window.localStorage.getItem("lingo:progress-started")) {
      setModulesDone(0);
      setModulesCompleted(0);
    } else {
      setModulesCompleted(storedModulesDone);
    }
  }, [storedModulesDone]);

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const stageHeight = WORLD_STAGE_HEIGHT;

  const activeLevelNumber = Math.min(modulesCompleted + 1, PLATFORM_CONFIGS.length);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const activePlatform = PLATFORM_CONFIGS.find((p) => p.id === activeLevelNumber);
    if (!activePlatform) return;
    const targetY = Math.max(0, activePlatform.baseY * stageScale - scroller.clientHeight * 0.45);
    scroller.scrollTo({ top: targetY, behavior: "smooth" });
  }, [activeLevelNumber, stageScale]);

  const goToModulesDone = (count: number) => {
    const next = Math.max(0, Math.min(count, PLATFORM_CONFIGS.length));
    window.localStorage.setItem("lingo:progress-started", "1");
    setModulesDone(next);
    setModulesCompleted(next);
  };

  const handleStartLesson = (levelNum: number) => {
    setSelectedLevel(null);
    window.localStorage.setItem("lingo:progress-started", "1");
    onStart?.(levelNum);
  };

  const handleLevelClick = (levelNum: number) => {
    if (levelNum < activeLevelNumber) {
      setSelectedLevel(levelNum);
    } else if (levelNum === activeLevelNumber) {
      setSelectedLevel(levelNum);
    } else {
      setLockedNotice(`Level ${levelNum} is locked. Complete Level ${activeLevelNumber} first!`);
      window.setTimeout(() => setLockedNotice(null), 2500);
    }
  };

  return (
    <main className="relative flex h-dvh w-full justify-center overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFFFF_20%,#DDDAFD_100%)] font-sans select-none dark:bg-gradient-to-b dark:from-[#0B132B] dark:via-[#0F172A] dark:to-[#090D16]">
      <div className="relative flex h-full w-full max-w-[430px] flex-col">
        {/* Top Header */}
        <LevelHeader
          onBack={() => router.push("/home")}
          onDoubleClickTitle={() => {
            const next = (modulesCompleted + 1) % (PLATFORM_CONFIGS.length + 1);
            setModulesDone(next);
            setModulesCompleted(next);
          }}
          modulesDone={modulesCompleted}
          onCompleteModule={() => goToModulesDone(modulesCompleted + 1)}
          onUndoModule={() => goToModulesDone(modulesCompleted - 1)}
          onPickModule={(module) => goToModulesDone(module - 1)}
        />

        {/* Category Tabs */}
        <CategoryBar
          tabs={TABS}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Locked Toast Notice */}
        <LockedToast notice={lockedNotice} />

        {/* Scrollable Level Platform World */}
        <div
          ref={scrollerRef}
          className="scrollbar-none relative flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <div
            className="relative mx-auto"
            style={{
              width: `${Math.round(390 * stageScale)}px`,
              height: `${Math.round(stageHeight * stageScale)}px`,
            }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{
                width: "390px",
                height: `${stageHeight}px`,
                transform: `scale(${stageScale})`,
              }}
            >
              <LevelWorld
                modulesCompleted={modulesCompleted}
                activeLevelNumber={activeLevelNumber}
                selectedLevel={selectedLevel}
                onLevelClick={handleLevelClick}
                onStartLesson={handleStartLesson}
                onClosePopup={() => setSelectedLevel(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
