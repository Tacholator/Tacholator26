export const progressStates = [
  {
    id: "full_talk_through",
    label: "Full Talk Through",
    description: "Instructor gives full instructions and commentary; pupil relies heavily on instructor guidance.",
    color: "bg-rose-100 text-rose-800 border-rose-300"
  },
  {
    id: "prompted",
    label: "Prompted",
    description: "Pupil can carry out the task with occasional reminders, prompts or corrections.",
    color: "bg-amber-100 text-amber-800 border-amber-300"
  },
  {
    id: "independent",
    label: "Independent",
    description: "Pupil can complete the task safely and consistently without prompts.",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300"
  }
];

export const drivingSkillsSections = [
  {
    id: "cockpit_and_safety",
    title: "Cockpit & Safety Procedures",
    topics: [
      { id: "cockpit_drill", label: "Cockpit drill", type: "skill" },
      { id: "dsssm_routine", label: "DSSSM routine", type: "skill" }
    ]
  },
  {
    id: "main_car_controls",
    title: "Main Car Controls",
    topics: [
      {
        id: "foot_controls",
        label: "Foot Controls",
        type: "group",
        subtopics: [
          { id: "accelerator", label: "Accelerator", type: "skill" },
          { id: "footbrake", label: "Footbrake", type: "skill" },
          { id: "clutch", label: "Clutch", type: "skill" }
        ]
      },
      {
        id: "hand_controls",
        label: "Hand Controls",
        type: "group",
        subtopics: [
          { id: "steering_wheel", label: "Steering wheel", type: "skill" },
          { id: "handbrake", label: "Handbrake", type: "skill" },
          { id: "gear_lever", label: "Gear lever", type: "skill" },
          { id: "indicators", label: "Indicators", type: "skill" },
          { id: "horn", label: "Horn", type: "skill" },
          {
            id: "ancillary_controls",
            label: "Ancillary controls",
            type: "group",
            subtopics: [
              { id: "lights", label: "Lights", type: "skill" },
              { id: "wipers", label: "Wipers", type: "skill" },
              { id: "demisters", label: "Demisters", type: "skill" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "stopping",
    title: "Stopping",
    topics: [
      {
        id: "msm_routine",
        label: "MSM Routine",
        type: "group",
        subtopics: [
          { id: "mirrors_stopping", label: "Mirrors", type: "skill" },
          { id: "signal_stopping", label: "Signal", type: "skill" },
          { id: "manoeuvre_stopping", label: "Manoeuvre", type: "skill" }
        ]
      }
    ]
  },
  {
    id: "moving_off",
    title: "Moving Off – POM routine",
    topics: [
      {
        id: "pom_routine",
        label: "POM routine",
        type: "group",
        subtopics: [
          { id: "prepare_gear_d_park_brake_down", label: "Prepare – Gear D, park brake down", type: "skill" },
          { id: "observe_6_point_checks", label: "Observe – 6 point checks", type: "skill" },
          { id: "manoeuvre_signal_drive_off", label: "Manoeuvre – signal and driving off", type: "skill" }
        ]
      }
    ]
  },
  {
    id: "use_of_mirrors",
    title: "Use of Mirrors",
    topics: [
      { id: "mirrors_before_signalling", label: "Before signalling", type: "skill" },
      { id: "mirrors_before_changing_lane", label: "Before changing lane", type: "skill" },
      { id: "mirrors_before_changing_direction", label: "Before changing direction", type: "skill" },
      { id: "mirrors_change_of_speed_new_road", label: "Change of speed – entering a new road", type: "skill" },
      { id: "mirrors_traffic_and_traffic_lights", label: "Traffic / traffic lights", type: "skill" },
      { id: "mirrors_change_of_speed_slowing_down", label: "Change of speed – before/whilst slowing down", type: "skill" }
    ]
  },
  {
    id: "use_of_signals",
    title: "Use of Signals",
    topics: [
      { id: "signals_indicators_changing_direction", label: "Indicators (changing direction)", type: "skill" },
      { id: "signals_road_position_overtaking_parked_cars", label: "Road position (overtaking parked cars)", type: "skill" },
      { id: "signals_horn", label: "Horn", type: "skill" },
      { id: "signals_brake_and_headlights", label: "Brake and headlights", type: "skill" },
      { id: "signals_arm_signal", label: "Arm signal", type: "skill" },
      { id: "signals_hazard_lights", label: "Hazard lights", type: "skill" }
    ]
  },
  {
    id: "junctions_turning_emerging",
    title: "Junctions – Turning and emerging",
    topics: [
      { id: "junctions_turning_emerging_right", label: "Turning and emerging right", type: "skill" },
      { id: "junctions_turning_emerging_left", label: "Turning and emerging left", type: "skill" },
      { id: "junctions_filter_lane_turning_right", label: "With filter lane turning right", type: "skill" },
      { id: "junctions_open_and_closed", label: "Open and closed junctions", type: "skill" }
    ]
  },
  {
    id: "meeting_and_dealing_with_traffic",
    title: "Meeting and dealing with other traffic",
    topics: [
      { id: "meeting_parked_cars", label: "Parked cars", type: "skill" },
      { id: "meeting_priorities", label: "Priorities", type: "skill" },
      { id: "meeting_forward_planning", label: "Forward planning", type: "skill" }
    ]
  },
  {
    id: "crossroads",
    title: "Crossroads",
    topics: [
      { id: "crossroads_no_traffic_lights", label: "No traffic lights", type: "skill" },
      { id: "crossroads_traffic_light_operated", label: "Traffic light operated", type: "skill" }
    ]
  },
  {
    id: "roundabouts",
    title: "Roundabouts",
    topics: [
      {
        id: "mini_roundabouts",
        label: "Mini roundabouts",
        type: "group",
        subtopics: [
          { id: "mini_roundabout_left", label: "Mini – left", type: "skill" },
          { id: "mini_roundabout_ahead", label: "Mini – road ahead", type: "skill" },
          { id: "mini_roundabout_right", label: "Mini – right", type: "skill" }
        ]
      },
      {
        id: "standard_roundabouts",
        label: "Standard roundabouts",
        type: "group",
        subtopics: [
          { id: "standard_roundabout_left", label: "Standard – left", type: "skill" },
          { id: "standard_roundabout_ahead", label: "Standard – road ahead", type: "skill" },
          { id: "standard_roundabout_right", label: "Standard – right", type: "skill" }
        ]
      },
      {
        id: "multilane_roundabouts",
        label: "Multilane roundabouts",
        type: "group",
        subtopics: [
          { id: "multilane_roundabout_two_lanes", label: "Multilane – 2 lanes", type: "skill" },
          { id: "multilane_roundabout_three_plus_lanes", label: "Multilane – 3 or more lanes", type: "skill" },
          { id: "multilane_roundabout_brighton_hill", label: "Brighton Hill", type: "skill" }
        ]
      }
    ]
  },
  {
    id: "dual_carriageways",
    title: "Dual carriageways",
    topics: [
      { id: "dual_carriageways_joining", label: "Joining", type: "skill" },
      { id: "dual_carriageways_exiting", label: "Exiting", type: "skill" },
      { id: "dual_carriageways_in_carriage_dealing_with_slip_roads", label: "In the carriage – dealing with cars joining from slip road", type: "skill" }
    ]
  },
  {
    id: "manoeuvres",
    title: "Manoeuvres",
    topics: [
      {
        id: "forward_bay_parking",
        label: "Forward bay – reverse out",
        type: "group",
        subtopics: [
          { id: "forward_bay_reverse_out_busy", label: "Busy car park", type: "skill" },
          { id: "forward_bay_reverse_out_less_busy", label: "Less busy car park", type: "skill" }
        ]
      },
      {
        id: "reverse_bay_parking",
        label: "Reverse bay",
        type: "group",
        subtopics: [
          { id: "reverse_bay_busy", label: "Busy car park", type: "skill" },
          { id: "reverse_bay_less_busy", label: "Less busy car park", type: "skill" }
        ]
      },
      { id: "manoeuvre_pull_over_right_reverse_straight", label: "Pull over right, reverse straight", type: "skill" },
      { id: "manoeuvre_parallel_park", label: "Parallel park", type: "skill" },
      { id: "manoeuvre_reversing_in_side_road", label: "Reversing in a side road", type: "skill" },
      { id: "manoeuvre_three_point_turn", label: "Three point turn in road", type: "skill" }
    ]
  },
  {
    id: "emergency_stop",
    title: "Emergency stop",
    topics: [
      { id: "emergency_stop_core_skill", label: "Emergency stop", type: "skill" }
    ]
  },
  {
    id: "pedestrian_crossings",
    title: "Pedestrian crossings",
    topics: [
      { id: "crossing_zebra", label: "Zebra", type: "skill" },
      { id: "crossing_pelican", label: "Pelican", type: "skill" },
      { id: "crossing_toucan", label: "Toucan", type: "skill" }
    ]
  },
  {
    id: "making_progress_and_road_position",
    title: "Making progress and road position",
    topics: [
      {
        id: "appropriate_speed",
        label: "Appropriate speed",
        type: "group",
        subtopics: [
          { id: "speed_30_40_50_roads", label: "30, 40 and 50 mph roads", type: "skill" },
          { id: "speed_national_speed_limit_roads", label: "National speed limit roads", type: "skill" },
          { id: "speed_hump_roads", label: "Hump roads", type: "skill" }
        ]
      },
      { id: "lane_discipline", label: "Lane discipline", type: "skill" }
    ]
  },
  {
    id: "planning_skills",
    title: "Planning",
    topics: [
      { id: "planning_road_markings_and_signs", label: "Road markings and road signs", type: "skill" },
      { id: "planning_anticipating_other_road_users", label: "Anticipating the actions of other road users", type: "skill" }
    ]
  },
  {
    id: "independent_driving",
    title: "Independent driving and use of Sat Nav",
    topics: [
      { id: "independent_driving_following_road_signs", label: "Independent driving following road signs", type: "skill" },
      { id: "independent_driving_sat_nav", label: "Sat Nav", type: "skill" },
      { id: "independent_driving_country_roads", label: "Country roads", type: "skill" }
    ]
  },
  {
    id: "show_me_tell_me",
    title: "Show me, tell me questions",
    topics: [
      { id: "show_me_tell_me_core", label: "Show me, tell me questions", type: "skill" }
    ]
  }
];

export const mockTests = [
  { id: "mock_1", label: "Mock 1" },
  { id: "mock_2", label: "Mock 2" },
  { id: "mock_3", label: "Mock 3" }
];