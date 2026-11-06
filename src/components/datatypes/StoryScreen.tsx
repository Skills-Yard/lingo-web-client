"use client";

import { useRouter } from "next/navigation";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop } from "@/components/level-two/LevelTwoShell";
import { DATATYPES_STEPS, datatypesNext, datatypesPrevious } from "./datatypes";
import { parseTitle, type StoryScreenDef } from "./screen";

/** Where Hex's row starts in the Figma frame: the same on every screen of the module. */
const HEX_TOP = 160;
/** Hex's bubble: wide enough for a line of about 50 letters to break on three lines. */
const BUBBLE = { width: 190 } as const;

/**
 * A Data Types screen that tells rather than asks ("Let's organise an event!"):
 * the title (one line), Hex with a short line, a picture, and Continue. There is
 * nothing to answer, so nothing is scored.
 */
export function StoryScreen({ screen }: { screen: StoryScreenDef }) {
  const router = useRouter();
  const title = parseTitle(screen.title);
  return (
    <LevelTwoShell
      step={screen.step}
      total={DATATYPES_STEPS}
      onBack={() => router.push(datatypesPrevious(screen.step))}
      scene={
        <>
          <SoftBackdrop />
          {screen.backdrop}
        </>
      }
      onContinue={() => router.push(datatypesNext(screen.step))}
    >
      {/* The design sets these titles at the full 28px on one line, however long (the questions' titles shrink to fit, see `parseTitle`). */}
      <ScreenTitle oneLine>
        {title.parts.map((part, index) =>
          index % 2 === 1 ? (
            <span key={index} className="text-level-gradient">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </ScreenTitle>
      <CentredRow top={stageTop(HEX_TOP)}>
        <HexBubble entryKey={`datatypes-${screen.step}-0-0`} hex="left" line={[{ text: screen.line }]} size={BUBBLE} />
      </CentredRow>
      {screen.picture && (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: stageTop(screen.picture.top) }}>
          {screen.picture.node}
        </div>
      )}
    </LevelTwoShell>
  );
}
