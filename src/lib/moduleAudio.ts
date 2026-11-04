/** The module's voice clips, in `public/audios/moduleAudios/`. */
const moduleAudio = (file: string) => encodeURI(`/audios/moduleAudios/${file}`);

export const MODULE_AUDIO = {
  meetRobot: [moduleAudio("meet_your_robot.mp3"), moduleAudio("im_hex.mp3")],
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
