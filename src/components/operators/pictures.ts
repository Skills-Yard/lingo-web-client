const SEQUENCE = "/images/sequence";
const COMMAND = "/images/level-two";
const LEVEL_ONE = "/images/level-one";
const ROOT = "/images";
const MODULE = "/images/operators-module";

/**
 * Every picture on an option or a card, as a stand-in from the Sequence and
 * Command modules until the module has art of its own: to use a real picture,
 * change that line (the file can sit in `public/images/operators/`). An idea
 * has the same picture wherever it appears (money is always the coins).
 */
export const P = {
  // Things in the scenes.
  money: `${ROOT}/coins.png`,
  chocolate: `${ROOT}/food.png`,
  student: `${LEVEL_ONE}/programmer.png`,
  teacher: `${LEVEL_ONE}/teacher.png`,
  person: `${ROOT}/run.png`,
  gift: `${ROOT}/box.png`,
  chair: `${COMMAND}/cube.png`,
  plant: `${ROOT}/tree.png`,
  notebook: `${ROOT}/statement.png`,
  pen: `${ROOT}/command.png`,
  bag: `${ROOT}/rock.png`,
  game: `${ROOT}/gem.png`,
  gate: `${ROOT}/stop.png`,
  computer: `${ROOT}/computer.png`,
  light: `${ROOT}/trafficSignal.png`,
  // The whole cards of "Have you tried these?": the picture and its name are in the image.
  cardMoney: `${MODULE}/example_card1.png`,
  cardChocolates: `${MODULE}/example_card2.png`,
  cardSpending: `${MODULE}/example_card3.png`,
  cardHeights: `${MODULE}/example_card4.png`,
  // The situations of "Explore the situations!".
  iconMoney: `${MODULE}/money-icon.png`,
  iconChocolate: `${MODULE}/chocolate_icon.png`,
  iconHeight: `${MODULE}/height_icon.png`,
  iconWallet: `${MODULE}/money_bag.png`,
  // Answers and ideas.
  think: `${SEQUENCE}/icon-think.svg`,
  order: `${SEQUENCE}/icon-order.svg`,
  actions: `${SEQUENCE}/icon-actions.svg`,
  goal: `${SEQUENCE}/icon-goal.svg`,
  random: `${SEQUENCE}/icon-random.svg`,
  repeat: `${SEQUENCE}/icon-repeat.svg`,
  short: `${SEQUENCE}/icon-short.svg`,
  unsure: `${SEQUENCE}/icon-unsure.svg`,
  letters: `${SEQUENCE}/icon-alphabet.svg`,
  idea: `${ROOT}/idea.png`,
  question: `${ROOT}/question.png`,
  star: `${ROOT}/star.png`,
  stop: `${ROOT}/stop.png`,
} as const;

export type Picture = keyof typeof P;
