"use client";

import { useRouter } from "next/navigation";
import { chooseCharacterReturnPath } from "@/lib/routes";
import { ChooseCharacterScreen } from "./ChooseCharacterScreen";

/** Where the page returns to when it was opened by URL, with no `from`. */
const FALLBACK_PATH = "/home";

/** `/choose-character` — straight back to where the battery's menu was opened from (`from`). */
export function ChooseCharacterRoute() {
  const router = useRouter();
  // `replace`: the page is not left behind in the history, so the browser's Back doesn't open it again.
  const close = () => router.replace(chooseCharacterReturnPath(window.location.search) ?? FALLBACK_PATH);
  return <ChooseCharacterScreen onClose={close} />;
}
