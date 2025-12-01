export const DVSA_SKILLS_DATA = [
  {
    skillId: '1_legal_responsibilities',
    skillNumber: 1,
    skillTitle: 'Legal Responsibilities',
    shortDescription: 'Understanding the legal responsibilities of the driver and vehicle, including fitness to drive, insurance, taxation, MOT, mobile phone rules, and accident duties.',
    learningMaterial: `# Legal Responsibilities

To drive safely and legally, every driver must understand their responsibilities – both for themselves and for the vehicle they drive.

## Fitness to Drive
- **Health**: Certain medical conditions must be reported to the DVLA. Failing to notify them can lead to a fine and possible prosecution if you're involved in a collision.
- **Eyesight**: You must be able to read a number plate from 20 metres. If you need glasses or contact lenses to do this, you must always wear them when driving.
- **Alcohol**: Do not drink and drive. There is a legal limit, but it is safest not to drink at all if you are going to drive. Penalties can include fines, bans and imprisonment.
- **Drugs**: Never take drugs before driving. This includes illegal drugs and some medicines that cause drowsiness. Penalties are similar to drink driving.
- **Tiredness**: Tired drivers are more likely to have collisions. On long journeys, plan a break every 2 hours.
- **Mobile Phones**: It is illegal to use a hand-held mobile phone while driving. Even hands-free use can be distracting. Penalties can include a fine and penalty points.

## Vehicle Legal Requirements
- The vehicle must be **taxed**.
- It must have a valid **MOT certificate** (if it needs one).
- It must be **insured** for you to drive.
- It must be **roadworthy** (tyres, brakes, lights, steering, etc.).
- **L plates** (or D plates in Wales) must be clearly displayed on the front and back when learning.

## Who Can Teach You to Drive?
- Anyone supervising must be at least 21 and have held a full licence for at least 3 years for that type of vehicle.
- Only Approved Driving Instructors (ADIs) and trainee licence holders may charge money for lessons and must display their badge.

## Distraction and Mobile Phones
- Using a hand-held phone while driving is illegal and highly distracting.
- Even hands-free use can take your attention away from the road.
- The safest option is to switch your phone off while driving and stop in a safe place before checking it.
- The rules also apply to the person supervising you.

## Accidents and Emergencies
If you're involved in a collision, you must:
- Stop.
- Provide your name, address, and the owner's details if different.
- Provide insurance details.
- If details are not exchanged at the scene, report the incident to the police within 24 hours.

## Other Legal Responsibilities
- Keep your licence details (name, address) up to date.
- Notify the DVLA about relevant medical conditions.
- Follow the Highway Code rules at all times.
- Maintain the legal eyesight standard whenever you drive.`,
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
  { skillId: '2_safety_checks', skillNumber: 2, skillTitle: 'Safety Checks', shortDescription: 'Show-me tell-me questions and vehicle safety checks.' },
  { skillId: '3_cockpit_checks', skillNumber: 3, skillTitle: 'Cockpit Checks', shortDescription: 'Pre-driving checks inside the vehicle.' },
  { skillId: '4_vehicle_security', skillNumber: 4, skillTitle: 'Vehicle Security', shortDescription: 'Keeping the vehicle safe and secure.' },
  { skillId: '5_controls_instruments', skillNumber: 5, skillTitle: 'Controls and Instruments', shortDescription: 'Understanding and using vehicle controls.' },
  { skillId: '6_moving_away_stopping', skillNumber: 6, skillTitle: 'Moving Away and Stopping', shortDescription: 'Safe techniques for moving off and stopping.' },
  { skillId: '7_safe_positioning', skillNumber: 7, skillTitle: 'Safe Positioning', shortDescription: 'Correct road positioning in various situations.' },
  { skillId: '8_mirrors_vision', skillNumber: 8, skillTitle: 'Mirrors – Vision and Use', shortDescription: 'Effective use of mirrors and all-round observation.' },
  { skillId: '9_signals', skillNumber: 9, skillTitle: 'Signals', shortDescription: 'Using signals correctly and understanding others.' },
  { skillId: '10_anticipation_planning', skillNumber: 10, skillTitle: 'Anticipation and Planning', shortDescription: 'Reading the road ahead and planning actions.' },
  { skillId: '11_use_of_speed', skillNumber: 11, skillTitle: 'Use of Speed', shortDescription: 'Appropriate speed for conditions and limits.' },
  { skillId: '12_dealing_with_traffic', skillNumber: 12, skillTitle: 'Dealing with Other Traffic', shortDescription: 'Interacting safely with other road users.' },
  { skillId: '13_eco_driving', skillNumber: 13, skillTitle: 'Eco-safe / Fuel-efficient Driving', shortDescription: 'Environmentally friendly driving techniques.' },
  { skillId: '14_junctions', skillNumber: 14, skillTitle: 'Junctions (Left and Right Turns)', shortDescription: 'Approaching and negotiating junctions safely.' },
  { skillId: '15_roundabouts', skillNumber: 15, skillTitle: 'Roundabouts', shortDescription: 'Navigating roundabouts of all sizes.' },
  { skillId: '16_pedestrian_crossings', skillNumber: 16, skillTitle: 'Pedestrian Crossings', shortDescription: 'Dealing with different types of crossings.' },
  { skillId: '17_reversing_control', skillNumber: 17, skillTitle: 'Reversing – General Control', shortDescription: 'Controlling the vehicle while reversing.' },
  { skillId: '18_turning_around', skillNumber: 18, skillTitle: 'Turning the Vehicle Around', shortDescription: 'Turn in the road and three-point turns.' },
  { skillId: '19_parking', skillNumber: 19, skillTitle: 'Parking Manoeuvres', shortDescription: 'Bay parking and parallel parking techniques.' },
  { skillId: '20_emergency_stop', skillNumber: 20, skillTitle: 'Controlled Stop / Emergency Stop', shortDescription: 'Stopping quickly and safely in an emergency.' },
  { skillId: '21_country_roads', skillNumber: 21, skillTitle: 'Country Roads', shortDescription: 'Driving safely on rural roads.' },
  { skillId: '22_dual_carriageways', skillNumber: 22, skillTitle: 'Dual Carriageways', shortDescription: 'Joining, driving on and leaving dual carriageways.' },
  { skillId: '23_motorways', skillNumber: 23, skillTitle: 'Motorways', shortDescription: 'Motorway rules and safe driving.' },
  { skillId: '24_driving_dark', skillNumber: 24, skillTitle: 'Driving in the Dark', shortDescription: 'Night driving techniques and lighting.' },
  { skillId: '25_weather_conditions', skillNumber: 25, skillTitle: 'Driving in Different Weather Conditions', shortDescription: 'Adapting to rain, fog, ice and other weather.' },
  { skillId: '26_passengers_loads', skillNumber: 26, skillTitle: 'Passengers and Loads', shortDescription: 'Carrying passengers and loads safely.' },
  { skillId: '27_independent_driving', skillNumber: 27, skillTitle: 'Independent Driving / Sat Nav', shortDescription: 'Following routes and using sat nav independently.' }
];

export const getSkillById = (skillId) => DVSA_SKILLS_DATA.find(s => s.skillId === skillId);
export const getSkillByNumber = (num) => DVSA_SKILLS_DATA.find(s => s.skillNumber === num);