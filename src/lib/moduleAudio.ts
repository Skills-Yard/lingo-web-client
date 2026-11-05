/** The module's voice clips, in `public/audios/moduleAudios/`. */
const moduleAudio = (file: string) => encodeURI(`/audios/moduleAudios/${file}`);

export const MODULE_AUDIO = {
  meetRobot: [moduleAudio("meet_your_robot.mp3")],
  giveInstruction: [moduleAudio("give_instruction_to_pick _the_cube.mp3")],
  whatJustHappened: [
    moduleAudio("what_just_happened.mp3"),
    moduleAudio("what_did_the_robot_do_after_pick_up.mp3"),
  ],
  releaseCube: [
    moduleAudio("let's_release_the_cube.mp3"),
    moduleAudio("which_command_releases_the_cube.mp3"),
  ],
  yourTurn: [moduleAudio("let's_make_the_robot_pick_up_the_cube.mp3")],
  match: [moduleAudio("can_you_match_them.mp3")],
  /** One list per Hex line on "Move cube to target"; the title is read with the first. */
  target: [
    [
      moduleAudio("Move_the_cube_to_target.mp3"),
      moduleAudio("the_robot_is_holding_the_cube.mp3"),
    ],
    [moduleAudio("the_target_aera_is_marked_on_the_table.mp3")],
    [moduleAudio("let's_move_the_cube_in_the_target_area.mp3")],
  ],
  reachTarget: [
    moduleAudio("how_to_reach_the_target.mp3"),
    moduleAudio("pick_an_instruction_to_reach_the_target_area.mp3"),
  ],
  meetCommand: [
    moduleAudio("in_programming_languages,_instructions_are_known_as_commmand.mp3"),
  ],
  /** The player on "Meet the Command." */
  commandClip: moduleAudio("meet_the_command.mp3"),
  flipCard: [moduleAudio("flip_the_card_to_reveal.mp3")],
  instructionsAre: [moduleAudio("instruction_are.mp3")],
  teacherSays: [moduleAudio("imagine_teacher_says_open_your_notebook.mp3")],
  teacherDoing: [moduleAudio("what_teacher_is_doing.mp3")],
  examples: [moduleAudio("example_of_instruction.mp3")],
  whatAreInstructions: [moduleAudio("what_are_instruction.mp3")],
  guideHex: [moduleAudio("_guide _hex.mp3")],
} as const;

/** The Sequence module's voice clips, in `public/audios/sequenceModuleAudios/`. */
const sequenceAudio = (file: string) => encodeURI(`/audios/sequenceModuleAudios/${file}`);

export const SEQUENCE_AUDIO = {
  /** One list per quiz: the title, then Hex's line. */
  putOnFirst: [sequenceAudio("What_to_put_on_first.mp3"), sequenceAudio("Lets_get_ready_before_going_out.mp3")],
  /** The title once the first question is answered. */
  tryYourOrder: [sequenceAudio("Lets_try_your_order.mp3")],
  compareAttempts: [sequenceAudio("Look_closely_now.mp3")],
  socksFirst: [sequenceAudio("What_if_socks_go_first.mp3"), sequenceAudio("Lets_get_ready_again_Your_shoes_are_already_on.mp3")],
  firstCommand: [sequenceAudio("Whats_the_first_command.mp3"), sequenceAudio("Move_the_cube_into_the_target_area.mp3")],
  arrange: [sequenceAudio("Arrange_the_instructions.mp3"), sequenceAudio("Drag_to_help_robot_place_the_cube_in_target_area.mp3")],
  /** Hex's line on "Meet the Sequence." */
  meetSequence: [sequenceAudio("Order_matters_as_some_instructions_come_first_then_another.mp3")],
  /** The player on "Meet the Sequence." */
  sequenceClip: sequenceAudio("A_sequence_is_a_set_of_instructions_arranged_in_a_particular_order.mp3"),
  guideHex: [sequenceAudio("Lets_guide_Hex.mp3")],
} as const;

/** Onboarding's voice clips (questions only), from the same folder. */
export const ONBOARDING_AUDIO = {
  greeting: [moduleAudio("im_hex.mp3")],
  readyCheck: [moduleAudio("few_quick_question.mp3"), moduleAudio("are_u_ready.mp3")],
  career: [moduleAudio("career_chasing.mp3")],
  pythonLevel: [moduleAudio("python_superpower_level.mp3")],
  experience: [moduleAudio("have_u_worked_with_code_before.mp3")],
  name: [moduleAudio("what_should_i_call_you.mp3")],
  motivation: [moduleAudio("what_do_you_wish_to_achieve.mp3")],
  timeCommitment: [moduleAudio("how_much_time_to_learning.mp3")],
  learningTime: [moduleAudio("best_time_in_a_day_for_you_to_learn.mp3")],
  notifications: [moduleAudio("get_notified_when_it's_time_to_learn.mp3")],
  streak: [moduleAudio("stay_one_tap_away_from_your_next_lesson.mp3")],
  threeMonths: [moduleAudio("in_3_month_u_are_bulding_a_real_project.mp3")],
  startingPoint: [moduleAudio("how_do_you_want_to_begin_your_path.mp3")],
} as const;
