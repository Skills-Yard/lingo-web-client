"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { parseOnboardingAnswers, readOnboardingAnswersJson } from "@/lib/onboardingAnswers";
import { energyReturnPath, moduleHref, onboardingHref } from "@/lib/routes";
import { CareerDetailScreen } from "./CareerDetailScreen";
import { careerById } from "./careersData";
import { CareersScreen } from "./CareersScreen";
import { DashboardScreen } from "./DashboardScreen";
import { EnergyScreen } from "./EnergyScreen";
import { HomeScreen } from "./HomeScreen";
import { LeagueScreen } from "./LeagueScreen";
import { MainHomeScreen } from "./MainHomeScreen";
import { ProfileScreen } from "./ProfileScreen";

const subscribeNever = () => () => {};

/** `/level` — the learner's path. */
export function LevelRoute() {
  const router = useRouter();
  return (
    <HomeScreen onStart={() => router.push(moduleHref(1, 1))} />
  );
}

/** `/home` — the main home; Continue resumes the learner's path. */
export function MainHomeRoute() {
  const router = useRouter();
  const json = useSyncExternalStore(subscribeNever, readOnboardingAnswersJson, () => "");
  const name = useMemo(() => parseOnboardingAnswers(json).name?.trim(), [json]);
  return (
    <MainHomeScreen
      name={name || undefined}
      onContinue={() => router.push("/level")}
      onProfile={() => router.push("/profile")}
    />
  );
}

/** `/careers/<id>` — one career; Start goes on to the level path. */
export function CareerRoute({ id }: { id: string }) {
  const router = useRouter();
  const career = careerById(id);
  if (!career) return null;
  return (
    <CareerDetailScreen
      career={career}
      onBack={() => router.push("/careers")}
      onStart={() => router.push("/level")}
    />
  );
}

/** `/dashboard` — the dashboard tab, greeting the learner by their onboarding name. */
export function DashboardRoute() {
  const json = useSyncExternalStore(subscribeNever, readOnboardingAnswersJson, () => "");
  const name = useMemo(() => parseOnboardingAnswers(json).name?.trim(), [json]);
  return <DashboardScreen name={name || undefined} />;
}

/** `/league` — the weekly league; Back returns to the dashboard it opened from. */
export function LeagueRoute() {
  const router = useRouter();
  return <LeagueScreen onBack={() => router.push("/dashboard")} />;
}

/** `/energy` — the battery's screen; the cross returns to where it was opened from. */
export function EnergyRoute() {
  const router = useRouter();
  // Straight to where it was opened from; with no `from` (opened by URL), one step back.
  const close = () => {
    const from = energyReturnPath(window.location.search);
    if (from) router.push(from);
    else router.back();
  };
  return <EnergyScreen onClose={close} />;
}

/** `/careers` — the careers tab. */
export function CareersRoute() {
  return <CareersScreen />;
}

/** `/profile` — a temporary profile; Back returns home, "Redo onboarding" goes to `/onboarding`. */
export function ProfileRoute() {
  const router = useRouter();
  // Session storage only exists in the browser (server snapshot: none), and
  // nothing changes it while this page is open, so there is nothing to
  // subscribe to.
  const json = useSyncExternalStore(subscribeNever, readOnboardingAnswersJson, () => "");
  const answers = useMemo(() => parseOnboardingAnswers(json), [json]);

  return (
    <ProfileScreen
      answers={answers}
      onBack={() => router.push("/home")}
      onRestartOnboarding={() => router.push(onboardingHref())}
    />
  );
}
