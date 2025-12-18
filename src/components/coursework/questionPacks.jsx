export const questionPacks = {
  1: { // Legal Responsibilities
    id: "legal_responsibilities_mcq_v1",
    title: "Legal Responsibilities – Practice Questions",
    description: "Test your understanding of UK legal responsibilities for drivers, including fitness to drive, vehicle legality, supervision rules, mobile phone laws, and accident procedures.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "lr_q1",
        type: "multiple_choice",
        question: "What is a driver legally responsible for before driving?",
        options: [
          "Only ensuring the vehicle has fuel",
          "Being fit to drive and ensuring the vehicle is legal and roadworthy",
          "Checking the weather forecast",
          "Informing the police before every journey"
        ],
        correct_answer_index: 1
      },
      {
        id: "lr_q2",
        type: "multiple_choice",
        question: "Which of the following must be reported to the DVLA?",
        options: [
          "Any minor cold or flu",
          "Any medical condition that affects safe driving",
          "All short-term illnesses",
          "Only eyesight problems"
        ],
        correct_answer_index: 1
      },
      {
        id: "lr_q3",
        type: "multiple_choice",
        question: "What is the minimum distance from which a driver must be able to read a number plate?",
        options: [
          "10 metres",
          "15 metres",
          "20 metres",
          "25 metres"
        ],
        correct_answer_index: 2
      },
      {
        id: "lr_q4",
        type: "multiple_choice",
        question: "What must a driver do if they need glasses or contact lenses to meet the legal eyesight standard?",
        options: [
          "Wear them only on motorways",
          "Carry them in the vehicle",
          "Wear them whenever they drive",
          "Use them only during daylight"
        ],
        correct_answer_index: 2
      },
      {
        id: "lr_q5",
        type: "multiple_choice",
        question: "What is the safest option regarding alcohol if you plan to drive?",
        options: [
          "Stay below the legal limit",
          "Drink only with food",
          "Have one small drink",
          "Not drink alcohol at all"
        ],
        correct_answer_index: 3
      },
      {
        id: "lr_q6",
        type: "multiple_choice",
        question: "Which of the following can result in penalties for drug driving?",
        options: [
          "Only illegal drugs",
          "Only prescription drugs",
          "Illegal drugs and some medicines that cause drowsiness",
          "Only over-the-counter medicines"
        ],
        correct_answer_index: 2
      },
      {
        id: "lr_q7",
        type: "multiple_choice",
        question: "How often should drivers ideally take breaks on long journeys to reduce tiredness?",
        options: [
          "Every 30 minutes",
          "Every 1 hour",
          "Every 2 hours",
          "Only when feeling tired"
        ],
        correct_answer_index: 2
      },
      {
        id: "lr_q8",
        type: "multiple_choice",
        question: "What is the penalty for using a handheld mobile phone while driving?",
        options: [
          "3 penalty points and a warning",
          "6 penalty points and a £200 fine",
          "A fixed £50 fine only",
          "A driving ban in all cases"
        ],
        correct_answer_index: 1
      },
      {
        id: "lr_q9",
        type: "multiple_choice",
        question: "Which of the following is required if a vehicle is over 3 years old?",
        options: [
          "Road tax only",
          "Insurance only",
          "A valid MOT certificate",
          "Breakdown cover"
        ],
        correct_answer_index: 2
      },
      {
        id: "lr_q10",
        type: "multiple_choice",
        question: "What must a driver do if details are not exchanged after a collision?",
        options: [
          "Report it to the DVLA within 7 days",
          "Report it to the police within 24 hours",
          "Contact their insurer only",
          "Leave the scene if no one is injured"
        ],
        correct_answer_index: 1
      }
    ]
  },
  2: { // Safety Checks
    id: "safety_checks_mcq_v1",
    title: "Safety Checks Before You Drive – Practice Questions",
    description: "Test your understanding of pre-drive safety checks using the FLOWER acronym, plus final brake and steering checks.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "sc_q1",
        type: "multiple_choice",
        question: "Why should safety checks be carried out before starting the engine?",
        options: [
          "To save fuel",
          "To make sure the vehicle is comfortable",
          "To ensure the vehicle is safe, reliable and legal",
          "To avoid traffic delays"
        ],
        correct_answer_index: 2
      },
      {
        id: "sc_q2",
        type: "multiple_choice",
        question: "What does the acronym FLOWER help drivers remember?",
        options: [
          "Emergency procedures",
          "Key pre-drive safety checks",
          "Dashboard warning lights",
          "Engine start-up steps"
        ],
        correct_answer_index: 1
      },
      {
        id: "sc_q3",
        type: "multiple_choice",
        question: "What does the letter F in FLOWER stand for?",
        options: [
          "Fluids",
          "Fuel",
          "Filters",
          "Fan belt"
        ],
        correct_answer_index: 1
      },
      {
        id: "sc_q4",
        type: "multiple_choice",
        question: "Why is checking fuel before a journey important?",
        options: [
          "It improves tyre grip",
          "It reduces insurance costs",
          "Running low on fuel can be dangerous",
          "It prevents engine overheating"
        ],
        correct_answer_index: 2
      },
      {
        id: "sc_q5",
        type: "multiple_choice",
        question: "Which lights should be checked before driving?",
        options: [
          "Headlights only",
          "Brake lights only",
          "Headlights, rear lights, brake lights and indicators",
          "Interior lights only"
        ],
        correct_answer_index: 2
      },
      {
        id: "sc_q6",
        type: "multiple_choice",
        question: "What should you know when checking engine oil?",
        options: [
          "Only the oil colour",
          "Where the dipstick is and how to top up",
          "How often oil is changed at a garage",
          "That oil is optional for short journeys"
        ],
        correct_answer_index: 1
      },
      {
        id: "sc_q7",
        type: "multiple_choice",
        question: "What is the purpose of checking coolant, screenwash and wipers?",
        options: [
          "To reduce fuel use",
          "To improve engine noise",
          "To prevent overheating and maintain visibility",
          "To increase engine power"
        ],
        correct_answer_index: 2
      },
      {
        id: "sc_q8",
        type: "multiple_choice",
        question: "Which of the following is part of the Electrics check?",
        options: [
          "Tyre pressure",
          "Battery condition and warning lights",
          "Oil level",
          "Coolant temperature"
        ],
        correct_answer_index: 1
      },
      {
        id: "sc_q9",
        type: "multiple_choice",
        question: "What is the legal minimum tyre tread depth?",
        options: [
          "1.0 mm",
          "1.3 mm",
          "1.6 mm",
          "2.0 mm"
        ],
        correct_answer_index: 2
      },
      {
        id: "sc_q10",
        type: "multiple_choice",
        question: "Which final check should be done before driving off?",
        options: [
          "Adjusting the radio",
          "Pressing the brake pedal to check it feels firm",
          "Checking fuel prices",
          "Opening the bonnet"
        ],
        correct_answer_index: 1
      }
    ]
  },
  3: { // Vehicle Security
    id: "vehicle_security_mcq_v1",
    title: "Vehicle Security – Practice Questions",
    description: "Test your understanding of vehicle and personal security, including staying alert, protecting belongings, choosing safer parking, and using additional security measures.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "vs_q1",
        type: "multiple_choice",
        question: "What does vehicle security involve?",
        options: [
          "Driving faster to avoid danger",
          "Protecting your vehicle, its contents and your personal safety",
          "Locking the car only at night",
          "Parking as close as possible to your destination"
        ],
        correct_answer_index: 1
      },
      {
        id: "vs_q2",
        type: "multiple_choice",
        question: "When should you remain especially alert to your surroundings?",
        options: [
          "Only when driving on motorways",
          "Only when parking at home",
          "When approaching, entering or leaving your vehicle",
          "Only during daylight hours"
        ],
        correct_answer_index: 2
      },
      {
        id: "vs_q3",
        type: "multiple_choice",
        question: "Which behaviour can reduce your awareness and personal safety?",
        options: [
          "Checking mirrors regularly",
          "Wearing headphones that block outside sounds",
          "Observing traffic at junctions",
          "Keeping doors locked"
        ],
        correct_answer_index: 1
      },
      {
        id: "vs_q4",
        type: "multiple_choice",
        question: "Why is it a good idea to let someone know your travel plans?",
        options: [
          "It is required by law",
          "It helps them plan their journey",
          "It improves fuel efficiency",
          "It increases personal safety, especially when driving alone"
        ],
        correct_answer_index: 3
      },
      {
        id: "vs_q5",
        type: "multiple_choice",
        question: "When is it especially important to tell someone where you are going?",
        options: [
          "When driving short distances",
          "When travelling alone, at night or to unfamiliar places",
          "Only during bad weather",
          "When driving with passengers"
        ],
        correct_answer_index: 1
      },
      {
        id: "vs_q6",
        type: "multiple_choice",
        question: "How should valuable items be stored in your vehicle?",
        options: [
          "On the dashboard",
          "On the back seat",
          "Out of sight, such as in the boot or glovebox",
          "Hung from the mirror"
        ],
        correct_answer_index: 2
      },
      {
        id: "vs_q7",
        type: "multiple_choice",
        question: "Why should items not be left visible inside a parked car?",
        options: [
          "They can damage the interior",
          "They may fall while driving",
          "They can tempt opportunistic thieves",
          "They reduce fuel economy"
        ],
        correct_answer_index: 2
      },
      {
        id: "vs_q8",
        type: "multiple_choice",
        question: "Which is the safest place to park your vehicle?",
        options: [
          "An isolated area with no lighting",
          "A quiet road away from buildings",
          "A well-lit, busy area overlooked by buildings",
          "Anywhere as long as the car is locked"
        ],
        correct_answer_index: 2
      },
      {
        id: "vs_q9",
        type: "multiple_choice",
        question: "Which of the following is an example of an additional vehicle security measure?",
        options: [
          "Sat-nav",
          "Steering wheel lock",
          "Air conditioning",
          "Electric windows"
        ],
        correct_answer_index: 1
      },
      {
        id: "vs_q10",
        type: "multiple_choice",
        question: "Why do extra security devices reduce the risk of vehicle theft?",
        options: [
          "They make the car faster",
          "They improve engine performance",
          "They make the vehicle less attractive to thieves",
          "They lower insurance automatically"
        ],
        correct_answer_index: 2
      }
    ]
  },
  4: { // Cockpit Procedures (DSSSM)
    id: "cockpit_procedures_mcq_v1",
    title: "Cockpit Drill / DSSSM – Practice Questions",
    description: "Test your understanding of the Cockpit Drill (DSSSM): Doors, Seat, Steering, Seatbelt, and Mirrors. Build safe routines before every journey.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "cp_q1",
        type: "multiple_choice",
        question: "What is the purpose of the Cockpit Drill (DSSSM)?",
        options: [
          "To improve fuel efficiency",
          "To ensure the vehicle engine is warmed up",
          "To ensure the driver is safe, comfortable and in control",
          "To check traffic conditions"
        ],
        correct_answer_index: 2
      },
      {
        id: "cp_q2",
        type: "multiple_choice",
        question: "What does the letter D in DSSSM stand for?",
        options: [
          "Dashboard",
          "Doors",
          "Drive",
          "Distance"
        ],
        correct_answer_index: 1
      },
      {
        id: "cp_q3",
        type: "multiple_choice",
        question: "Why must all doors be securely closed before driving?",
        options: [
          "To improve fuel economy",
          "To reduce engine noise",
          "Open or loose doors can be dangerous and distracting",
          "To prevent the car alarm from sounding"
        ],
        correct_answer_index: 2
      },
      {
        id: "cp_q4",
        type: "multiple_choice",
        question: "Which is a sign that a door may not be properly closed?",
        options: [
          "The steering feels heavy",
          "A door-warning light on the dashboard",
          "The fuel gauge drops",
          "The mirrors move"
        ],
        correct_answer_index: 1
      },
      {
        id: "cp_q5",
        type: "multiple_choice",
        question: "When is your seating position correct?",
        options: [
          "When your arms are fully straight",
          "When you sit low and reclined",
          "When you can fully press the clutch without stretching",
          "When your head touches the roof"
        ],
        correct_answer_index: 2
      },
      {
        id: "cp_q6",
        type: "multiple_choice",
        question: "Why is correct seat adjustment important?",
        options: [
          "It improves comfort, control and reaction time",
          "It reduces tyre wear",
          "It increases engine power",
          "It helps navigation"
        ],
        correct_answer_index: 0
      },
      {
        id: "cp_q7",
        type: "multiple_choice",
        question: "What should you check when adjusting the steering wheel?",
        options: [
          "That it improves radio access",
          "That you can turn it fully without leaning forward",
          "That it blocks dashboard lights",
          "That it rests on your legs"
        ],
        correct_answer_index: 1
      },
      {
        id: "cp_q8",
        type: "multiple_choice",
        question: "What must be checked about your seatbelt before moving off?",
        options: [
          "That it looks clean",
          "That it is loose for comfort",
          "That it is not twisted and clicks securely into place",
          "That it is worn only on long journeys"
        ],
        correct_answer_index: 2
      },
      {
        id: "cp_q9",
        type: "multiple_choice",
        question: "Who is legally responsible for ensuring children under 14 wear seatbelts?",
        options: [
          "The children themselves",
          "The front passenger",
          "The vehicle owner",
          "The driver"
        ],
        correct_answer_index: 3
      },
      {
        id: "cp_q10",
        type: "multiple_choice",
        question: "When should mirrors be adjusted?",
        options: [
          "While driving at low speed",
          "While waiting at traffic lights",
          "Before starting the journey",
          "After moving off"
        ],
        correct_answer_index: 2
      }
    ]
  },
  5: { // Main Car Controls
    id: "main_car_controls_mcq_v1",
    title: "Main Car Controls – Practice Questions",
    description: "Test your understanding of the main car controls: foot controls, hand controls, and ancillary controls, and how they support safe, smooth driving.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "mcc_q1",
        type: "multiple_choice",
        question: "Why is it important to understand the main car controls?",
        options: [
          "To improve navigation skills",
          "To drive safely and confidently",
          "To reduce insurance costs",
          "To pass the theory test only"
        ],
        correct_answer_index: 1
      },
      {
        id: "mcc_q2",
        type: "multiple_choice",
        question: "How are the main car controls divided?",
        options: [
          "Primary, secondary and emergency controls",
          "Interior, exterior and engine controls",
          "Foot controls, hand controls and ancillary controls",
          "Manual and automatic controls"
        ],
        correct_answer_index: 2
      },
      {
        id: "mcc_q3",
        type: "multiple_choice",
        question: "What is the main function of the accelerator?",
        options: [
          "To stop the car",
          "To control steering direction",
          "To control the speed of the car",
          "To change gears"
        ],
        correct_answer_index: 2
      },
      {
        id: "mcc_q4",
        type: "multiple_choice",
        question: "How should the footbrake be applied for good control?",
        options: [
          "Press hard and quickly",
          "Press suddenly and release sharply",
          "Apply progressive pressure smoothly",
          "Pump the brake repeatedly"
        ],
        correct_answer_index: 2
      },
      {
        id: "mcc_q5",
        type: "multiple_choice",
        question: "What is the purpose of the clutch in a manual car?",
        options: [
          "To slow the vehicle",
          "To steer the car",
          "To separate the engine from the wheels",
          "To hold the car stationary"
        ],
        correct_answer_index: 2
      },
      {
        id: "mcc_q6",
        type: "multiple_choice",
        question: "Which foot controls are found in an automatic car?",
        options: [
          "Accelerator, brake and clutch",
          "Accelerator and clutch only",
          "Brake and clutch only",
          "Accelerator and brake only"
        ],
        correct_answer_index: 3
      },
      {
        id: "mcc_q7",
        type: "multiple_choice",
        question: "What is the correct hand position on the steering wheel for maximum control?",
        options: [
          "12-and-6",
          "8-and-4",
          "9-and-3 or 10-and-2",
          "Any comfortable position"
        ],
        correct_answer_index: 2
      },
      {
        id: "mcc_q8",
        type: "multiple_choice",
        question: "What is the main purpose of the handbrake?",
        options: [
          "To slow the car while moving",
          "To prevent the car from rolling when stationary",
          "To change gears",
          "To improve steering control"
        ],
        correct_answer_index: 1
      },
      {
        id: "mcc_q9",
        type: "multiple_choice",
        question: "When should indicators be used?",
        options: [
          "After completing a turn",
          "Only on motorways",
          "In good time before turning or changing lanes",
          "Only when other vehicles are nearby"
        ],
        correct_answer_index: 2
      },
      {
        id: "mcc_q10",
        type: "multiple_choice",
        question: "Why are demisters important?",
        options: [
          "They improve fuel efficiency",
          "They reduce engine temperature",
          "They clear mist and ensure good visibility",
          "They improve passenger comfort only"
        ],
        correct_answer_index: 2
      }
    ]
  },
  6: { // Stopping Safely
    id: "stopping_safely_mcq_v1",
    title: "Stopping Safely – Practice Questions",
    description: "Test your understanding of stopping safely using DVSA routines MSM (Mirror, Signal, Manoeuvre) and PSL (Position, Speed, Look), including choosing a safe stopping position and securing the vehicle.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "ss_q1",
        type: "multiple_choice",
        question: "What is the main aim of stopping safely?",
        options: [
          "To stop as quickly as possible",
          "To stop without using mirrors",
          "To stop in a controlled, legal and predictable way",
          "To stop close to other vehicles"
        ],
        correct_answer_index: 2
      },
      {
        id: "ss_q2",
        type: "multiple_choice",
        question: "Which two DVSA routines are used together to stop safely?",
        options: [
          "MSPS and LADA",
          "MSM and PSL",
          "POM and MSPS",
          "LADA and PSL"
        ],
        correct_answer_index: 1
      },
      {
        id: "ss_q3",
        type: "multiple_choice",
        question: "What does the M stand for in the MSM routine?",
        options: [
          "Manoeuvre",
          "Move",
          "Mirrors",
          "Maintain speed"
        ],
        correct_answer_index: 2
      },
      {
        id: "ss_q4",
        type: "multiple_choice",
        question: "Which mirrors should be checked first when planning to stop?",
        options: [
          "Door mirror only",
          "Interior mirror first, then the relevant door mirror",
          "Both door mirrors together",
          "Interior mirror only"
        ],
        correct_answer_index: 1
      },
      {
        id: "ss_q5",
        type: "multiple_choice",
        question: "When should you signal before stopping?",
        options: [
          "Every time you stop",
          "Only when pedestrians are nearby",
          "If it will benefit other road users",
          "After you have stopped"
        ],
        correct_answer_index: 2
      },
      {
        id: "ss_q6",
        type: "multiple_choice",
        question: "What does the P in the PSL routine stand for?",
        options: [
          "Prepare",
          "Pedal",
          "Position",
          "Parallel"
        ],
        correct_answer_index: 2
      },
      {
        id: "ss_q7",
        type: "multiple_choice",
        question: "How should speed be reduced when stopping safely?",
        options: [
          "By braking sharply at the last moment",
          "By coasting in neutral",
          "By using progressive, gentle braking",
          "By using the handbrake"
        ],
        correct_answer_index: 2
      },
      {
        id: "ss_q8",
        type: "multiple_choice",
        question: "What should you check during the Look phase of PSL?",
        options: [
          "Only the speedometer",
          "Only the road ahead",
          "Mirrors and surroundings for pedestrians, cyclists and hazards",
          "The dashboard warning lights"
        ],
        correct_answer_index: 2
      },
      {
        id: "ss_q9",
        type: "multiple_choice",
        question: "What is a good stopping position?",
        options: [
          "Touching the kerb",
          "Blocking a driveway",
          "Parallel to the kerb and not causing obstruction",
          "As close as possible to a junction"
        ],
        correct_answer_index: 2
      },
      {
        id: "ss_q10",
        type: "multiple_choice",
        question: "What must you do after the car has stopped to secure it?",
        options: [
          "Leave the engine running",
          "Apply the handbrake and select neutral or Park",
          "Keep your foot on the brake",
          "Turn the steering wheel sharply"
        ],
        correct_answer_index: 1
      }
    ]
  },
  7: { // Moving Off Safely (POM)
    id: "moving_off_mcq_v1",
    title: "Moving Off Safely – Practice Questions",
    description: "Test your understanding of moving off safely using the DVSA POM routine (Prepare, Observe, Move), including correct preparation, the 6-point observation check, and smooth, controlled movement.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "mo_q1",
        type: "multiple_choice",
        question: "What does moving off safely aim to achieve?",
        options: [
          "Leaving the kerb as quickly as possible",
          "Joining traffic smoothly without causing danger or inconvenience",
          "Increasing speed rapidly",
          "Avoiding the use of mirrors"
        ],
        correct_answer_index: 1
      },
      {
        id: "mo_q2",
        type: "multiple_choice",
        question: "What does the DVSA-approved routine POM stand for?",
        options: [
          "Prepare, Observe, Manoeuvre",
          "Position, Observe, Move",
          "Prepare, Observe, Move",
          "Plan, Observe, Manoeuvre"
        ],
        correct_answer_index: 2
      },
      {
        id: "mo_q3",
        type: "multiple_choice",
        question: "What is the main purpose of the Prepare stage?",
        options: [
          "To check mirrors",
          "To make sure the car is fully ready to move smoothly",
          "To look for hazards",
          "To steer away from the kerb"
        ],
        correct_answer_index: 1
      },
      {
        id: "mo_q4",
        type: "multiple_choice",
        question: "Which action is part of preparing to move off in a manual car?",
        options: [
          "Selecting neutral",
          "Raising the clutch to the bite point",
          "Applying the handbrake firmly",
          "Steering away from the kerb"
        ],
        correct_answer_index: 1
      },
      {
        id: "mo_q5",
        type: "multiple_choice",
        question: "What must a driver do when preparing to move off in an automatic car?",
        options: [
          "Press the clutch pedal",
          "Select 1st gear",
          "Keep the foot on the brake and select Drive",
          "Use the handbrake only"
        ],
        correct_answer_index: 2
      },
      {
        id: "mo_q6",
        type: "multiple_choice",
        question: "Which stage of POM is the most important for safety?",
        options: [
          "Prepare",
          "Observe",
          "Move",
          "Position"
        ],
        correct_answer_index: 1
      },
      {
        id: "mo_q7",
        type: "multiple_choice",
        question: "What is the correct order of the 6-point observation check?",
        options: [
          "Interior mirror → Ahead → Door mirrors → Blind spots",
          "Left blind spot → Left mirror → Ahead → Interior mirror → Right mirror → Right blind spot",
          "Ahead → Interior mirror → Door mirrors → Blind spots",
          "Right blind spot → Right mirror → Interior mirror → Ahead → Left mirror → Left blind spot"
        ],
        correct_answer_index: 1
      },
      {
        id: "mo_q8",
        type: "multiple_choice",
        question: "Why is checking the right blind spot especially important?",
        options: [
          "It shows traffic ahead",
          "It helps with steering control",
          "It is where cyclists and motorcyclists may be hidden",
          "It improves fuel efficiency"
        ],
        correct_answer_index: 2
      },
      {
        id: "mo_q9",
        type: "multiple_choice",
        question: "What should you do if a road user may be affected when you are about to move off?",
        options: [
          "Move off quickly",
          "Sound the horn",
          "Wait until it is clearly safe",
          "Signal and move immediately"
        ],
        correct_answer_index: 2
      },
      {
        id: "mo_q10",
        type: "multiple_choice",
        question: "After moving off, what should you do next?",
        options: [
          "Stop again immediately",
          "Cancel any signal and check mirrors",
          "Accelerate hard",
          "Apply the handbrake"
        ],
        correct_answer_index: 1
      }
    ]
  },
  8: { // Use of Mirrors
    id: "use_of_mirrors_mcq_v1",
    title: "Use of Mirrors – Practice Questions",
    description: "Test your understanding of correct mirror use, including types of mirrors, when to check them, how they fit into the MSM routine, and the importance of blind spot checks.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "um_q1",
        type: "multiple_choice",
        question: "Why is correct mirror use essential when driving?",
        options: [
          "To reduce fuel consumption",
          "To stay aware of surroundings and make safe decisions",
          "To improve engine performance",
          "To avoid using indicators"
        ],
        correct_answer_index: 1
      },
      {
        id: "um_q2",
        type: "multiple_choice",
        question: "What is one key benefit of good mirror use?",
        options: [
          "It allows faster driving",
          "It helps judge the speed and distance of traffic behind",
          "It removes the need to signal",
          "It replaces blind spot checks"
        ],
        correct_answer_index: 1
      },
      {
        id: "um_q3",
        type: "multiple_choice",
        question: "Which mirror gives the most accurate sense of distance?",
        options: [
          "Left door mirror",
          "Right door mirror",
          "Interior mirror",
          "All mirrors give the same view"
        ],
        correct_answer_index: 2
      },
      {
        id: "um_q4",
        type: "multiple_choice",
        question: "When should you check your mirrors?",
        options: [
          "Only when turning",
          "Only when moving off",
          "Before any change in speed or direction",
          "Only in heavy traffic"
        ],
        correct_answer_index: 2
      },
      {
        id: "um_q5",
        type: "multiple_choice",
        question: "Mirror use forms which part of the MSM routine?",
        options: [
          "Signal",
          "Manoeuvre",
          "Mirrors",
          "Move"
        ],
        correct_answer_index: 2
      },
      {
        id: "um_q6",
        type: "multiple_choice",
        question: "What should you judge when checking your mirrors?",
        options: [
          "Road surface only",
          "Who is behind you, how close they are and how fast they are approaching",
          "Engine speed",
          "Weather conditions"
        ],
        correct_answer_index: 1
      },
      {
        id: "um_q7",
        type: "multiple_choice",
        question: "Which mirrors should be checked before turning left?",
        options: [
          "Interior mirror only",
          "Interior mirror and right mirror",
          "Interior mirror and left mirror",
          "Left mirror only"
        ],
        correct_answer_index: 2
      },
      {
        id: "um_q8",
        type: "multiple_choice",
        question: "What should you do before braking firmly?",
        options: [
          "Check the left mirror only",
          "Check the interior mirror",
          "Sound the horn",
          "Signal immediately"
        ],
        correct_answer_index: 1
      },
      {
        id: "um_q9",
        type: "multiple_choice",
        question: "Why must blind spot checks be used as well as mirrors?",
        options: [
          "Mirrors are optional",
          "Blind spots are fully visible in mirrors",
          "Mirrors do not show all areas around the vehicle",
          "Blind spot checks replace mirror checks"
        ],
        correct_answer_index: 2
      },
      {
        id: "um_q10",
        type: "multiple_choice",
        question: "When should you check your blind spot?",
        options: [
          "Only on motorways",
          "When moving off, overtaking or changing lanes",
          "Only when parking",
          "Only at night"
        ],
        correct_answer_index: 1
      }
    ]
  },
  9: { // Use of Signals
    id: "use_of_signals_mcq_v1",
    title: "Use of Signals – Practice Questions",
    description: "Test your understanding of correct signalling, including purpose, types of signals, timing, the golden rule of signalling, and correct use within the MSM routine.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "us_q1",
        type: "multiple_choice",
        question: "What is the main purpose of using signals when driving?",
        options: [
          "To improve fuel efficiency",
          "To communicate intentions clearly to other road users",
          "To show confidence",
          "To replace mirror checks"
        ],
        correct_answer_index: 1
      },
      {
        id: "us_q2",
        type: "multiple_choice",
        question: "Signals must always be which of the following?",
        options: [
          "Frequent, loud and obvious",
          "Early, constant and repeated",
          "Timely, clear and necessary",
          "Automatic and continuous"
        ],
        correct_answer_index: 2
      },
      {
        id: "us_q3",
        type: "multiple_choice",
        question: "Why should signals never mislead other road users?",
        options: [
          "It may delay your journey",
          "It can cause confusion and increase collision risk",
          "It wastes fuel",
          "It damages the indicators"
        ],
        correct_answer_index: 1
      },
      {
        id: "us_q4",
        type: "multiple_choice",
        question: "When should indicator signals be cancelled?",
        options: [
          "After checking mirrors",
          "After completing the manoeuvre",
          "When traffic is clear",
          "Only at junctions"
        ],
        correct_answer_index: 1
      },
      {
        id: "us_q5",
        type: "multiple_choice",
        question: "What is the main function of brake lights?",
        options: [
          "To warn pedestrians",
          "To signal lane changes",
          "To warn drivers behind that you are slowing down",
          "To improve night visibility"
        ],
        correct_answer_index: 2
      },
      {
        id: "us_q6",
        type: "multiple_choice",
        question: "When may hazard warning lights be used while moving?",
        options: [
          "At any time in heavy traffic",
          "In built-up areas at night",
          "On a motorway or dual carriageway to warn of sudden danger ahead",
          "When overtaking slowly"
        ],
        correct_answer_index: 2
      },
      {
        id: "us_q7",
        type: "multiple_choice",
        question: "What is the \"golden rule\" of using signals?",
        options: [
          "Always signal, even if no one is around",
          "Signal early in every situation",
          "Only signal if it benefits other road users",
          "Signal after starting the manoeuvre"
        ],
        correct_answer_index: 2
      },
      {
        id: "us_q8",
        type: "multiple_choice",
        question: "Which of the following is an example of a misleading signal?",
        options: [
          "Signalling right before overtaking",
          "Cancelling a signal after turning",
          "Signalling left when passing a side road",
          "Signalling at a roundabout exit"
        ],
        correct_answer_index: 2
      },
      {
        id: "us_q9",
        type: "multiple_choice",
        question: "In the MSM routine, when should you signal?",
        options: [
          "Before checking mirrors",
          "After starting the manoeuvre",
          "After checking mirrors and before manoeuvring",
          "At the same time as steering"
        ],
        correct_answer_index: 2
      },
      {
        id: "us_q10",
        type: "multiple_choice",
        question: "How should signal timing change at higher speeds?",
        options: [
          "Signals should be given later",
          "Signals should be avoided",
          "Signals should be given earlier to allow more reaction time",
          "Signals should be held on continuously"
        ],
        correct_answer_index: 2
      }
    ]
  },
  10: { // Junctions
    id: "junctions_mcq_v1",
    title: "Junctions – Practice Questions",
    description: "Test your understanding of junctions, including types of junctions, the MSPSL routine, the LADA observation method, correct positioning, speed control, priority rules, and pedestrian awareness.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "jn_q1",
        type: "multiple_choice",
        question: "Why are junctions considered one of the most common driving hazards?",
        options: [
          "They require high speeds",
          "They involve complex vehicle controls",
          "They require careful observation, judgement, speed and positioning",
          "They are always poorly marked"
        ],
        correct_answer_index: 2
      },
      {
        id: "jn_q2",
        type: "multiple_choice",
        question: "Which routines are used together when dealing with junctions?",
        options: [
          "MSM and POM",
          "MSPSL and LADA",
          "PSL and MSPS",
          "LADA and POM"
        ],
        correct_answer_index: 1
      },
      {
        id: "jn_q3",
        type: "multiple_choice",
        question: "What does MSPSL stand for?",
        options: [
          "Mirror, Speed, Position, Signal, Look",
          "Manoeuvre, Signal, Position, Speed, Look",
          "Mirror, Signal, Position, Speed, Look",
          "Mirror, Signal, Plan, Stop, Look"
        ],
        correct_answer_index: 2
      },
      {
        id: "jn_q4",
        type: "multiple_choice",
        question: "Which type of junction usually requires you to give way when joining a main road?",
        options: [
          "Crossroads",
          "Roundabout",
          "T-junction",
          "Unmarked junction"
        ],
        correct_answer_index: 2
      },
      {
        id: "jn_q5",
        type: "multiple_choice",
        question: "How should you position the car when turning left at a junction?",
        options: [
          "Close to the kerb",
          "Just left of the centre line",
          "In the centre of your lane",
          "In the opposite lane"
        ],
        correct_answer_index: 2
      },
      {
        id: "jn_q6",
        type: "multiple_choice",
        question: "What is the correct positioning when turning right at a junction?",
        options: [
          "Close to the kerb",
          "In the centre of the road",
          "Just left of the centre line or in a right-turn lane",
          "On the pavement edge"
        ],
        correct_answer_index: 2
      },
      {
        id: "jn_q7",
        type: "multiple_choice",
        question: "What does the L in the LADA routine stand for?",
        options: [
          "Lane",
          "Look",
          "Limit",
          "Light"
        ],
        correct_answer_index: 1
      },
      {
        id: "jn_q8",
        type: "multiple_choice",
        question: "What should you do if visibility is restricted when emerging from a junction?",
        options: [
          "Accelerate quickly",
          "Rely on other drivers stopping",
          "Use the creep and peep technique",
          "Sound the horn"
        ],
        correct_answer_index: 2
      },
      {
        id: "jn_q9",
        type: "multiple_choice",
        question: "At an unmarked junction, who has priority?",
        options: [
          "Traffic from the left",
          "Traffic from the right",
          "Vehicles on the wider road",
          "No one has automatic priority"
        ],
        correct_answer_index: 3
      },
      {
        id: "jn_q10",
        type: "multiple_choice",
        question: "What must you do if pedestrians have started crossing the road you are turning into?",
        options: [
          "Continue if they are far away",
          "Sound the horn",
          "Give way to the pedestrians",
          "Turn quickly before they reach your path"
        ],
        correct_answer_index: 2
      }
    ]
  },
  11: { // Use of Speed
    id: "use_of_speed_mcq_v1",
    title: "Use of Speed – Practice Questions",
    description: "Test your understanding of choosing a safe, legal and appropriate speed, including the golden rules of speed, stopping distances, hazard perception, and following distances.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "uos_q1",
        type: "multiple_choice",
        question: "Why is correct use of speed essential for safe driving?",
        options: [
          "It improves engine performance",
          "It affects stopping distance, reaction time and vehicle control",
          "It allows you to overtake more easily",
          "It reduces journey time"
        ],
        correct_answer_index: 1
      },
      {
        id: "uos_q2",
        type: "multiple_choice",
        question: "What does it mean when we say \"the speed limit is not a target\"?",
        options: [
          "You should always drive below the limit",
          "You should aim to reach the limit quickly",
          "The limit is the maximum in ideal conditions, not always the safest speed",
          "Speed limits only apply in towns"
        ],
        correct_answer_index: 2
      },
      {
        id: "uos_q3",
        type: "multiple_choice",
        question: "Which of the following is one of the three golden rules of speed?",
        options: [
          "Comfortable speed",
          "Fast speed",
          "Safe speed",
          "Competitive speed"
        ],
        correct_answer_index: 2
      },
      {
        id: "uos_q4",
        type: "multiple_choice",
        question: "When should you drive below the speed limit?",
        options: [
          "Only during driving tests",
          "Only at night",
          "When conditions such as weather, traffic or visibility require it",
          "Never – the limit is always safe"
        ],
        correct_answer_index: 2
      },
      {
        id: "uos_q5",
        type: "multiple_choice",
        question: "Which factor would require you to reduce your speed?",
        options: [
          "A straight, empty road in daylight",
          "Wet or icy road surfaces",
          "A new vehicle with good brakes",
          "A clear motorway"
        ],
        correct_answer_index: 1
      },
      {
        id: "uos_q6",
        type: "multiple_choice",
        question: "What happens to stopping distance as speed increases?",
        options: [
          "It stays the same",
          "It decreases",
          "It increases slightly",
          "It increases significantly, especially braking distance"
        ],
        correct_answer_index: 3
      },
      {
        id: "uos_q7",
        type: "multiple_choice",
        question: "What is the correct formula for stopping distance?",
        options: [
          "Speed + braking",
          "Thinking distance + braking distance",
          "Reaction time × speed",
          "Speed ÷ distance"
        ],
        correct_answer_index: 1
      },
      {
        id: "uos_q8",
        type: "multiple_choice",
        question: "Why should you reduce speed when approaching hazards?",
        options: [
          "To save fuel",
          "To avoid using the brakes",
          "To give yourself more time to observe and react",
          "To warn other drivers"
        ],
        correct_answer_index: 2
      },
      {
        id: "uos_q9",
        type: "multiple_choice",
        question: "What is good practice for smooth and safe acceleration?",
        options: [
          "Accelerate hard to reach speed quickly",
          "Use sudden bursts of speed",
          "Accelerate gently and progressively",
          "Keep changing speed"
        ],
        correct_answer_index: 2
      },
      {
        id: "uos_q10",
        type: "multiple_choice",
        question: "What following distance should you use in good conditions?",
        options: [
          "One second",
          "Two seconds",
          "Five seconds",
          "Ten seconds"
        ],
        correct_answer_index: 1
      }
    ]
  },
  12: { // Meeting Traffic
    id: "meeting_traffic_mcq_v1",
    title: "Meeting and Dealing With Other Traffic – Practice Questions",
    description: "Test your understanding of meeting oncoming vehicles, passing parked cars, using passing places, overtaking safely, and protecting vulnerable road users using routines like MSM/PSL and LADA.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "mt_q1",
        type: "multiple_choice",
        question: "Why is safe interaction with other traffic essential?",
        options: [
          "To reduce journey time",
          "To demonstrate confidence",
          "To avoid collisions and keep traffic flowing",
          "To avoid using mirrors"
        ],
        correct_answer_index: 2
      },
      {
        id: "mt_q2",
        type: "multiple_choice",
        question: "Which of the following is a key requirement when meeting other traffic?",
        options: [
          "High speed",
          "Aggressive positioning",
          "Good observation and anticipation",
          "Frequent use of the horn"
        ],
        correct_answer_index: 2
      },
      {
        id: "mt_q3",
        type: "multiple_choice",
        question: "What should you do even if you believe you have priority?",
        options: [
          "Continue without slowing",
          "Force your way through",
          "Be prepared to slow down or give way",
          "Flash your headlights"
        ],
        correct_answer_index: 2
      },
      {
        id: "mt_q4",
        type: "multiple_choice",
        question: "Why is anticipation important when meeting other traffic?",
        options: [
          "It allows faster driving",
          "It reduces fuel use",
          "It helps you prepare for others' unexpected actions",
          "It removes the need to brake"
        ],
        correct_answer_index: 2
      },
      {
        id: "mt_q5",
        type: "multiple_choice",
        question: "How should you use passing places on narrow roads?",
        options: [
          "Always use the one closest to you",
          "Pull into a passing place on your left when safe",
          "Cross the road to reach a passing place",
          "Ignore passing places if you have priority"
        ],
        correct_answer_index: 1
      },
      {
        id: "mt_q6",
        type: "multiple_choice",
        question: "If parked vehicles narrow the road, who should normally give way?",
        options: [
          "The larger vehicle",
          "The faster vehicle",
          "The driver who reaches the obstruction first",
          "The driver on the main road"
        ],
        correct_answer_index: 2
      },
      {
        id: "mt_q7",
        type: "multiple_choice",
        question: "What should you do if there is not enough space for you and oncoming traffic?",
        options: [
          "Accelerate through the gap",
          "Sound the horn",
          "Slow down or stop and let the other vehicle pass",
          "Drive closer to the kerb"
        ],
        correct_answer_index: 2
      },
      {
        id: "mt_q8",
        type: "multiple_choice",
        question: "What routine should you use when passing parked cars?",
        options: [
          "POM only",
          "LADA only",
          "MSM and PSL",
          "MSPSL only"
        ],
        correct_answer_index: 2
      },
      {
        id: "mt_q9",
        type: "multiple_choice",
        question: "What is the minimum recommended passing distance when overtaking a cyclist at speeds up to 30 mph?",
        options: [
          "0.5 metres",
          "1.0 metre",
          "1.5 metres",
          "2.5 metres"
        ],
        correct_answer_index: 2
      },
      {
        id: "mt_q10",
        type: "multiple_choice",
        question: "How should you behave when passing horses on the road?",
        options: [
          "Pass quickly to avoid delay",
          "Sound the horn to warn them",
          "Pass very slowly and give a wide berth",
          "Rev the engine to be noticed"
        ],
        correct_answer_index: 2
      }
    ]
  },
  13: { // Crossroads
    id: "crossroads_mcq_v1",
    title: "Crossroads – Practice Questions",
    description: "Test your understanding of crossroads, including types of crossroads, priority, use of MSM and MSPSL routines, flexible observation using LADA, safe right/left turns, going ahead safely, and handling limited visibility.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "cr_q1",
        type: "multiple_choice",
        question: "Why are crossroads considered more challenging than many other junctions?",
        options: [
          "They always have traffic lights",
          "Several streams of traffic can meet at the same point",
          "They are usually unmarked",
          "They require higher speeds"
        ],
        correct_answer_index: 1
      },
      {
        id: "cr_q2",
        type: "multiple_choice",
        question: "Which routines should be used together when dealing with crossroads?",
        options: [
          "POM and LADA",
          "MSM and POM",
          "MSM and MSPSL",
          "PSL and POM"
        ],
        correct_answer_index: 2
      },
      {
        id: "cr_q3",
        type: "multiple_choice",
        question: "What does MSPSL stand for?",
        options: [
          "Mirror, Speed, Position, Signal, Look",
          "Manoeuvre, Signal, Position, Speed, Look",
          "Mirror, Signal, Position, Speed, Look",
          "Mirror, Signal, Plan, Stop, Look"
        ],
        correct_answer_index: 2
      },
      {
        id: "cr_q4",
        type: "multiple_choice",
        question: "At an uncontrolled (unmarked) crossroads, who has priority?",
        options: [
          "Traffic from the right",
          "Traffic on the wider road",
          "Vehicles going straight ahead",
          "No one has automatic priority"
        ],
        correct_answer_index: 3
      },
      {
        id: "cr_q5",
        type: "multiple_choice",
        question: "What observation method should be used at crossroads instead of a fixed \"right–left–right\" pattern?",
        options: [
          "MSM",
          "PSL",
          "POM",
          "LADA"
        ],
        correct_answer_index: 3
      },
      {
        id: "cr_q6",
        type: "multiple_choice",
        question: "What does the A in LADA stand for?",
        options: [
          "Act",
          "Assess",
          "Anticipate",
          "Accelerate"
        ],
        correct_answer_index: 1
      },
      {
        id: "cr_q7",
        type: "multiple_choice",
        question: "Which right-turn method at crossroads is usually safer and more common?",
        options: [
          "Nearside-to-nearside",
          "Offside-to-offside",
          "Turning across the centre line",
          "Cutting the corner"
        ],
        correct_answer_index: 1
      },
      {
        id: "cr_q8",
        type: "multiple_choice",
        question: "When going straight ahead at a crossroads, what should you do?",
        options: [
          "Assume it is safe if you have priority",
          "Maintain speed without checking",
          "Use MSM and MSPSL with careful observation",
          "Only check the road ahead"
        ],
        correct_answer_index: 2
      },
      {
        id: "cr_q9",
        type: "multiple_choice",
        question: "What should you do if visibility is poor at a crossroads?",
        options: [
          "Accelerate to clear the junction quickly",
          "Sound the horn",
          "Use the \"creep and peep\" technique",
          "Rely on other drivers stopping"
        ],
        correct_answer_index: 2
      },
      {
        id: "cr_q10",
        type: "multiple_choice",
        question: "What should you do if you feel unsure when deciding whether to proceed at a crossroads?",
        options: [
          "Move forward quickly",
          "Commit to the manoeuvre",
          "Wait and reassess until it is clearly safe",
          "Follow the vehicle in front"
        ],
        correct_answer_index: 2
      }
    ]
  },
  14: { // Roundabouts
    id: "roundabouts_mcq_v1",
    title: "Roundabouts – Practice Questions",
    description: "Test your understanding of roundabouts, including priority rules, use of MSM, MSPSL and LADA routines, lane discipline, signalling, mini and spiral roundabouts, and dealing with hazards and vulnerable road users.",
    settings: {
      total_questions: 10,
      pass_mark: 8,
      allow_retries: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_submission: true,
      time_limit_minutes: null
    },
    questions: [
      {
        id: "rb_q1",
        type: "multiple_choice",
        question: "What is the main priority rule at most roundabouts?",
        options: [
          "Give way to traffic on your left",
          "Give way to traffic approaching from your immediate right",
          "Give way to traffic already waiting",
          "Give way to larger vehicles only"
        ],
        correct_answer_index: 1
      },
      {
        id: "rb_q2",
        type: "multiple_choice",
        question: "When does the normal \"give way to the right\" rule change at a roundabout?",
        options: [
          "At night",
          "In heavy traffic",
          "When signs, markings or traffic lights indicate otherwise",
          "On mini roundabouts only"
        ],
        correct_answer_index: 2
      },
      {
        id: "rb_q3",
        type: "multiple_choice",
        question: "Which routines should always be used when approaching a roundabout?",
        options: [
          "POM and PSL",
          "MSM, MSPSL and LADA",
          "MSM only",
          "LADA only"
        ],
        correct_answer_index: 1
      },
      {
        id: "rb_q4",
        type: "multiple_choice",
        question: "What is the correct approach lane for turning left (first exit) at a standard roundabout?",
        options: [
          "Right-hand lane",
          "Any available lane",
          "Left-hand lane",
          "Middle lane"
        ],
        correct_answer_index: 2
      },
      {
        id: "rb_q5",
        type: "multiple_choice",
        question: "When going straight ahead at a roundabout, when should you normally signal left?",
        options: [
          "On approach",
          "As soon as you enter",
          "After passing the exit just before the one you intend to take",
          "Only after leaving the roundabout"
        ],
        correct_answer_index: 2
      },
      {
        id: "rb_q6",
        type: "multiple_choice",
        question: "What should you do if the vehicle in front stops suddenly at a roundabout?",
        options: [
          "Continue because you have priority",
          "Sound the horn",
          "Be prepared to stop and reassess before moving",
          "Move into another lane immediately"
        ],
        correct_answer_index: 2
      },
      {
        id: "rb_q7",
        type: "multiple_choice",
        question: "Why is defensive driving important at roundabouts?",
        options: [
          "Drivers always follow the rules",
          "Vehicles always move at the same speed",
          "Other drivers may stop, change lanes or make mistakes unexpectedly",
          "Signals are optional"
        ],
        correct_answer_index: 2
      },
      {
        id: "rb_q8",
        type: "multiple_choice",
        question: "What is a key hazard to watch for on roundabouts?",
        options: [
          "Only cars",
          "Only pedestrians",
          "Cyclists, motorcyclists and large vehicles",
          "Traffic lights"
        ],
        correct_answer_index: 2
      },
      {
        id: "rb_q9",
        type: "multiple_choice",
        question: "How should you treat mini roundabouts?",
        options: [
          "Ignore priority rules",
          "Drive straight over the centre marking",
          "Give way to traffic from the right and reduce speed",
          "Always stop before entering"
        ],
        correct_answer_index: 2
      },
      {
        id: "rb_q10",
        type: "multiple_choice",
        question: "On spiral roundabouts, how should you reach your exit safely?",
        options: [
          "Change lanes whenever it feels safe",
          "Follow lane arrows and markings without cutting across lanes",
          "Signal continuously",
          "Stay in the left lane at all times"
        ],
        correct_answer_index: 1
      }
    ]
  }
};