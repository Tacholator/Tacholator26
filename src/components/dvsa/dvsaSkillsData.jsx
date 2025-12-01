export const DVSA_SKILLS_DATA = [
  {
    skillId: '1_legal_responsibilities',
    skillNumber: 1,
    skillTitle: 'Legal Responsibilities',
    shortDescription: 'Understanding the legal responsibilities of the driver and vehicle, including fitness to drive, insurance, taxation, MOT, mobile phone rules, and accident duties.',
    learningMaterial: `# Legal Responsibilities

To drive safely and legally, every driver must understand their responsibilities — both for themselves and for the vehicle they are operating. The law requires you to be fit to drive, avoid distractions, use a roadworthy vehicle, and follow all rules regarding supervision, insurance, and accident reporting.

---

## 1. Your Fitness to Drive

You must be in a safe physical and mental condition to drive. The law requires you to understand how the following factors affect your ability to drive:

### 1.1 Health

- Certain medical conditions **must** be reported to the DVLA.
- You must **not** drive if your condition affects your ability to drive safely.
- Failing to notify DVLA can lead to:
  1. A fine of up to **£1,000**
  2. Possible prosecution if you're involved in a collision

### 1.2 Eyesight

- You must be able to read a number plate from **20 metres**.
- If you need glasses or contact lenses to meet this standard, you **must wear them** when driving.
- Driving with poor eyesight can result in:
  1. Penalty points
  2. Fines
  3. Possible disqualification

### 1.3 Alcohol (Drink Driving)

- There is a legal limit, but the safest option is **not to drink at all** if you are driving.
- Penalties can include:
  1. Up to **6 months in prison**
  2. A **driving ban** (minimum **12 months**)
  3. **Unlimited fines**

### 1.4 Drugs

- Never drive after taking drugs; the effects can be severe.
- This includes **illegal drugs** and some **over-the-counter medicines** that cause drowsiness.
- Penalties can include:
  1. Up to **6 months in prison**
  2. A **driving ban**
  3. **Unlimited fines**

### 1.5 Tiredness

- Tired drivers are far more likely to have collisions.
- Take a break **every 2 hours** on long journeys.

### 1.6 Mobile Phones

- It is **illegal** to use a **handheld** phone while driving.
- Even **hands-free** devices can distract you.
- Penalties:
  1. **6 penalty points**
  2. **£200 fine**
  3. Risk of **disqualification** (especially for new drivers)

> These rules also apply to **anyone supervising a learner driver**.

---

## 2. Vehicle Legal Requirements

Before driving, you must ensure the vehicle is:

### 2.1 Taxed

- Every vehicle must be properly **taxed**.

### 2.2 MOT-Certified

- Vehicles over **3 years old** must have a valid **MOT**.
- Driving without an MOT can result in a fine of up to **£1,000**.

### 2.3 Insured

- You must be properly **insured** to drive that vehicle.
- Driving without insurance can result in:
  1. **6–8 penalty points**
  2. **Unlimited fines**
  3. **Vehicle seizure**

### 2.4 Roadworthy

The vehicle must be safe to drive, including:

- Tyres
- Brakes
- Lights
- Steering

Driving an **unroadworthy vehicle** is a **criminal offence**.

### 2.5 L Plates

- **L plates** must be clearly displayed at the **front and back** of the vehicle.
- **D plates** may be used in **Wales**.

---

## 3. Who Can Teach You to Drive?

Anyone can supervise a learner as long as they:

1. Are at least **21 years old**
2. Have held a full driving licence for at least **3 years**
3. Are qualified for the **type of vehicle** being used

### 3.1 For Paid Lessons

Only the following can charge money for lessons:

- **Approved Driving Instructors (ADIs)**
- **Trainee licence holders**

They must display their **badge** on the windscreen during lessons.

> Driving with an **unqualified paid instructor** is **illegal**.

---

## 4. Distraction and Mobile Phones

- Using a **handheld** phone while driving is **illegal**.
- Even **hands-free** use can distract your attention.
- Best practice: **switch off your phone** while driving.

Supervisors must also follow the phone rules — they are considered responsible too.

---

## 5. Accidents and Emergencies

If you're involved in a collision, you **MUST**:

1. **Stop**
2. Give your **name and address**
3. Provide **insurance details**
4. Provide the **vehicle owner's details** (if different)

If details are not exchanged, you must **report the incident to the police within 24 hours**.

> Failing to do this is a **criminal offence**.

---

## 6. Other Legal Responsibilities

You are also legally required to:

1. **Update** your licence details (name, address)
2. **Inform DVLA** of medical conditions that affect driving
3. **Follow** all Highway Code rules
4. **Maintain** legal eyesight standards at all times
`,
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: [
        {
          questionId: 'LR_Q1',
          questionText: 'How far must you be able to read a number plate?',
          options: ['10 metres', '15 metres', '20 metres', '25 metres'],
          correctOptionIndex: 2
        },
        {
          questionId: 'LR_Q2',
          questionText: 'Who must you inform if you develop a medical condition that affects your driving?',
          options: ['Your local council', 'Your insurance company', 'The DVLA', 'Your doctor only'],
          correctOptionIndex: 2
        },
        {
          questionId: 'LR_Q3',
          questionText: 'When is it legal to use a hand-held mobile phone while driving?',
          options: ['In slow traffic', 'When stopped at lights', 'Never', 'When using loudspeaker mode'],
          correctOptionIndex: 2
        },
        {
          questionId: 'LR_Q4',
          questionText: 'How often should you plan to take breaks on a long journey?',
          options: ['Every 30 minutes', 'Every hour', 'Every 2 hours', 'Only when tired'],
          correctOptionIndex: 2
        },
        {
          questionId: 'LR_Q5',
          questionText: 'A vehicle over 3 years old must have a valid:',
          options: ['Service log', 'MOT certificate', 'Breakdown cover', 'Warranty'],
          correctOptionIndex: 1
        },
        {
          questionId: 'LR_Q6',
          questionText: 'Who is legally allowed to supervise a learner driver?',
          options: ['Anyone aged 18+', 'Anyone with at least 1 year of driving experience', 'Anyone aged 21+ with 3 years full licence', 'Only Approved Driving Instructors'],
          correctOptionIndex: 2
        },
        {
          questionId: 'LR_Q7',
          questionText: 'Driving without insurance can lead to:',
          options: ['A warning only', 'A small fine only', 'Vehicle seizure and penalty points', 'A retest only'],
          correctOptionIndex: 2
        },
        {
          questionId: 'LR_Q8',
          questionText: 'What must be displayed on the front and back of the car when you are learning to drive?',
          options: ['Red triangle', 'L (or D) plates', 'Tax disc', 'Test certificate'],
          correctOptionIndex: 1
        },
        {
          questionId: 'LR_Q9',
          questionText: "If you're involved in a collision and don't exchange details, you must report it to the police within:",
          options: ['6 hours', '12 hours', '24 hours', '48 hours'],
          correctOptionIndex: 2
        },
        {
          questionId: 'LR_Q10',
          questionText: 'Who can legally charge money for driving lessons?',
          options: ['Anyone over 21', 'Anyone with a licence for 3 years', 'ADIs and trainee licence holders', 'Family members only'],
          correctOptionIndex: 2
        }
      ]
    }
  },
  {
    skillId: '2_safety_checks',
    skillNumber: 2,
    skillTitle: 'Safety Checks',
    shortDescription: 'Show-me tell-me questions and vehicle safety checks.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '3_cockpit_checks',
    skillNumber: 3,
    skillTitle: 'Cockpit Checks',
    shortDescription: 'Pre-driving checks inside the vehicle.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '4_vehicle_security',
    skillNumber: 4,
    skillTitle: 'Vehicle Security',
    shortDescription: 'Keeping the vehicle safe and secure.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '5_controls_instruments',
    skillNumber: 5,
    skillTitle: 'Controls and Instruments',
    shortDescription: 'Understanding and using vehicle controls.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '6_moving_away_stopping',
    skillNumber: 6,
    skillTitle: 'Moving Away and Stopping',
    shortDescription: 'Safe techniques for moving off and stopping.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '7_safe_positioning',
    skillNumber: 7,
    skillTitle: 'Safe Positioning',
    shortDescription: 'Correct road positioning in various situations.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '8_mirrors_vision',
    skillNumber: 8,
    skillTitle: 'Mirrors – Vision and Use',
    shortDescription: 'Effective use of mirrors and all-round observation.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '9_signals',
    skillNumber: 9,
    skillTitle: 'Signals',
    shortDescription: 'Using signals correctly and understanding others.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '10_anticipation_planning',
    skillNumber: 10,
    skillTitle: 'Anticipation and Planning',
    shortDescription: 'Reading the road ahead and planning actions.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '11_use_of_speed',
    skillNumber: 11,
    skillTitle: 'Use of Speed',
    shortDescription: 'Appropriate speed for conditions and limits.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '12_dealing_with_traffic',
    skillNumber: 12,
    skillTitle: 'Dealing with Other Traffic',
    shortDescription: 'Interacting safely with other road users.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '13_eco_driving',
    skillNumber: 13,
    skillTitle: 'Eco-safe / Fuel-efficient Driving',
    shortDescription: 'Environmentally friendly driving techniques.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '14_junctions',
    skillNumber: 14,
    skillTitle: 'Junctions (Left and Right Turns)',
    shortDescription: 'Approaching and negotiating junctions safely.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '15_roundabouts',
    skillNumber: 15,
    skillTitle: 'Roundabouts',
    shortDescription: 'Navigating roundabouts of all sizes.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '16_pedestrian_crossings',
    skillNumber: 16,
    skillTitle: 'Pedestrian Crossings',
    shortDescription: 'Dealing with different types of crossings.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '17_reversing_control',
    skillNumber: 17,
    skillTitle: 'Reversing – General Control',
    shortDescription: 'Controlling the vehicle while reversing.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '18_turning_around',
    skillNumber: 18,
    skillTitle: 'Turning the Vehicle Around',
    shortDescription: 'Turn in the road and three-point turns.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '19_parking',
    skillNumber: 19,
    skillTitle: 'Parking Manoeuvres',
    shortDescription: 'Bay parking and parallel parking techniques.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '20_emergency_stop',
    skillNumber: 20,
    skillTitle: 'Controlled Stop / Emergency Stop',
    shortDescription: 'Stopping quickly and safely in an emergency.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '21_country_roads',
    skillNumber: 21,
    skillTitle: 'Country Roads',
    shortDescription: 'Driving safely on rural roads.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '22_dual_carriageways',
    skillNumber: 22,
    skillTitle: 'Dual Carriageways',
    shortDescription: 'Joining, driving on and leaving dual carriageways.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '23_motorways',
    skillNumber: 23,
    skillTitle: 'Motorways',
    shortDescription: 'Motorway rules and safe driving.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '24_driving_dark',
    skillNumber: 24,
    skillTitle: 'Driving in the Dark',
    shortDescription: 'Night driving techniques and lighting.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '25_weather_conditions',
    skillNumber: 25,
    skillTitle: 'Driving in Different Weather Conditions',
    shortDescription: 'Adapting to rain, fog, ice and other weather.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '26_passengers_loads',
    skillNumber: 26,
    skillTitle: 'Passengers and Loads',
    shortDescription: 'Carrying passengers and loads safely.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '27_independent_driving',
    skillNumber: 27,
    skillTitle: 'Independent Driving / Sat Nav',
    shortDescription: 'Following routes and using sat nav independently.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  }
];

export const getSkillById = (skillId) => DVSA_SKILLS_DATA.find(s => s.skillId === skillId);
export const getSkillByNumber = (num) => DVSA_SKILLS_DATA.find(s => s.skillNumber === num);