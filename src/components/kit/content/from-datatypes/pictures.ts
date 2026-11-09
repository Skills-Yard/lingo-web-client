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
  // The module's own art: the scenes of screens 1 and 2.
  eventScene: `${DATATYPES}/event-scene.webp`,
  studentProfile: `${DATATYPES}/student-profile.webp`,
  // Screen 1's answers (what the event needs): name, age, height, all of them.
  needName: `${DATATYPES}/datatypeModule-1.1.svg`,
  needAge: `${DATATYPES}/datatypeModule-1.2.svg`,
  needHeight: `${DATATYPES}/datatypeModule-1.3.svg`,
  needAll: `${DATATYPES}/datatypeModule-1.4.svg`,
  // Screen 2's answers (what is noticed about Aarav's details).
  lookSame: `${DATATYPES}/datatypeModule-2.1.svg`,
  lookDifferent: `${DATATYPES}/datatypeModule-2.2.svg`,
  allNumbers: `${DATATYPES}/datatypeModule-2.3.svg`,
  // The empty slot on the grouping screen (3): the download-arrow mark.
  dropSlot: `${DATATYPES}/drop-slot.svg`,
  // The backdrop of screens 5 and 6: the school yard, without the student.
  schoolScene: `${DATATYPES}/school-scene.webp`,
  // Screen 5's three cards (planning the school event) use screen 2's icons: the same files.
  planStudents: `${DATATYPES}/datatypeModule-2.2.svg`,
  planTickets: `${DATATYPES}/datatypeModule-2.1.svg`,
  planPrizes: `${DATATYPES}/datatypeModule-2.3.svg`,
  // Screen 5.2's three number badges ("How are they similar?"): 30 students, 43 tickets, 12 prices.
  similarStudents: `${DATATYPES}/datatypeModule-5.2.1.svg`,
  similarTickets: `${DATATYPES}/datatypeModule-5.2.2.svg`,
  similarPrices: `${DATATYPES}/datatypeModule-5.2.3.svg`,
  // Screen 6's four cards (values from different situations): students, tickets, height, weight.
  valueStudents: `${DATATYPES}/datatypeModule-6.1.svg`,
  valueTickets: `${DATATYPES}/datatypeModule-6.2.svg`,
  valueHeight: `${DATATYPES}/datatypeModule-6.3.svg`,
  valueWeight: `${DATATYPES}/datatypeModule-6.4.svg`,
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
