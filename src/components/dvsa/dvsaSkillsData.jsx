export const DVSA_SKILLS_DATA = [
  {
    skillId: '1_legal_responsibilities',
    skillNumber: 1,
    skillTitle: 'Legal responsibilities',
    shortDescription: 'Understanding the legal responsibilities of the driver and vehicle.',
    learningMaterial: `<h2>Legal Responsibilities</h2>
<p>To drive safely and legally, every driver must understand their responsibilities — both for themselves and for the vehicle they are operating. The law requires you to be fit to drive, avoid distractions, use a roadworthy vehicle, and follow all rules regarding supervision, insurance, and accident reporting.</p>

<h3>1. Your Fitness to Drive</h3>
<p>You must be in a safe physical and mental condition to drive. The law requires you to understand how the following factors affect your ability to drive:</p>

<h4>Health</h4>
<ul>
<li>Certain medical conditions must be reported to the DVLA.</li>
<li>You must not drive if your condition affects your ability to drive safely.</li>
<li>Failing to notify DVLA can lead to:
  <ul>
  <li>A fine of up to £1,000</li>
  <li>Possible prosecution if you're involved in a collision</li>
  </ul>
</li>
</ul>

<h4>Eyesight</h4>
<ul>
<li>You must be able to read a number plate from <strong>20 metres</strong>.</li>
<li>If you need glasses or contact lenses to meet this standard, you must wear them when driving.</li>
<li>Driving with poor eyesight can result in:
  <ul>
  <li>Penalty points</li>
  <li>Fines</li>
  <li>Possible disqualification</li>
  </ul>
</li>
</ul>

<h4>Alcohol (Drink Driving)</h4>
<ul>
<li>There is a legal limit, but the safest option is not to drink at all if driving.</li>
<li>Penalties include:
  <ul>
  <li>Up to 6 months in prison</li>
  <li>A driving ban (minimum 12 months)</li>
  <li>Unlimited fines</li>
  </ul>
</li>
</ul>

<h4>Drugs</h4>
<ul>
<li>Never drive after taking drugs; effects can be severe.</li>
<li>Includes illegal drugs and some over-the-counter medicines that cause drowsiness.</li>
<li>Penalties include:
  <ul>
  <li>Up to 6 months in prison</li>
  <li>A driving ban</li>
  <li>Unlimited fines</li>
  </ul>
</li>
</ul>

<h4>Tiredness</h4>
<ul>
<li>Tired drivers are far more likely to have collisions.</li>
<li>Take a break <strong>every 2 hours</strong> on long journeys.</li>
</ul>

<h4>Mobile Phones</h4>
<ul>
<li>It is illegal to use a handheld phone while driving.</li>
<li>Even hands-free devices can distract you.</li>
<li>Penalties:
  <ul>
  <li>6 penalty points</li>
  <li>£200 fine</li>
  <li>Risk of disqualification (especially for new drivers)</li>
  </ul>
</li>
</ul>

<p><em>These rules also apply to anyone supervising a learner driver.</em></p>

<h3>2. Vehicle Legal Requirements</h3>
<p>Before driving, you must ensure the vehicle is:</p>

<h4>Taxed</h4>
<p>Every vehicle must be properly taxed.</p>

<h4>MOT-certified</h4>
<ul>
<li>Vehicles over 3 years old must have a valid MOT.</li>
<li>Driving without an MOT can result in a fine up to £1,000.</li>
</ul>

<h4>Insured</h4>
<ul>
<li>You must be properly insured to drive that vehicle.</li>
<li>Driving without insurance can result in:
  <ul>
  <li>6–8 penalty points</li>
  <li>Unlimited fines</li>
  <li>Vehicle seizure</li>
  </ul>
</li>
</ul>

<h4>Roadworthy</h4>
<ul>
<li>The vehicle must be safe to drive, including:
  <ul>
  <li>Tyres</li>
  <li>Brakes</li>
  <li>Lights</li>
  <li>Steering</li>
  </ul>
</li>
<li>Driving an unroadworthy vehicle is a criminal offence.</li>
</ul>

<h4>L Plates</h4>
<ul>
<li>Must be clearly displayed at the front and back of the vehicle.</li>
<li>D plates may be used in Wales.</li>
</ul>

<h3>3. Who Can Teach You to Drive?</h3>
<p>Anyone can supervise a learner as long as they:</p>
<ul>
<li>Are at least <strong>21 years old</strong></li>
<li>Have held a full driving licence for at least <strong>3 years</strong></li>
<li>Are qualified for the type of vehicle being used</li>
</ul>

<p>For paid lessons, only:</p>
<ul>
<li>Approved Driving Instructors (ADIs)</li>
<li>Trainee licence holders</li>
</ul>

<p>They must display their badge on the windscreen during lessons. Driving with an unqualified paid instructor is illegal.</p>

<h3>4. Distraction and Mobile Phones</h3>
<ul>
<li>Using a handheld phone while driving is illegal.</li>
<li>Even hands-free use can distract your attention.</li>
<li>Best practice: switch off your phone while driving.</li>
<li>Supervisors must also follow the phone rules — they are considered responsible.</li>
</ul>

<h3>5. Accidents and Emergencies</h3>
<p>If you're involved in a collision, you MUST:</p>
<ul>
<li>Stop</li>
<li>Give your name and address</li>
<li>Provide insurance details</li>
<li>Provide the vehicle owner's details</li>
</ul>

<p>If details are not exchanged, report the incident to the police within <strong>24 hours</strong>. Failing to do this is a criminal offence.</p>

<h3>6. Other Legal Responsibilities</h3>
<p>You are also legally required to:</p>
<ul>
<li>Update your licence details (name, address)</li>
<li>Inform DVLA of medical conditions that affect driving</li>
<li>Follow all Highway Code rules</li>
<li>Maintain legal eyesight standards at all times</li>
<li>Make sure you have a licence for the category of vehicle you're going to drive</li>
</ul>`,
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: [
        {
          questionId: 'lr_q1',
          questionText: 'How far must you be able to read a number plate?',
          options: ['10 metres', '15 metres', '20 metres', '25 metres'],
          correctOptionIndex: 2
        },
        {
          questionId: 'lr_q2',
          questionText: 'Who must you inform if you develop a medical condition that affects your driving?',
          options: ['Your local council', 'Your insurance company', 'The DVLA', 'Your doctor only'],
          correctOptionIndex: 2
        },
        {
          questionId: 'lr_q3',
          questionText: 'When is it legal to use a handheld mobile phone while driving?',
          options: ['In slow traffic', 'When stopped at lights', 'Never', 'When using loudspeaker mode'],
          correctOptionIndex: 2
        },
        {
          questionId: 'lr_q4',
          questionText: 'How often should you take breaks during long journeys?',
          options: ['Every 30 minutes', 'Every hour', 'Every 2 hours', 'Only when tired'],
          correctOptionIndex: 2
        },
        {
          questionId: 'lr_q5',
          questionText: 'What is the penalty for using a handheld phone while driving?',
          options: ['£50 fine', '£200 fine and 6 penalty points', 'Warning only', '£500 fine and 9 points'],
          correctOptionIndex: 1
        },
        {
          questionId: 'lr_q6',
          questionText: 'Who is legally allowed to supervise a learner driver?',
          options: ['Anyone aged 18+', 'Anyone with at least 1 year of driving experience', 'Anyone aged 21+ with 3 years full licence', 'Only ADIs'],
          correctOptionIndex: 2
        },
        {
          questionId: 'lr_q7',
          questionText: 'A vehicle over 3 years old must have a valid:',
          options: ['Service log', 'MOT certificate', 'Breakdown cover', 'Warranty'],
          correctOptionIndex: 1
        },
        {
          questionId: 'lr_q8',
          questionText: 'Driving without insurance can lead to:',
          options: ['A warning', 'A small fine only', 'Vehicle seizure and penalty points', 'A retest only'],
          correctOptionIndex: 2
        },
        {
          questionId: 'lr_q9',
          questionText: "If you're involved in a collision and don't exchange details, you must report it to the police within:",
          options: ['6 hours', '12 hours', '24 hours', '48 hours'],
          correctOptionIndex: 2
        },
        {
          questionId: 'lr_q10',
          questionText: 'Who can legally teach driving for payment?',
          options: ['Anyone over 21', 'Anyone with a licence for 3 years', 'ADIs and trainee licence holders', 'Family members only'],
          correctOptionIndex: 2
        }
      ]
    }
  },
  {
    skillId: '2_safety_checks',
    skillNumber: 2,
    skillTitle: 'Safety checks',
    shortDescription: 'Show-me tell-me questions and vehicle safety checks.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '3_security',
    skillNumber: 3,
    skillTitle: 'Security',
    shortDescription: 'Keeping the vehicle safe and secure.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '4_cockpit_and_safety',
    skillNumber: 4,
    skillTitle: 'Cockpit & Safety Procedures',
    shortDescription: 'Pre-driving checks and safety routines.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '5_main_car_controls',
    skillNumber: 5,
    skillTitle: 'Main Car Controls',
    shortDescription: 'Understanding and using vehicle controls.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '6_stopping',
    skillNumber: 6,
    skillTitle: 'Stopping',
    shortDescription: 'Safe stopping techniques using MSM routine.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '7_moving_off',
    skillNumber: 7,
    skillTitle: 'Moving Off – POM routine',
    shortDescription: 'Safe techniques for moving off using POM routine.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '8_use_of_mirrors',
    skillNumber: 8,
    skillTitle: 'Use of Mirrors',
    shortDescription: 'Effective use of mirrors and all-round observation.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '9_use_of_signals',
    skillNumber: 9,
    skillTitle: 'Use of Signals',
    shortDescription: 'Using signals correctly and understanding others.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '10_junctions_turning_emerging',
    skillNumber: 10,
    skillTitle: 'Junctions – Turning and emerging',
    shortDescription: 'Approaching and negotiating junctions safely.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '11_meeting_and_dealing_with_traffic',
    skillNumber: 11,
    skillTitle: 'Meeting and dealing with other traffic',
    shortDescription: 'Interacting safely with other road users.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '12_crossroads',
    skillNumber: 12,
    skillTitle: 'Crossroads',
    shortDescription: 'Navigating crossroads with and without traffic lights.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '13_roundabouts',
    skillNumber: 13,
    skillTitle: 'Roundabouts',
    shortDescription: 'Navigating mini, standard and multilane roundabouts.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '14_dual_carriageways',
    skillNumber: 14,
    skillTitle: 'Dual carriageways',
    shortDescription: 'Joining, driving on and leaving dual carriageways.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '15_country_roads',
    skillNumber: 15,
    skillTitle: 'Country roads',
    shortDescription: 'Driving safely on rural roads.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '16_driving_conditions',
    skillNumber: 16,
    skillTitle: 'Driving conditions',
    shortDescription: 'Adapting to dark, weather conditions, passengers and loads.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '17_traffic_lights',
    skillNumber: 17,
    skillTitle: 'Traffic lights',
    shortDescription: 'Approaching and responding to traffic signals.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '18_manoeuvres',
    skillNumber: 18,
    skillTitle: 'Manoeuvres',
    shortDescription: 'Bay parking, parallel parking and reversing manoeuvres.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '19_emergency_stop',
    skillNumber: 19,
    skillTitle: 'Emergency stop',
    shortDescription: 'Stopping quickly and safely in an emergency.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '20_pedestrian_crossings',
    skillNumber: 20,
    skillTitle: 'Pedestrian crossings',
    shortDescription: 'Dealing with zebra, pelican and toucan crossings.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '21_making_progress_and_road_position',
    skillNumber: 21,
    skillTitle: 'Making progress and road position',
    shortDescription: 'Appropriate speed and lane discipline.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '22_planning_skills',
    skillNumber: 22,
    skillTitle: 'Planning',
    shortDescription: 'Reading road signs and anticipating other road users.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '23_independent_driving',
    skillNumber: 23,
    skillTitle: 'Independent driving and use of Sat Nav',
    shortDescription: 'Following routes and using sat nav independently.',
    learningMaterial: '',
    mcqQuiz: {
      passMarkScore: 8,
      totalQuestions: 10,
      questions: []
    }
  },
  {
    skillId: '24_show_me_tell_me',
    skillNumber: 24,
    skillTitle: 'Show me, tell me questions',
    shortDescription: 'Vehicle safety questions for the driving test.',
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