"use client";

import { useEffect, type ComponentType } from "react";
import { BottleBackdrop, ItemsBackdrop, NamesBackdrop, ShopBackdrop, TrekBackdrop, WalletBackdrop } from "@/components/variable/scenes";
import { fireSceneTrigger, setSceneValues, type SceneName } from "@/lib/rive/variableHost";
import type { TriggerRequest } from "../types";

export type { SceneName };

/** What can be set on a scene: its view model's values, by name. */
export type SceneValues = Record<string, boolean | number | string>;

/**
 * The scenes there are, by the name the data uses. A scene is one Rive canvas kept for the whole module
 * (see `variableHost`), so what one screen did to it (the bottle filled) is still there on the next. They are
 * the Variable module's for now; the Sequence room and the robot join them when those modules play from data.
 */
const FRAMES: Record<SceneName, ComponentType> = {
  trek: TrekBackdrop,
  bottle: BottleBackdrop,
  names: NamesBackdrop,
  items: ItemsBackdrop,
  shop: ShopBackdrop,
  wallet: WalletBackdrop,
};

export const SCENE_NAMES = Object.keys(FRAMES) as SceneName[];

/** Whether the data's scene name is one there is. */
export const isScene = (name: string | undefined): name is SceneName => !!name && name in FRAMES;

/** Fires a trigger on a scene (once its file has settled). An unknown scene is ignored. */
export const fireScene = (name: string | undefined, trigger: string | undefined) => {
  if (isScene(name) && trigger) fireSceneTrigger(name, trigger as never);
};

/** Sets values on a scene (written as soon as its file has loaded). An unknown scene is ignored. */
export const setScene = (name: string | undefined, values: SceneValues) => {
  if (isScene(name)) setSceneValues(name, values as never);
};

/**
 * A scene drawn behind the screen (not in its flow): the artboard's own size at the stage's width, faded in at
 * its top and bottom. `values` are set on it when it appears and whenever they change; `trigger` fires each
 * time its `id` changes.
 */
export function Scene({ name, values, trigger }: { name: SceneName; values?: SceneValues; trigger?: TriggerRequest | null }) {
  const Frame = FRAMES[name];
  // The values as text, so the same values given as a new object do not write again.
  const wanted = values ? JSON.stringify(values) : "";
  // After the frame's own effect (a child's runs first), so what the data says wins over the frame's defaults.
  useEffect(() => {
    if (wanted) setSceneValues(name, JSON.parse(wanted) as never);
  }, [name, wanted]);
  const triggerId = trigger?.id;
  const triggerName = trigger?.name;
  useEffect(() => {
    if (triggerId !== undefined) fireScene(name, triggerName);
  }, [name, triggerId, triggerName]);
  return <Frame />;
}
