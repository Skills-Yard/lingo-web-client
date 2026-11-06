const SEQUENCE = "/images/sequence";
const COMMAND = "/images/level-two";
const LEVEL_ONE = "/images/level-one";
const ROOT = "/images";
const DATATYPES = "/images/datatypes";

/**
 * Every picture on an option or a card, as a stand-in from the Sequence and
 * Command modules until the module has art of its own: to use a real picture,
 * change that line (the file can sit in `public/images/datatypes/`). The four
 * types have the same picture wherever they appear.
 */
export const P = {
  // The module's own art: the scenes of the story screens (1 and 2).
  eventScene: `${DATATYPES}/event-scene.webp`,
  studentProfile: `${DATATYPES}/student-profile.webp`,
  // The four data types.
  integer: `${COMMAND}/cube.png`,
  float: `${ROOT}/coins.png`,
  string: `${SEQUENCE}/icon-alphabet.svg`,
  boolean: `${ROOT}/trafficSignal.png`,
  // Information and answers.
  think: `${SEQUENCE}/icon-think.svg`,
  order: `${SEQUENCE}/icon-order.svg`,
  actions: `${SEQUENCE}/icon-actions.svg`,
  goal: `${SEQUENCE}/icon-goal.svg`,
  random: `${SEQUENCE}/icon-random.svg`,
  repeat: `${SEQUENCE}/icon-repeat.svg`,
  short: `${SEQUENCE}/icon-short.svg`,
  unsure: `${SEQUENCE}/icon-unsure.svg`,
  idea: `${ROOT}/idea.png`,
  question: `${ROOT}/question.png`,
  statement: `${ROOT}/statement.png`,
  star: `${ROOT}/star.png`,
  gem: `${ROOT}/gem.png`,
  run: `${ROOT}/run.png`,
  stop: `${ROOT}/stop.png`,
  tree: `${ROOT}/tree.png`,
  food: `${ROOT}/food.png`,
  box: `${ROOT}/box.png`,
  rock: `${ROOT}/rock.png`,
  computer: `${ROOT}/computer.png`,
  command: `${ROOT}/command.png`,
  programmer: `${LEVEL_ONE}/programmer.png`,
  teacher: `${LEVEL_ONE}/teacher.png`,
  shoes: `${SEQUENCE}/put-on-shoes.webp`,
  socks: `${SEQUENCE}/put-on-socks.webp`,
} as const;

export type Picture = keyof typeof P;
