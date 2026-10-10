"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { parseOnboardingAnswers, readOnboardingAnswersJson } from "@/lib/onboardingAnswers";
import type { HomeTab } from "./BottomNav";
import { HomeScreen } from "./HomeScreen";
import { ProfileScreen } from "./ProfileScreen";

/** Nav tabs that have a page; the others are inert for now. */
const TAB_PATH: Partial<Record<HomeTab, string>> = {
  home: "/level",
  profile: "/profile",
};

const useTabNavigation = () => {
  const router = useRouter();
  return (tab: HomeTab) => {
    const path = TAB_PATH[tab];
    if (path) router.push(path);
  };
};

const subscribeNever = () => () => {};

/** `/level` — the learner's path. */
export function LevelRoute() {
  return <HomeScreen onNavigate={useTabNavigation()} />;
}

/** `/profile` — the learner's profile; "Redo onboarding" goes back to `/`. */
export function ProfileRoute() {
  const router = useRouter();
  const navigate = useTabNavigation();
  // Session storage only exists in the browser (server snapshot: none), and
  // nothing changes it while this page is open, so there is nothing to
  // subscribe to.
  const json = useSyncExternalStore(subscribeNever, readOnboardingAnswersJson, () => "");
  const answers = useMemo(() => parseOnboardingAnswers(json), [json]);

  return (
    <ProfileScreen
      answers={answers}
      onNavigate={navigate}
      onRestartOnboarding={() => router.push("/")}
    />
  );
}
