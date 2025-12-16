import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';

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
      },
      {
        heading: '2. Vehicle Legal Requirements',
        body: `Before driving, you are legally responsible for making sure the vehicle is safe and legal to use on the road.

2.1 Vehicle Tax
• All vehicles used on public roads must be properly taxed.

2.2 MOT Certificate
• Vehicles over 3 years old must have a valid MOT certificate.
• Driving without a valid MOT can result in a fine of up to £1,000.

2.3 Insurance
• You must have the correct insurance to drive the vehicle.
• Driving without insurance can lead to 6–8 penalty points, unlimited fines and the vehicle being seized.

2.4 Roadworthiness
• Your vehicle must be in a safe, roadworthy condition.
• This includes having legal tyres, effective brakes, working lights and safe steering.
• Driving an unroadworthy vehicle is a criminal offence.

2.5 L Plates / D Plates
• Learner drivers must display L plates clearly at the front and rear of the vehicle.
• In Wales, D plates may be used instead of L plates.`
      },
      {
        heading: '3. Who Can Teach You to Drive?',
        body: `Learners must be properly supervised when driving.

Supervising drivers must:
• Be at least 21 years old.
• Have held a full driving licence for at least 3 years.
• Be qualified to drive the type of vehicle being used (for example, manual or automatic).

Paid driving lessons:
• Only Approved Driving Instructors (ADIs) or trainee driving instructors with a valid trainee licence may charge money for lessons.
• Instructors must display their official ADI or trainee badge on the windscreen during lessons.
• Receiving paid instruction from an unqualified person is illegal.`
      },
      {
        heading: '4. Distractions and Mobile Phones',
        body: `Distractions are a major cause of collisions, and mobile phones are one of the most common distractions.

4.1 Mobile Phone Rules
• It is illegal to use a handheld mobile phone while driving.
• This includes making calls, texting, using apps or checking notifications.
• Even hands-free use can distract your attention from the road.

4.2 Best Practice
• Switch off your phone or put it on silent before you start driving.
• Place your phone out of reach to avoid temptation.

4.3 Supervisors
• Supervising drivers must also follow mobile phone laws.
• They share responsibility for the safety of the vehicle and the learner driver.`
      },
      {
        heading: '5. Accidents and Emergencies',
        body: `If you are involved in a collision, there are specific legal duties you must follow.

After a collision you MUST:
• Stop at the scene.
• Provide your name and address.
• Provide your insurance details.
• Provide the vehicle owner's details if different from the driver.

If details are not exchanged at the scene, you must report the incident to the police within 24 hours.

Failing to stop or failing to report an accident is a criminal offence.`
      },
      {
        heading: '6. Other Legal Responsibilities',
        body: `As a driver or learner driver, you have several ongoing legal responsibilities.

You must:
• Keep your driving licence details up to date, including your name and address.
• Maintain legal eyesight standards at all times.
• Inform the DVLA of any medical condition that affects your ability to drive.
• Follow all relevant rules set out in the Highway Code.
• Make sure you hold the correct licence category for the vehicle you are driving.

Understanding and following these legal responsibilities helps keep you, your passengers and other road users safe.`
      }
    ]
  },
  2: {
    title: 'Safety Checks – FLOWER',
    sections: [
      {
        heading: '1. Safety Checks Before You Drive',
        body: `Before you start the engine, it is essential that your car is in good working order. You should know what to check, how to check it and how often to do it.

A simple way to remember the key safety checks is to think of the word FLOWER. Each letter stands for an important part of the vehicle that you should check before driving.`
      },
      {
        heading: '2. FLOWER – Key Pre-Drive Checks',
        body: `Use the acronym FLOWER to remember the main checks:

• F – Fuel
• L – Lights
• O – Oil
• W – Water / Screenwash / Coolant
• E – Electrics
• R – Rubber (Tyres)

Each of these checks helps ensure your vehicle is safe, reliable and legal before you set off.`
      },
      {
        heading: '3. F – Fuel',
        body: `Think of a fuel pump icon to represent this check.

Before every journey, ask yourself:
• Do I have enough fuel for the whole journey?
• If not, where will I refuel on the way?

Running low on fuel can be dangerous, especially on motorways or in unfamiliar areas, so always plan ahead.`
      },
      {
        heading: '4. L – Lights',
        body: `Think of a headlight beam icon to represent your lights.

You should check that:
• All headlights, rear lights, brake lights and indicators are working.
• Lights are clean so that other road users can see you clearly.

You can walk around the car to check the lights or ask someone to help you. Using reflections in windows or mirrors can also help when checking on your own.`
      },
      {
        heading: '5. O – Oil',
        body: `Think of an oil can or oil drop icon for this check.

You should know:
• Where the engine oil dipstick is located.
• How to check the engine oil level and top it up if needed.
• Where and how to check the level of brake fluid.

Low oil can cause serious engine damage, and low brake fluid can affect your braking performance, so these checks are extremely important.`
      },
      {
        heading: '6. W – Water, Screenwash and Coolant',
        body: `Think of a water droplet icon to represent this section.

You should know:
• Where the coolant reservoir is and how to check that the level is between the minimum and maximum marks.
• Where the screenwash bottle is and how to ensure it is topped up.
• How to check that wiper blades are in good condition and not damaged.

Correct coolant levels help prevent the engine from overheating, while clean screenwash and working wipers keep your windscreen clear for good visibility.`
      },
      {
        heading: '7. E – Electrics',
        body: `Think of a battery symbol or lightning bolt for your electrical checks.

You should:
• Make sure the battery appears secure and in good condition.
• Check that indicators, horn and other warning devices are working.
• Look out for any warning lights on the dashboard that stay on after the engine starts.

Good electrics are essential for safe communication with other road users and for the correct operation of safety systems.`
      },
      {
        heading: '8. R – Rubber (Tyres)',
        body: `Think of a tyre icon for this check.

You should check:
• Tyre pressure is at the correct level for your vehicle (check the vehicle handbook or door frame sticker).
• Tread depth is at least the legal minimum of 1.6 mm across the central three-quarters of the tyre and around the full circumference.
• Tyre condition for cuts, bulges, uneven wear or any visible damage.

Tyres are vital for grip, braking and stability. Worn or damaged tyres are dangerous and illegal.`
      },
      {
        heading: '9. Final Pre-Drive Checks',
        body: `In addition to the FLOWER checks, you should always make sure your brakes and steering are working properly before you drive.

• Press the brake pedal to confirm it feels firm and responsive.
• Move the steering wheel slightly to ensure it turns smoothly.
• Check for any unusual noises or warning lights.

Completing these checks before every journey helps keep you, your passengers and other road users safe.`
      }
    ]
  },
  3: {
    title: 'Security',
    sections: [
      {
        heading: '1. Security Overview',
        body: `Security involves protecting your vehicle, its contents and your own personal safety. By staying aware of potential risks and taking simple precautions, you can significantly reduce the chance of theft, damage or harm.`
      },
      {
        heading: '2. Stay Alert at All Times',
        body: `Remain aware of your surroundings whenever you are:
• Approaching your vehicle
• Getting in or out of the car
• Stopped in traffic or at junctions

Avoid distractions that reduce your awareness, such as unnecessary mobile phone use or wearing headphones that block out external sounds.`
      },
      {
        heading: '3. Let Someone Know Your Plans',
        body: `Where possible, tell a trusted person:
• Where you are going
• When you expect to arrive
• When you plan to return

This is especially important when driving alone, travelling at night or going to unfamiliar locations.`
      },
      {
        heading: '4. Protect Your Belongings',
        body: `Keep important or valuable items out of sight while you are in or away from the car. For example:
• Store bags, electronic devices and documents in the glovebox, boot or under a seat
• Avoid leaving items visible on seats or the dashboard

A visible item can tempt opportunistic thieves, even if the vehicle is locked.`
      },
      {
        heading: '5. Choose a Secure Place to Park',
        body: `Whenever possible, choose a parking place that is:
• Well lit
• Busy and overlooked by nearby buildings
• Covered by CCTV or security patrols

Avoid leaving your car in isolated or poorly lit areas, particularly at night or for long periods of time.`
      },
      {
        heading: '6. Use Additional Security Measures',
        body: `You can reduce the risk of theft by fitting extra security devices, such as:
• A steering wheel lock
• An immobiliser
• An alarm system
• Vehicle tracking devices or window etching

These measures make your vehicle less attractive to thieves and may help deter or detect crime.`
      }
    ]
  },
  4: {
    title: 'Cockpit Drill / DSSSM Routine',
    sections: [
      {
        heading: '1. Cockpit Drill / DSSSM Overview',
        body: `The Cockpit Drill, also known as the DSSSM Routine, is a set of essential safety checks that must be carried out every time you get into the car before driving. These checks ensure you are safe, comfortable and fully in control of the vehicle.

DSSSM stands for:
• D – Doors
• S – Seat
• S – Steering
• S – Seatbelt
• M – Mirrors

Completing these checks before every journey helps reduce risks and ensures good driving habits.`
      },
      {
        heading: '2. Doors',
        body: `Make sure all doors are properly closed and secure before you begin your journey.

You should:
• Check visually that each door is shut
• Listen for the click when closing
• Look for any door-warning lights on the dashboard

Loose or open doors can be dangerous and may distract you or harm passengers.`
      },
      {
        heading: '3. Seat',
        body: `Adjust your seat so you can reach all the controls comfortably and safely.

Your seat position is correct when:
• You can fully press the clutch without stretching
• Your arms are slightly bent when holding the steering wheel
• You are sitting upright with proper back support
• You have a clear view of the road and mirrors

A proper seating position improves comfort, control and reaction time.`
      },
      {
        heading: '4. Steering',
        body: `Check that the steering wheel is correctly positioned and secure.

Ensure that:
• You can turn the wheel fully without leaning forward
• The wheel is firmly locked in place (if adjustable)
• Nothing obstructs your view of the dashboard

Smooth and comfortable steering control is essential for safe driving.`
      },
      {
        heading: '5. Seatbelt',
        body: `Seatbelts must be worn by the driver and all passengers before the vehicle moves.

Check that your seatbelt:
• Is not twisted
• Clicks securely into place
• Fits properly across your chest and hips

Drivers are legally responsible for ensuring that children under 14 are properly restrained.`
      },
      {
        heading: '6. Mirrors',
        body: `Adjust all mirrors to maximise visibility and reduce blind spots before you move off.

Interior Mirror:
• Should provide a clear view directly through the rear window

Right Door Mirror:
• Should show the road behind and a small part of the vehicle's side

Left Door Mirror:
• Helps you see cyclists, pedestrians and approaching vehicles on the left

Mirrors must never be adjusted while driving. Always set them before starting your journey.`
      },
      {
        heading: '7. Summary',
        body: `The Cockpit Drill and the DSSSM Routine follow the same essential checks. Before driving, always complete the following:

1. Doors – Confirm all doors are securely closed
2. Seat – Adjust for comfort, control and visibility
3. Steering – Ensure correct position and free movement
4. Seatbelt – Fasten securely and check passengers
5. Mirrors – Adjust for maximum visibility

Performing these checks every time you get into the vehicle ensures you start every journey safely and confidently.`
      }
    ]
  }
};

export default function CourseWorkDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = parseInt(urlParams.get('id'));
  const content = courseWorkContent[itemId];

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('CourseWork')}>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Course Work
            </Button>
          </Link>
          <p className="text-slate-500 text-center">Content not available yet</p>
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

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[#071739]" />
            <h1 className="text-3xl font-bold text-[#071739]">{content.title}</h1>
          </div>
          <p className="text-slate-500 text-sm">Last updated: December 2025</p>
        </div>

        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-8 space-y-8">
            {content.sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-xl font-bold text-[#071739] mb-4">{section.heading}</h2>
                <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {section.body}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Mobrage Driving Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}