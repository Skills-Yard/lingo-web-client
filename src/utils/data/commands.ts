import { CommandType, CommandInfo } from "../types";

// Ported from lingo-website-client/src/lib/constants/commands.ts

export const COMMAND_DETAILS: Record<CommandType, CommandInfo> = {
  straight: { type: "straight", label: "Go Straight", imageSrc: "/images/moves/Go straight.png" },
  left: { type: "left", label: "Turn Left", imageSrc: "/images/moves/Turn left.png" },
  right: { type: "right", label: "Turn Right", imageSrc: "/images/moves/Turn right.png" },
  pickup: { type: "pickup", label: "Pick Up", imageSrc: "/images/moves/Pick up.png" },
  back: { type: "back", label: "Go Back", imageSrc: "/images/moves/Go back.png" },
};
