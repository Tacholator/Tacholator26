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
  }
};