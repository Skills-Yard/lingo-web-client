const SEQUENCE = "/images/sequence";
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
  // (age and height are the module's own icons, `public/animations/svg/datatype-module/`; name and all-of-them are still the first set, which that folder has no match for.)
  needAge: "/animations/svg/datatype-module/age.svg",
  needHeight: "/animations/svg/datatype-module/measure.svg",
  needAll: `${DATATYPES}/datatypeModule-1.4.svg`,
  // Screen 2's answers (what is noticed about Aarav's details).
  // (the module's own icons, `public/animations/svg/datatype-module/`: three of a kind, a mix of kinds, 1-2-3.)
  lookSame: "/animations/svg/datatype-module/all.svg",
  lookDifferent: "/animations/svg/datatype-module/different.svg",
  allNumbers: "/animations/svg/datatype-module/numbers.svg",
  // The empty slot on the grouping screen (3): the download-arrow mark.
  dropSlot: `${DATATYPES}/drop-slot.svg`,
  // Screen 8's picture: two students and their heights, with the decimal part of each picked out (the card is part of the art).
  floatHeights: `${DATATYPES}/float-heights.webp`,
  // The backdrop of screen 10: the desk with books and a plant, and the teal shapes behind the list (not supplied yet: an empty slot until the file is in).
  namesScene: `${DATATYPES}/names-scene.webp`,
  // The backdrop of screens 5 and 6: the school yard, without the student.
  schoolScene: `${DATATYPES}/school-scene.webp`,
  // Screen 5's three cards (planning the school event) use screen 2's icons: the same files.
  planStudents: `${DATATYPES}/datatypeModule-2.2.svg`,
  planTickets: `${DATATYPES}/datatypeModule-2.1.svg`,
  planPrizes: `${DATATYPES}/datatypeModule-2.3.svg`,
  // Screen 5.2's answers (what the counts have in common): quantities (the module's own icon), people's names (screen 1's person), yes/no
  // answers (the Boolean type's icon).
  quantities: "/animations/svg/datatype-module/quantities.svg",
  // Screen 6.2's answers (which values have a decimal part): height is screen 1's ruler (`needHeight`), weight the module's own scale, and
  // "Both" the Variable module's plus (the folder has no picture for it).
  pickWeight: "/animations/svg/datatype-module/weight.svg",
  pickBoth: "/animations/svg/variable-module/both.svg",
  // (Screen 5.2's number badges, 30 students, 45 tickets and 12 prizes, are drawn in code: see `SIMILAR_TILES`.)
  // Screen 6's four cards (values from different situations): students, tickets, height, weight.
  valueStudents: `${DATATYPES}/datatypeModule-6.1.svg`,
  valueTickets: `${DATATYPES}/datatypeModule-6.2.svg`,
  valueHeight: `${DATATYPES}/datatypeModule-6.3.svg`,
  valueWeight: `${DATATYPES}/datatypeModule-6.4.svg`,
  // The four data types: the module's own icons, `public/animations/svg/datatype-module/` (the file for Integer is spelt "intiger"), the same wherever a type appears.
  integer: "/animations/svg/datatype-module/intiger.svg",
  float: "/animations/svg/datatype-module/float.svg",
  string: "/animations/svg/datatype-module/string.svg",
  boolean: "/animations/svg/datatype-module/boolean.svg",
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
