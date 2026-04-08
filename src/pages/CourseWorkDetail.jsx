import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Volume2, X, CheckCircle, AlertCircle, Lock, Users, Trash2, UserX, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SectionAudioPlayer from '@/components/learning/SectionAudioPlayer';
import CourseWorkSubcardSelect from '@/components/coursework/CourseWorkSubcardSelect';
import GoogleTTSAudioPlayer from '@/components/learning/GoogleTTSAudioPlayer';
import McqQuizPaginated from '@/components/coursework/McqQuizPaginated';
import { questionPacks } from '@/components/coursework/questionPacks';
import { courseWorkTopics } from '@/components/coursework/topicIndex';
import LockedContentDialog from '@/components/coursework/LockedContentDialog';
import moment from 'moment';
import { useInstructorAccessCheck } from '@/hooks/useInstructorAccessCheck';
import RestrictedAccessNotice from '@/components/access/RestrictedAccessNotice';

const courseWorkContent = {
  1: {
    title: 'Legal Responsibilities',
    sections: [
      {
        heading: 'Legal Responsibilities – Overview',
        body: `To drive safely and legally in the UK, every driver must understand their responsibilities for themselves and the vehicle they operate.

This includes:
• Being fit to drive
• Ensuring the vehicle is legal and roadworthy
• Avoiding distractions (such as mobile phones)
• Knowing what to do in the event of an accident
• Following the rules in the Highway Code`
      },
      {
        heading: '1. Your Fitness to Drive',
        body: `You must always be in a safe physical and mental condition to drive. The law requires you to understand how your health, eyesight, alcohol, drugs, tiredness and distractions affect your driving.

1.1 Health
• Some medical conditions must be reported to the DVLA.
• You must not drive if a condition affects your ability to drive safely.
• Failing to notify the DVLA can lead to a fine of up to £1,000 and possible prosecution if you are involved in a collision.

1.2 Eyesight
• You must be able to read a number plate from 20 metres.
• If you need glasses or contact lenses to meet this standard, you must wear them whenever you drive.
• Driving with poor eyesight can result in penalty points, fines or disqualification.

1.3 Alcohol
• There is a legal limit for alcohol, but the safest option is not to drink at all if you plan to drive.
• Penalties for drink driving can include up to 6 months in prison, a driving ban (minimum 12 months) and unlimited fines.

1.4 Drugs
• You must never drive after taking drugs that impair your ability to drive.
• This includes illegal drugs and some prescription or over-the-counter medicines that cause drowsiness.
• Penalties for drug driving can include up to 6 months in prison, a driving ban and unlimited fines.

1.5 Tiredness
• Tiredness significantly increases the risk of collisions.
• You should avoid driving when tired and take regular breaks, ideally at least every 2 hours on long journeys.

1.6 Mobile Phones
• It is illegal to use a handheld mobile phone while driving.
• Even hands-free devices can distract you and slow your reaction time.
• Penalties can include 6 penalty points, a £200 fine and possible disqualification, especially for new drivers.
• These rules also apply to anyone supervising a learner driver.`
      }
    ]
  },
  2: {
    title: 'Vehicle Safety',
    sections: [
      {
        heading: 'Vehicle Safety – Overview',
        body: `Your vehicle must be safe, legal and roadworthy. Regular maintenance and checks help prevent breakdowns and accidents.`
      },
      {
        heading: 'Essential Checks',
        body: `Before every journey, check your lights, mirrors, tyres, seatbelts and windscreen wipers. Perform monthly checks on fluid levels and tyre condition.

Daily Checks:
• Check all lights are functioning (headlights, brake lights, indicators, fog lights)
• Ensure all mirrors are properly adjusted for full visibility
• Check tyre condition and pressure
• Verify windscreen wipers work and washer fluid is filled
• Test brakes are responsive
• Check seat belts work correctly

Weekly/Monthly Checks:
• Engine oil level
• Coolant level
• Brake fluid level
• Power steering fluid
• Tyre tread depth (minimum 1.6mm legally, but 3mm recommended)
• Tyre condition for damage`
      }
    ]
  },
  3: {
    title: 'Hazard Awareness',
    sections: [
      {
        heading: 'Spotting Hazards',
        body: `A hazard is anything that could affect your driving. Learn to identify hazards early and react appropriately.

Types of Hazards:
• Stationary hazards: parked cars, lamp posts, pot holes
• Moving hazards: other vehicles, pedestrians, cyclists, animals
• Road hazards: wet roads, loose gravel, debris
• Weather hazards: rain, fog, ice, strong wind
• Environmental hazards: busy junctions, schools, construction zones

Hazard Perception:
• Continuously scan ahead, to sides and behind
• Anticipate what others might do
• Identify potential problems early
• Adjust speed and position to reduce risk
• Be ready to stop if necessary`
      }
    ]
  },
  4: {
    title: 'Defensive Driving',
    sections: [
      {
        heading: 'Defensive Driving Techniques',
        body: `Anticipate dangers and keep a safe distance from other vehicles. Defensive driving means being aware and prepared.

Key Principles:
• Assume other drivers may make mistakes
• Anticipate what other road users might do
• Maintain appropriate speed for conditions
• Keep a safe following distance
• Avoid distractions completely
• Never take unnecessary risks

Following Distance:
• Use the 2-second rule in normal conditions
• Double this in wet weather
• Triple in icy conditions
• At 30mph, 2 seconds = about 27 meters`
      }
    ]
  },
  5: {
    title: 'Speed Management',
    sections: [
      {
        heading: 'Speed and Safety',
        body: `Speed must be appropriate for road, weather and traffic conditions. The limit is a maximum, not a target.

UK Speed Limits:
• Built-up areas: 30 mph
• Single carriageway: 60 mph
• Dual carriageway: 70 mph
• Motorway: 70 mph

Factors Affecting Safe Speed:
• Weather conditions (rain, ice, fog)
• Road surface (wet, loose gravel)
• Visibility
• Traffic density
• Presence of pedestrians or cyclists

Stopping Distance:
• At 30 mph: 75 feet (23 meters)
• At 50 mph: 175 feet (53 meters)
• At 70 mph: 315 feet (96 meters)`
      }
    ]
  },
  6: {
    title: 'Urban Driving',
    sections: [
      {
        heading: 'Driving in Towns and Cities',
        body: `In urban areas, stay alert for pedestrians, cyclists and parked vehicles. Traffic and hazards are unpredictable.

Common Urban Hazards:
• Pedestrians stepping into the road
• Cyclists weaving between cars
• Children playing near the curb
• Vehicles pulling out from parking spaces
• Buses and taxis stopping suddenly

Urban Driving Techniques:
• Keep speed low and steady
• Watch for movement at the sides of the road
• Anticipate hazards from parked cars
• Be ready to stop frequently
• Use mirrors constantly
• Plan ahead for turns and junctions`
      }
    ]
  },
  7: {
    title: 'Rural Driving',
    sections: [
      {
        heading: 'Country Roads',
        body: `Rural roads may be narrow with poor visibility. Adjust your speed accordingly. Country roads are often more dangerous than they appear.

Rural Road Characteristics:
• Narrow, winding roads
• Limited visibility around bends
• No street lighting
• Shared with farm vehicles and animals
• Poor road surfaces
• Limited passing opportunities

Common Rural Hazards:
• Slow farm vehicles (tractors, harvesters)
• Loose gravel or mud
• Animals on or near the road
• Hidden driveways
• Potholes and damaged verges

Rural Driving Techniques:
• Reduce speed on unfamiliar roads
• Assume something might come around the next bend
• Use headlights even in daylight
• Stay left on blind bends
• Allow plenty of space to pass farm vehicles`
      }
    ]
  },
  8: {
    title: 'Motorway Driving',
    sections: [
      {
        heading: 'Safe Motorway Driving',
        body: `On motorways, maintain safe distances and use correct lane discipline. Motorways are fast and require concentration.

Motorway Rules:
• Maximum speed 70 mph (or as posted)
• Keep right except to overtake
• Never stop on the hard shoulder except in emergency
• Wear seatbelts at all times
• Headlights on in poor visibility

Lane Discipline:
• Use left lane for normal driving
• Middle lanes for overtaking
• Right lane for overtaking only
• Return to left lane once overtaking is complete
• Don't weave between lanes

Following Distance:
• Maintain at least 2 seconds from vehicle ahead
• At 70 mph this is approximately 73 meters
• Increase in poor weather`
      }
    ]
  },
  9: {
    title: 'Weather Conditions',
    sections: [
      {
        heading: 'Driving in Bad Weather',
        body: `Rain, fog, ice and snow all affect how you drive. Adjust speed and increase stopping distance significantly.

Rain:
• Reduce speed – wet roads have less grip
• Increase following distance
• Use headlights
• Braking distance increases on wet roads

Fog:
• Reduce speed dramatically
• Use headlights (not full beam)
• Increase following distance
• Don't accelerate to get out of the fog

Snow and Ice:
• Avoid driving unless essential
• Reduce speed significantly
• Increase following distance massively (8-10 seconds)
• Use gentle acceleration and braking
• Watch for ice in shaded areas and bridges`
      }
    ]
  },
  10: {
    title: 'Night Driving',
    sections: [
      {
        heading: 'Driving in Darkness',
        body: `Use headlights correctly and be aware of reduced visibility at night. Night driving poses significant challenges.

Headlight Use:
• Use dipped headlights when meeting oncoming traffic
• Use main beam in darkness on clear roads
• Switch to dipped beam when approaching other vehicles
• Use dipped beams in fog, rain and snow
• Don't full beam other drivers

Night Driving Challenges:
• Reduced visibility
• Other road users harder to spot
• Pedestrians less visible
• Depth perception reduced
• Glare from oncoming lights
• Fatigue more likely

Night Driving Techniques:
• Reduce speed
• Increase following distance
• Avoid looking at oncoming headlights
• Keep windscreen clean
• Don't drive if too tired`
      }
    ]
  },
  11: {
    title: 'Reversing',
    sections: [
      {
        heading: 'Reversing Safely',
        body: `Always check your surroundings and use mirrors. Reverse slowly and deliberately. Reversing is a high-risk maneuver.

Reversing Safety Checks:
• Check all mirrors before reversing
• Look over both shoulders
• Check underneath vehicle if possible
• Watch for children and pets
• Use hazard lights if blocking traffic

Reversing Technique:
• Reverse slowly (slow engine speed)
• Use both hands on wheel
• Keep checking mirrors and over shoulders
• Be ready to stop immediately
• Don't reverse far unless necessary`
      }
    ]
  },
  12: {
    title: 'Parking',
    sections: [
      {
        heading: 'Parking Techniques',
        body: `Park safely and legally. Follow all parking regulations. Legal parking is essential for safety and community.

Parallel Parking:
• Check for sufficient space (about 1.5 vehicle lengths)
• Pull alongside the front car
• Reverse while turning wheel fully right
• Straighten and adjust position

Bay Parking:
• Approach at slow speed
• Center on the bay markings
• Reverse slowly into position
• Ensure equal distance from lines

Parking on Hills:
• Turn wheels toward curb on downhill side
• Use handbrake firmly
• Leave in gear (manual) or Park (automatic)

Legal Parking:
• Never park on double yellow lines
• Don't block driveways
• Be at least 10 meters from a junction`
      }
    ]
  },
  13: {
    title: 'Emergency Procedures',
    sections: [
      {
        heading: 'What to Do in an Emergency',
        body: `Know how to handle breakdowns, accidents and medical emergencies. Staying calm is essential.

Breakdown Procedure:
• Turn on hazard lights
• Safely pull to the side of the road
• If on motorway, use hard shoulder or emergency refuge area
• Call breakdown service or emergency services
• Stay with vehicle unless unsafe

Accident Procedure:
• Check for injuries
• Call emergency services (999) if anyone hurt
• Move vehicles to safety if possible
• Turn on hazard lights
• Exchange insurance and contact details
• Take photos of damage and scene

Medical Emergency:
• Stop safely immediately
• Call 999 for ambulance
• Check person is conscious and breathing
• Don't move person unless in danger
• Keep them warm and comfortable`
      }
    ]
  },
  14: {
    title: 'Eco-Driving',
    sections: [
      {
        heading: 'Environmentally Friendly Driving',
        body: `Smooth acceleration, maintaining steady speed and proper maintenance reduce emissions. Eco-driving also saves money and fuel.

Fuel Efficient Techniques:
• Accelerate smoothly and gradually
• Maintain consistent speed
• Anticipate traffic to avoid harsh braking
• Use highest appropriate gear
• Avoid excessive idling
• Maintain proper tyre pressure

Vehicle Maintenance for Emissions:
• Regular servicing
• Replace air filters as needed
• Keep engine in good condition
• Ensure catalytic converter works
• Check exhaust system

Planning and Behavior:
• Plan routes to avoid congestion
• Combine journeys where possible
• Use public transport or bike for short trips
• Turn off engine if stopped for extended periods`
      }
    ]
  },
  15: {
    title: 'Driver Fatigue',
    sections: [
      {
        heading: 'Managing Tiredness',
        body: `Never drive when tired. Take regular breaks on long journeys. Fatigue is a major cause of accidents.

Signs of Fatigue:
• Difficulty concentrating
• Heavy eyelids
• Yawning frequently
• Slow reactions
• Drifting across lanes

Why Fatigue is Dangerous:
• Slow reaction times
• Impaired judgment
• Reduced awareness
• Loss of concentration
• Can be as dangerous as drunk driving

Preventing Fatigue:
• Get adequate sleep before driving
• Don't drive after long work shifts
• Take regular breaks (every 2 hours)
• Share driving on long journeys
• Avoid driving during body's low-alertness times
• Stay hydrated

Managing Tiredness on the Road:
• Stop immediately if unsafe
• Have a short nap (15-20 minutes)
• Get out and move around
• Drink caffeine`
      }
    ]
  },
  16: {
    title: 'Vulnerable Road Users',
    sections: [
      {
        heading: 'Protecting Pedestrians and Cyclists',
        body: `Always be aware of vulnerable road users and give them space and time. They have no protection if hit by a vehicle.

Pedestrians:
• Children may not judge speed/distance correctly
• Elderly people move slowly
• Look for movement between parked cars
• Be ready to stop for people at crossings
• Give way even if you have priority

Cyclists:
• Can be unpredictable
• Difficult to see
• Easily knocked off balance
• Check blind spots carefully
• Give plenty of space when passing (1.5m minimum)
• Don't open car doors into their path

Motorcyclists:
• Harder to see due to size
• Can swerve to avoid hazards
• Vulnerable in accidents
• Check blind spots carefully
• Don't crowd them

General Principles:
• Always assume vulnerable users may not see you
• Give them benefit of doubt
• Never take unnecessary risks
• Remember they have no protection`
      }
    ]
  },
  17: {
    title: 'Psychological Factors',
    sections: [
      {
        heading: 'Attitude and Behaviour',
        body: `Your attitude and emotions affect your driving. Stay calm and patient. Psychological state is crucial for safety.

Attitude and Driving:
• Aggressive drivers cause accidents
• Overconfident drivers underestimate risks
• Considerate drivers cause fewer accidents
• Patience reduces stress and danger

Emotional States:
• Anger – avoid aggressive responses, stay calm
• Stress – take breaks if needed
• Tiredness – stop driving immediately
• Fear – is useful but shouldn't paralyze you

Road Rage:
• Never engage with aggressive drivers
• Don't respond to rude gestures
• Allow aggressive drivers to pass
• Keep doors locked
• Drive to police station if threatened

Mental Fitness to Drive:
• Depression can affect concentration
• Anxiety can cause panic responses
• Some medications affect driving
• Consult your doctor if unsure`
      }
    ]
  },
  18: {
    title: 'Practical Skills',
    sections: [
      {
        heading: 'Developing Driving Skills',
        body: `Practice under varied conditions to develop confidence and competence. Skill development is continuous.

Key Practical Skills:
• Smooth steering inputs
• Precise accelerator and brake control
• Smooth gear changes
• Mirror and blind spot checks
• Positioning on the road
• Anticipation and planning
• Hazard identification
• Vehicle handling in different weather

Progressive Practice:
• Start in quiet areas
• Progress to busier areas
• Practice in different weather
• Drive at different times of day
• Build experience gradually

Practice Scenarios:
• Residential areas
• Urban traffic
• Rural roads
• Motorways
• Night driving
• Wet weather conditions
• Heavy traffic conditions`
      }
    ]
  },
  19: {
    title: 'Oil and Fluid Checks',
    sections: [
      {
        heading: 'Engine Maintenance',
        body: `Regular checks of oil, coolant and other fluids prevent breakdowns. Engine maintenance is essential.

Engine Oil:
• Check level monthly or before long journeys
• Use correct grade for your vehicle
• Change oil and filter according to manufacturer schedule
• Low oil causes engine damage
• Check when engine cold

Coolant:
• Check level when engine cold
• Protects against freezing and overheating
• Never remove cap from hot engine
• Service coolant every 2-3 years

Brake Fluid:
• Check level regularly
• Important for braking system
• Should be changed every 2 years
• Low level indicates leak or worn pads

Power Steering Fluid:
• Check when engine cold
• Low fluid makes steering heavy
• Top up with correct type

Washer Fluid:
• Keep topped up for safety
• Use in winter with anti-freeze
• Regular top-ups needed`
      }
    ]
  },
  20: {
    title: 'Tyre Maintenance',
    sections: [
      {
        heading: 'Tyre Safety',
        body: `Tyres must have adequate tread. Check pressure regularly. Tyres are critical for safety.

Tyre Tread:
• Legal minimum: 1.6mm
• Recommended: 3mm for better safety
• Check tread depth using penny test
• Replace before legal minimum reached

Tyre Pressure:
• Check when tyres are cold
• Check weekly or before long journeys
• Underinflated increases fuel consumption
• Overinflated reduces grip
• Use correct pressure from manufacturer

Tyre Condition:
• Check for cuts and bulges
• Look for object embedded in tyre
• Report damage
• Uneven wear indicates problems

Seasonal Tyres:
• Summer: suitable in dry/wet conditions
• Winter: better grip in ice and snow
• All-season: compromise option

Replacement:
• Replace in pairs or all four
• Don't mix types
• Replace every 5-7 years`
      }
    ]
  },
  21: {
    title: 'Lighting Systems',
    sections: [
      {
        heading: 'Vehicle Lights',
        body: `All lights must work correctly. Use them appropriately for conditions. Lights are essential for safety.

Headlights:
• Dipped beam for normal driving
• Main beam for dark roads with no traffic
• Switch to dipped when approaching other vehicles
• Use in fog, rain, snow

Fog Lights:
• Use only in fog or heavy rain/snow
• Must be switched off in good visibility
• Using inappropriately is illegal

Brake Lights:
• Essential safety feature
• Check they work regularly
• Replace failed bulbs immediately

Indicators:
• Signal intention to turn or change lanes
• Use well before turning
• Use on every turn and lane change

Parking Lights:
• Use when vehicle parked on road
• Required in poor visibility
• Use on both sides

Other Lights:
• Number plate lights must work
• Reversing lights warn of backwards movement
• Hazard lights for emergencies
• Keep spare bulbs`
      }
    ]
  },
  22: {
    title: 'Braking Systems',
    sections: [
      {
        heading: 'Brake Safety',
        body: `Brakes must be well maintained. Know your vehicle's stopping distance. Brakes are critical for safety.

Brake Components:
• Brake pads – wear over time
• Brake discs/drums – can wear or warp
• Brake fluid – essential for operation
• Brake pipes – must not leak

Signs of Brake Problems:
• Soft or spongy brake pedal
• Brake pedal goes to floor
• Grinding or squealing noises
• Pulling to one side when braking
• Brake warning light on

Maintenance:
• Service brakes annually
• Replace pads when worn
• Bleed brakes if spongy
• Check fluid level regularly
• Replace fluid every 2 years

Braking Technique:
• Smooth, even pressure
• Don't brake sharply unless emergency
• Progressive braking is smoother
• Avoid sudden movements

Stopping Distances:
• At 30 mph: 75 feet total
• At 50 mph: 175 feet total
• At 70 mph: 315 feet total`
      }
    ]
  },
  23: {
    title: 'Steering and Handling',
    sections: [
      {
        heading: 'Vehicle Control',
        body: `Master steering techniques and understand vehicle handling characteristics. Vehicle control is fundamental.

Steering Technique:
• Use both hands on wheel
• Gentle, smooth inputs
• Avoid sudden steering
• Plan ahead to reduce steering changes

Vehicle Handling:
• Front-wheel drive understeers if pushed hard
• Rear-wheel drive oversteer risk in wet
• All-wheel drive better grip and stability

Turning and Cornering:
• Slow down before corner
• Avoid braking mid-corner
• Use smooth steering
• Avoid acceleration in corner

Aqua-planing:
• Occurs in heavy rain
• Tyres lose contact with road
• Prevention: reduce speed, check tread depth

Skidding:
• Forward skid: ease off accelerator
• Sideways skid: steer into slide
• Avoid panic reactions

Load and Weight Distribution:
• Weight affects handling
• Overloading reduces safety
• Uneven loading causes problems
• Consider weight distribution`
      }
    ]
  },
  24: {
    title: 'Loads and Towing',
    sections: [
      {
        heading: 'Transporting Cargo',
        body: `Secure loads properly. Understand how weight distribution affects driving. Loads significantly affect safety.

Securing Loads:
• Distribute weight evenly
• Place heavy items low and forward
• Secure with straps/nets
• Keep load centered
• Check Maximum Authorized Mass (MAM)
• Don't exceed vehicle capacity

Load Effects on Driving:
• Increases stopping distance
• Affects handling and stability
• Changes vehicle balance
• Can cause swaying (trailers)
• Affects acceleration and braking

Roof Boxes and Racks:
• Increases wind resistance
• Raises center of gravity
• Must be properly secured
• Check weight limits

Towing Trailers:
• Must have appropriate license
• Trailer must have lights
• Brakes required if over 750kg
• Weight distribution important
• Check tire pressures

Towing Technique:
• Reduce speed
• Allow extra braking distance
• Avoid harsh acceleration
• Be gentle with steering
• Watch for sway/snaking`
      }
    ]
  },
  25: {
    title: 'Show Me Tell Me',
    sections: [
      {
        heading: 'Vehicle Safety Questions',
        body: `During your practical test, the examiner will ask you to show or tell them about vehicle safety procedures. This tests your understanding of vehicle maintenance and safety checks.

Show Me Questions (Answer by demonstrating):
• Show how to operate headlights (dipped/main beam)
• Show how to switch on hazard lights
• Show how to operate windscreen wipers
• Show how to operate heated rear window
• Show how to switch on fog lights
• Show how to open bonnet
• Show how to check engine oil level
• Show how to check coolant level

Tell Me Questions (Answer by explaining):
• Explain how you would know if brakes are failing
• Explain how to safely check a tire defect
• Explain what to do if warning lights appear
• Explain tire maintenance requirements
• Explain headlight alignment checks
• Explain legal requirements for tires

Key Points to Remember:
• Know your vehicle controls
• Understand routine maintenance
• Know safety check procedures
• Understand warning signs
• Know legal requirements`
      }
    ]
  },
  26: {
    title: 'Independent Driving',
    sections: [
      {
        heading: 'Navigation and Decision Making',
        body: `Demonstrate your ability to follow directions and make independent decisions while driving. This is a key test of driving competence.

Navigation Methods:
• Using sat-nav/GPS
• Following road signs
• Following given directions
• Memory and observation

Decision Making:
• Route choice
• Speed decisions
• Lane and position selection
• Junction approaches

Hazard Management During Independent Driving:
• Identify hazards early
• React appropriately
• Maintain speed control
• Plan ahead
• Demonstrate safety awareness

Reactions to Unexpected Situations:
• Road closures
• Diversions
• Changed traffic conditions
• Congestion
• Accidents ahead

Test Performance:
• Show you can drive safely independently
• Demonstrate planning
• Prove hazard awareness
• Show good decision making
• Maintain vehicle control`
      }
    ]
  },
  27: {
    title: 'Route Planning',
    sections: [
      {
        heading: 'Journey Planning',
        body: `Plan routes in advance, check traffic conditions and allow extra time. Good planning ensures safe, efficient journeys.

Pre-Journey Planning:
• Check destination address
• Use sat-nav or map
• Identify alternative routes
• Check traffic conditions
• Check weather forecast
• Plan fuel stops
• Allow extra time

Route Selection:
• Fastest route vs. safest route
• Avoid peak traffic times if possible
• Consider road types
• Avoid unfamiliar roads if tired

Traffic Consideration:
• Check real-time traffic
• Use navigation with live updates
• Allow extra time during peak hours
• Peak times typically: morning 7-9am, evening 4-7pm

Time Management:
• Allow buffer time
• Calculate average speed realistically
• Add time for stops

Vehicle Preparation:
• Check fuel
• Check oil and water
• Check tire condition
• Check lights
• Service regularly

Long Journey Tips:
• Start early to avoid darkness
• Stay hydrated
• Stretch regularly
• Change drivers if possible
• Take regular breaks`
      }
    ]
  },
  28: {
    title: 'Test Preparation',
    sections: [
      {
        heading: 'Preparing for Your Test',
        body: `Practice extensively, know the test route and the examiner's requirements. Good preparation increases success.

Practical Skills Preparation:
• Practice in varied conditions
• Dry weather practice
• Wet weather practice
• Night driving practice
• Urban and rural practice
• Junction types
• Parking techniques
• Smooth vehicle control
• Hazard awareness

Test Requirements:
• Legal documents required
  - Valid provisional license
  - Test pass certificate from theory
• Appropriate vehicle
  - Dual controls or suitable for DSA
  - Insurance for test purposes
  - MOT valid
  - Roadworthy condition

Physical and Mental Preparation:
• Get good sleep night before
• Light breakfast
• Stay hydrated
• Arrive early
• Stay calm during test

Route Familiarity:
• Drive test routes several times
• Know where junctions are
• Anticipate hazards on route
• Practice at similar times
• Get familiar with roads

Show Me Tell Me Preparation:
• Learn all vehicle safety checks
• Understand why checks matter
• Know exact locations of controls
• Be confident and precise

During the Test:
• Listen to examiner
• Follow instructions
• Drive as normal
• Stay calm
• Drive smoothly
• Be courteous to others

Test Failure:
• Don't be discouraged
• Book another test
• Learn from mistakes
• Get more practice
• Consider professional instruction`
      }
    ]
  }
};

