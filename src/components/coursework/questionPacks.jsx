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
  }
};