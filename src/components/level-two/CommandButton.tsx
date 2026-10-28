"use client";

import { motion } from "framer-motion";
import type { Command } from "./rounds";

/** The one command the learner can give: a white key with its icon. */
export function CommandButton({
  command: { label, icon: Icon, iconClass },
  disabled,
  onPress,
}: {
  command: Command;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[390px] px-5 pb-9">
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: disabled ? 0.6 : 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.7 }}
        whileTap={disabled ? undefined : { scale: 0.97, y: 3 }}
        disabled={disabled}
        onClick={onPress}
        className="flex h-[58px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-b-4 border-[#D9D6C4] bg-white text-[17px] font-semibold text-[#1F2A44] shadow-[0_4px_14px_rgba(31,42,68,0.12)] active:border-b disabled:cursor-default"
      >
        <Icon className={`h-6 w-6 ${iconClass}`} strokeWidth={2} />
        {label}
      </motion.button>
    </div>
  );
}