export default function CourseWorkDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = parseInt(urlParams.get('id')) || null;
  const subcard = urlParams.get('subcard');
  const [showAudioHint, setShowAudioHint] = useState(() => {
    const hasSeenHint = localStorage.getItem('audio_hint_seen');
    return !hasSeenHint && localStorage.getItem('enable_audio_reading') !== 'false';
  });
  const [showLockedDialog, setShowLockedDialog] = useState(false);
  const [showRemoveAllDialog, setShowRemoveAllDialog] = useState(false);

  const currentTopic = courseWorkTopics.find(t => t.id === itemId);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['currentPupil', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return pupils.length > 0 ? pupils[0] : null;
    },
    enabled: !!user?.id && user?.role === 'user'
  });

  const { data: accessList = [] } = useQuery({
    queryKey: ['pupilTopicAccess', pupil?.id],
    queryFn: () => base44.entities.PupilTopicAccess.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const { data: myHomework = [] } = useQuery({
    queryKey: ['myHomework', pupil?.id],
    queryFn: () => base44.entities.HomeworkItem.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const { data: skillAssignment } = useQuery({
    queryKey: ['skillAssignment', pupil?.id, currentTopic?.topicId],
    queryFn: async () => {
      if (!pupil?.id || !currentTopic?.topicId) return null;
      const assignments = await base44.entities.SkillAssignment.filter({
        pupilId: pupil.id,
        skillId: currentTopic.topicId
      });
      return assignments.length > 0 ? assignments[0] : null;
    },
    enabled: !!pupil?.id && !!currentTopic?.topicId
  });

  const { data: topicAccessRecords = [] } = useQuery({
    queryKey: ['topicAccessRecords', itemId],
    queryFn: async () => {
      const currentTopic = courseWorkTopics.find(t => t.id === itemId);
      if (!currentTopic) return [];
      return base44.entities.PupilTopicAccess.filter({ topicId: currentTopic.topicId });
    },
    enabled: !!itemId && !!user?.id && user?.role === 'admin'
  });

  const isInstructor = user?.role === 'admin';
  const { hasValidAccess, isLoading: accessCheckLoading } = useInstructorAccessCheck(pupil);

  // Show loading while checking instructor access (only for pupils)
  if (!isInstructor && pupil && accessCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Restrict access if pupil's instructor doesn't have active subscription
  if (!isInstructor && pupil && !hasValidAccess) {
    return <RestrictedAccessNotice />;
  }

  const content = courseWorkContent[itemId];
  const topicIdStr = currentTopic?.topicId;
  
  // Check if pupil has access via PupilTopicAccess OR via assigned homework
  const access = accessList.find(a => a.topicId === topicIdStr && !a.revokedAt);
  const hasHomeworkAccess = myHomework.some(h => 
    h.status !== 'Completed' &&
    (h.description?.toLowerCase().includes(topicIdStr?.toLowerCase()) ||
     h.title?.toLowerCase().includes(topicIdStr?.toLowerCase()))
  );
  
  // Instructors always have full access
  const hasStudyAccess = isInstructor ? true : (!access || access.grantStudyMaterial !== false || 
    (hasHomeworkAccess && myHomework.some(h => h.description?.toLowerCase().includes('study'))));
  const hasMcqAccess = isInstructor ? true : (!access || access.grantPracticeQuestions !== false || 
    (hasHomeworkAccess && myHomework.some(h => h.description?.toLowerCase().includes('practice'))));
  
  const isTopicLocked = !isInstructor && access && access.grantStudyMaterial === false && access.grantPracticeQuestions === false;

  const dismissAudioHint = () => {
    setShowAudioHint(false);
    localStorage.setItem('audio_hint_seen', 'true');
  };

  // Cards that should NOT have sub-cards
  const excludedCards = [25, 28]; // Show Me Tell Me (25), Test Preparation (28)
  const shouldHaveSubcards = itemId && !excludedCards.includes(itemId);

  // Mark material as opened when studying
  useEffect(() => {
    if (skillAssignment && !skillAssignment.hasOpenedMaterial && (shouldHaveSubcards && subcard === 'study')) {
      base44.entities.SkillAssignment.update(skillAssignment.id, {
        hasOpenedMaterial: true,
        materialOpenedAt: new Date().toISOString()
      }).catch(err => console.error('Failed to mark material as opened:', err));
    }
  }, [skillAssignment, shouldHaveSubcards, subcard]);

  // Combine all section content into one text for audio
  const fullContentText = content?.sections?.map(section => 
    `${section.heading}. ${section.body}`
  ).join('. ') || '';

  const handleSubcardClick = (type) => {
    if (type === 'study' && !hasStudyAccess) {
      setShowLockedDialog(true);
      return;
    }
    if (type === 'practice' && !hasMcqAccess) {
      setShowLockedDialog(true);
      return;
    }
    navigate(createPageUrl('CourseWorkDetail') + `?id=${itemId}&subcard=${type}`);
  };

  // Handle sub-card selection screen (for all cards except excluded ones)
  if (shouldHaveSubcards && !subcard && content) {
    return (
      <CourseWorkSubcardSelect
        itemId={itemId}
        content={content}
        isInstructor={isInstructor}
        hasStudyAccess={hasStudyAccess}
        hasMcqAccess={hasMcqAccess}
      />
    );
  }

  // Handle Practice Questions sub-card (for all cards with sub-cards)
  if (shouldHaveSubcards && subcard === 'practice' && content) {
    // Check access for learners
    if (!hasMcqAccess && !isInstructor) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('CourseWork')}>
              <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
                <ArrowLeft className="w-4 h-4" />
                Back to Course Work
              </Button>
            </Link>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Locked Content</h3>
                <p className="text-slate-600">
                  This content is locked until your instructor assigns it to you. Please ask your instructor to grant you access to this topic's Practice Questions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    const questionPack = questionPacks[itemId];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('CourseWorkDetail') + `?id=${itemId}`}>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to {content.title}
            </Button>
          </Link>
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-8 h-8 text-[#071739]" />
              <h1 className="text-3xl font-bold text-[#071739]">Practice Questions</h1>
            </div>
            <p className="text-slate-500 text-sm">{content.title}</p>
          </div>
          
          {questionPack ? (
            <McqQuizPaginated questionPack={questionPack} topicId={itemId} />
          ) : (
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Practice Questions Yet</h3>
                <p className="text-slate-600">
                  Practice questions for this topic are not yet available. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Handle Study Material sub-card
  if (shouldHaveSubcards && subcard === 'study' && content) {
    if (!hasStudyAccess) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('CourseWork')}>
              <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
                <ArrowLeft className="w-4 h-4" />
                Back to Course Work
              </Button>
            </Link>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-8 text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Locked Content</h3>
                <p className="text-slate-600">
                  This study material is locked. Ask your instructor to grant you access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('CourseWorkDetail') + `?id=${itemId}`}>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to {content.title}
            </Button>
          </Link>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#071739] mb-2">{content.title}</h1>
            <p className="text-slate-500">Study Material</p>
          </div>

          <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Volume2 className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-indigo-900 mb-2">Listen to this lesson</h3>
                  <GoogleTTSAudioPlayer text={fullContentText} />
                </div>
              </div>
            </CardContent>
          </Card>

          {showAudioHint && (
            <Card className="border-l-4 border-l-blue-500 mb-6 bg-blue-50">
              <CardContent className="p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Volume2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Audio Available</p>
                    <p className="text-sm text-blue-700 mt-1">
                      This content can be read aloud. Use the audio player above to listen.
                    </p>
                  </div>
                </div>
                <button onClick={dismissAudioHint} className="text-blue-400 hover:text-blue-600">
                  <X className="w-5 h-5" />
                </button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-8">
            {content.sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">{section.heading}</h2>
                <div className="prose max-w-none text-slate-700 whitespace-pre-wrap">
                  {section.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('CourseWork')}>
          <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Course Work
          </Button>
        </Link>
        <Card className="text-center p-8">
          <p className="text-slate-500">Content not found</p>
        </Card>
      </div>
    </div>
  );
}